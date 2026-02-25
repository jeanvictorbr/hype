const { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    MessageFlags,
    AttachmentBuilder,
    EmbedBuilder
} = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateHypeCard } = require('../../../utils/canvasCard');

module.exports = {
    customId: 'eco_return_main',

    async execute(interaction, client) {
        // 1. Avisa que vai processar e segura a interação
        await interaction.deferUpdate();

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            let [userProfile, config] = await Promise.all([
                prisma.hypeUser.findUnique({ where: { id: userId } }),
                prisma.vipConfig.findUnique({ where: { guildId } })
            ]);

            // ==========================================
            // GERAÇÃO DO CARTÃO HYPE (SE NÃO TIVER)
            // ==========================================
            if (!userProfile || !userProfile.cardNumber) {
                const randomHex = () => Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0');
                const newCardNumber = `HYPE-${randomHex()}-${randomHex()}`;

                userProfile = await prisma.hypeUser.upsert({
                    where: { id: userId },
                    update: { cardNumber: newCardNumber },
                    create: { id: userId, cardNumber: newCardNumber }
                });
            }

            // ==========================================
            // VERIFICAÇÃO DE NÍVEIS VIP E VALIDADE
            // ==========================================
            const member = interaction.member;
            let vipRealLevel = 0;
            let txtVip = "Membro Comum";
            let colorAccent = '#2b2d31'; // Cor compatível com Embed V1
            let txtValidade = "";

            if (userProfile.vipLevel >= 5) {
                vipRealLevel = 5; txtVip = "⭐ SUPREME"; colorAccent = '#ED4245'; 
            }
            else if (userProfile.vipLevel === 4) {
                vipRealLevel = 4; txtVip = "⭐ ELITE"; colorAccent = '#FEE75C'; 
            }
            else if (userProfile.vipLevel === 3 || (config?.roleVip3 && member.roles.cache.has(config.roleVip3))) {
                vipRealLevel = 3; txtVip = "⭐ EXCLUSIVE"; colorAccent = '#9b59b6'; 
            } 
            else if (userProfile.vipLevel === 2 || (config?.roleVip2 && member.roles.cache.has(config.roleVip2))) {
                vipRealLevel = 2; txtVip = "⭐ PRIME"; colorAccent = '#ffffff'; 
            } 
            else if (userProfile.vipLevel === 1 || (config?.roleVip1 && member.roles.cache.has(config.roleVip1))) {
                vipRealLevel = 1; txtVip = "⭐ VIP BOOSTER"; colorAccent = '#ff85cd'; 
            }

            if (vipRealLevel > 0 && userProfile.vipExpiresAt) {
                const now = new Date();
                const expires = new Date(userProfile.vipExpiresAt);
                const diffTime = expires - now;
                const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diasRestantes > 0) {
                    txtValidade = `(Vence em ${diasRestantes} dias)`;
                } else {
                    txtVip = "⚠️ Expirado"; colorAccent = '#ED4245'; txtValidade = "";
                }
            } else if (vipRealLevel > 0) {
                txtValidade = `(Plano Vitalício)`;
            }

            const saldoFormatado = (userProfile.hypeCash || 0).toLocaleString('pt-BR');

            // ==========================================
            // REGERA A IMAGEM DO CARTÃO 
            // ==========================================
            const cardBuffer = await generateHypeCard(
                interaction.user,
                userProfile.cardNumber,
                saldoFormatado,
                vipRealLevel,
                txtVip,
                txtValidade
            );
            
            const attachment = new AttachmentBuilder(cardBuffer, { name: 'hypecard.png' });

            const embed = new EmbedBuilder()
                .setColor(colorAccent)
                .setImage('attachment://hypecard.png');

            // Botões do Painel Inicial
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('eco_user_store').setLabel('Lojinha Hype').setStyle(ButtonStyle.Primary).setEmoji('🛒'),
                new ButtonBuilder().setCustomId('eco_user_daily').setLabel('Pegar Daily').setStyle(ButtonStyle.Success).setEmoji('🎁'),
                new ButtonBuilder().setCustomId('eco_user_config').setLabel('Benefícios VIP').setStyle(ButtonStyle.Secondary).setEmoji('💎')
            );

            // 👇 A MÁGICA DA ROBUSTEZ ESTÁ AQUI
            // Como a API não deixa tirar o modo V2, nós DESTRUÍMOS a Lojinha
            // e mandamos o Bot enviar o Cartão por cima!
            
            await interaction.deleteReply().catch(() => {}); // Apaga a Lojinha/Benefícios/Daily

            await interaction.followUp({ 
                embeds: [embed], 
                components: [row], 
                files: [attachment], 
                flags: [MessageFlags.Ephemeral] // Envia como uma NOVA mensagem privada
            });

        } catch (error) {
            console.error('❌ Erro ao voltar ao menu principal:', error);
        }
    }
};