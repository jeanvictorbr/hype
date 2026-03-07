const { EmbedBuilder, MessageFlags, WebhookClient } = require('discord.js');
const { prisma } = require('../../../core/database');
const { checkPaymentStatus } = require('../../../utils/mercadopago');


module.exports = {
    customIdPrefix: 'eco_check_pix_',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        // Extrai o ID do pagamento e os parâmetros
        const parts = interaction.customId.replace('eco_check_pix_', '').split('_');
        const paymentId = parts[0];
        const type = parts[1];
        
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        let isVip = false;
        let isCoins = false;
        let level = null;
        let coinAmount = null;
        let coinPrice = null;

        if (type === 'vip') {
            isVip = true;
            level = parseInt(parts[2]);
        } else if (type === 'coins') {
            isCoins = true;
            coinAmount = parseInt(parts[2]);
            coinPrice = parseFloat(parts[3]);
        } else {
            // Compatibilidade com pix antigos pendentes
            isVip = true;
            level = parseInt(parts[1]);
        }

        try {
            // 🛡️ 1. Proteção Anti-Duplicação
            const existingSale = await prisma.vipSale.findFirst({ where: { paymentId: paymentId } });
            if (existingSale) {
                return interaction.editReply('❌ Este pagamento já foi processado e o seu produto já foi entregue!');
            }

            const config = await prisma.vipConfig.findUnique({ where: { guildId } });
            const mpToken = config?.mpAccessToken;
            if (!mpToken) return interaction.editReply('❌ Erro: Token do Mercado Pago ausente.');

            // 3. VERIFICA O STATUS
            const status = await checkPaymentStatus(mpToken, paymentId);

            if (status === 'pending') {
                return interaction.editReply('⏳ **Pagamento pendente.** A grana ainda não caiu. Se você acabou de pagar, o banco pode demorar uns segundos. Tente novamente!');
            }

            if (status !== 'approved') {
                return interaction.editReply('❌ O seu código PIX expirou ou foi cancelado. Gere um novo em `/comprarvip`.');
            }

            // ==========================================
            // 💰 PIX APROVADO! FAZ A ENTREGA
            // ==========================================
            let price = 0;
            let planName = '';

            if (isVip) {
                const prices = { 
                    1: config?.priceVip1 || 10, 2: config?.priceVip2 || 25, 3: config?.priceVip3 || 40,
                    4: config?.priceVip4 || 60, 5: config?.priceVip5 || 100 
                };
                const names = { 1: 'BOOSTER', 2: 'PRIME', 3: 'EXCLUSIVE', 4: 'ELITE', 5: 'SUPREME' };
                price = prices[level];
                planName = `VIP ${names[level]}`;

                // ATIVA VIP 30 DIAS
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 30);

                await prisma.hypeUser.upsert({
                    where: { id: userId },
                    update: { vipLevel: level, vipExpiresAt: expiresAt },
                    create: { id: userId, vipLevel: level, vipExpiresAt: expiresAt }
                });

                // Entrega o Cargo
                const member = await interaction.guild.members.fetch(userId).catch(()=>null);
                let roleGiven = null;
                if (level === 1 && config?.roleVip1) roleGiven = config.roleVip1;
                if (level === 2 && config?.roleVip2) roleGiven = config.roleVip2;
                if (level === 3 && config?.roleVip3) roleGiven = config.roleVip3;
                if (level === 4 && config?.roleVip4) roleGiven = config.roleVip4;
                if (level === 5 && config?.roleVip5) roleGiven = config.roleVip5;

                if (member && roleGiven) {
                    const rolesToRemove = [config.roleVip1, config.roleVip2, config.roleVip3, config.roleVip4, config.roleVip5].filter(Boolean);
                    await member.roles.remove(rolesToRemove).catch(() => {});
                    await member.roles.add(roleGiven).catch(() => {});
                }

            } else if (isCoins) {
                price = coinPrice;
                let formattedAmount = coinAmount >= 1000000000 ? `${coinAmount / 1000000000}B` : `${coinAmount / 1000000}M`;
                planName = `${formattedAmount} Hype Coins`;

                // INJETA O DINHEIRO NA CARTEIRA
                await prisma.hypeUser.upsert({
                    where: { id: userId },
                    update: { carteira: { increment: coinAmount } },
                    create: { id: userId, carteira: coinAmount }
                });

                // LANÇA NO EXTRATO BANCÁRIO!
               // await addTransaction(userId, 'IN', coinAmount, `Loja Web: Compra de ${formattedAmount} Coins`);
            }

            // A) Divisão Societária
            const devShare = price * 0.40;
            const clientShare = price * 0.60;

            // B) Salva a Venda
            await prisma.vipSale.create({
                data: {
                    guildId, userId, planLevel: isVip ? level : 0, planName,
                    price, devShare, clientShare, status: 'APPROVED', 
                    paymentId: paymentId, approvedAt: new Date()
                }
            });

            // E) Atualiza a mensagem original para sumir com o QR Code
            const successEmbed = new EmbedBuilder()
                .setTitle('🎉 PAGAMENTO APROVADO!')
                .setColor('#57F287')
                .setDescription(`O seu PIX de **R$ ${price.toFixed(2)}** foi aprovado com sucesso!\nO seu produto **${planName}** já está na conta.\n\n${isVip ? '👉 Use `/vip` ou `hvip` para abrir o seu painel.' : '👉 Use `hcarteira` ou `hextrato` para ver o seu dinheiro!'}`);

            await interaction.message.edit({ content: '', embeds: [successEmbed], components: [], files: [] }).catch(()=>{});
            await interaction.editReply('✅ Tudo certo! Aproveite o seu produto.');

            // F) 🚨 NOTIFICAÇÃO PARA O DEV WEBHOOK (Sua porcentagem!)
            const webhookUrl = process.env.DEV_WEBHOOK_URL;
            if (webhookUrl) {
                try {
                    const webhook = new WebhookClient({ url: webhookUrl });
                    const devEmbed = new EmbedBuilder()
                        .setTitle('💰 NOVA VENDA CONFIRMADA!')
                        .setColor('#57F287')
                        .addFields(
                            { name: 'Servidor', value: `${interaction.guild.name} (\`${guildId}\`)`, inline: true },
                            { name: 'Comprador', value: `<@${userId}>`, inline: true },
                            { name: 'Produto', value: `${planName}`, inline: true },
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