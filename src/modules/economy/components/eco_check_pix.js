const { EmbedBuilder, MessageFlags, WebhookClient } = require('discord.js');
const { prisma } = require('../../../core/database');
const { checkPaymentStatus } = require('../../../utils/mercadopago');

module.exports = {
    customIdPrefix: 'eco_check_pix_',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        // Extrai o ID do pagamento e o Nível do botão
        const parts = interaction.customId.replace('eco_check_pix_', '').split('_');
        const paymentId = parts[0];
        const level = parseInt(parts[1]);
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        try {
            // 🛡️ 1. Proteção Anti-Duplicação
            const existingSale = await prisma.vipSale.findFirst({ where: { paymentId: paymentId } });
            if (existingSale) {
                return interaction.editReply('❌ Este pagamento já foi processado e o seu cargo já foi entregue!');
            }

            // 2. Busca Configurações
            const config = await prisma.vipConfig.findUnique({ where: { guildId } });
            const mpToken = config?.mpAccessToken;
            if (!mpToken) return interaction.editReply('❌ Erro: Token do Mercado Pago ausente.');

            // 3. VERIFICA O STATUS DIRETAMENTE NA API DO MERCADO PAGO
            const status = await checkPaymentStatus(mpToken, paymentId);

            if (status === 'pending') {
                return interaction.editReply('⏳ **Pagamento pendente.** A grana ainda não caiu. Se você acabou de pagar, o banco pode demorar uns segundos. Tente clicar novamente!');
            }

            if (status !== 'approved') {
                return interaction.editReply('❌ O seu código PIX expirou ou foi cancelado. Gere um novo com `/comprarvip`.');
            }

            // ==========================================
            // 💰 PIX APROVADO! FAZ A ENTREGA E DIVIDE O LUCRO
            // ==========================================
            const prices = { 1: config?.priceVip1 || 15, 2: config?.priceVip2 || 30, 3: config?.priceVip3 || 50 };
            const names = { 1: 'Pista Premium', 2: 'Camarote', 3: 'Dono do Baile' };
            const price = prices[level];
            const planName = names[level];

            // A) Divisão Societária
            const devShare = price * 0.40;
            const clientShare = price * 0.60;

            // B) Salva a Venda
            await prisma.vipSale.create({
                data: {
                    guildId, userId, planLevel: level, planName,
                    price, devShare, clientShare, status: 'APPROVED', 
                    paymentId: paymentId, approvedAt: new Date()
                }
            });

            // C) 🗓️ ATIVA O VIP POR 30 DIAS EXATOS
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30);

            await prisma.hypeUser.upsert({
                where: { id: userId },
                update: { vipLevel: level, vipExpiresAt: expiresAt },
                create: { id: userId, vipLevel: level, vipExpiresAt: expiresAt }
            });

            // D) Entrega o Cargo no Servidor
            const member = await interaction.guild.members.fetch(userId).catch(()=>null);
            let roleGiven = null;
            if (level === 1 && config?.roleVip1) roleGiven = config.roleVip1;
            if (level === 2 && config?.roleVip2) roleGiven = config.roleVip2;
            if (level === 3 && config?.roleVip3) roleGiven = config.roleVip3;

            if (member && roleGiven) {
                // Tira VIPs antigos para não acumular
                const rolesToRemove = [config.roleVip1, config.roleVip2, config.roleVip3].filter(Boolean);
                await member.roles.remove(rolesToRemove).catch(() => {});
                await member.roles.add(roleGiven).catch(() => {});
            }

            // E) Atualiza a mensagem original para sumir com o QR Code e os Botões
            const successEmbed = new EmbedBuilder()
                .setTitle('🎉 VIP ATIVADO!')
                .setColor('#57F287')
                .setDescription(`O seu PIX de **R$ ${price.toFixed(2)}** foi aprovado!\nO seu acesso **${planName}** já está na conta e é válido por **30 dias**.\n\n👉 Use \`hvip\` para abrir o seu painel de poderes.`);

            await interaction.message.edit({ content: '', embeds: [successEmbed], components: [], files: [] }).catch(()=>{});
            await interaction.editReply('✅ Tudo certo! Aproveite o seu VIP.');

            // F) 🚨 NOTIFICAÇÃO DO COFRE PARA O SEU WEBHOOK
            const webhookUrl = process.env.DEV_WEBHOOK_URL;
            if (webhookUrl) {
                try {
                    const webhook = new WebhookClient({ url: webhookUrl });
                    const devEmbed = new EmbedBuilder()
                        .setTitle('💰 NOVA VENDA VIP CONFIRMADA!')
                        .setColor('#57F287')
                        .addFields(
                            { name: 'Servidor', value: `${interaction.guild.name} (\`${guildId}\`)`, inline: true },
                            { name: 'Comprador', value: `<@${userId}>`, inline: true },
                            { name: 'Plano', value: `${planName}`, inline: true },
                            { name: 'Total', value: `R$ ${price.toFixed(2)}`, inline: true },
                            { name: 'Sua Parte (40%)', value: `**R$ ${devShare.toFixed(2)}**`, inline: true },
                            { name: 'Cliente (60%)', value: `R$ ${clientShare.toFixed(2)}`, inline: true }
                        )
                        .setTimestamp();
                    await webhook.send({ embeds: [devEmbed] });
                } catch (e) {}
            }

        } catch (error) {
            console.error('Erro ao verificar PIX:', error);
            await interaction.editReply('❌ Houve um erro de comunicação com o banco. Tente novamente em instantes.');
        }
    }
};