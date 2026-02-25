const { 
    SlashCommandBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    MessageFlags,
    EmbedBuilder,
    AttachmentBuilder
} = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateHypeCard } = require('../../../utils/canvasCard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vip')
        .setDescription('💳 Acesse seu Cartão Hype, saldo e benefícios'),

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            let [userProfile, config] = await Promise.all([
                prisma.hypeUser.findUnique({ where: { id: userId } }),
                prisma.vipConfig.findUnique({ where: { guildId } })
            ]);

            // GERAÇÃO DO CARTÃO HYPE
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
            // VERIFICAÇÃO DOS 5 NÍVEIS VIP
            // ==========================================
            const member = interaction.member;
            let vipRealLevel = 0;
            let txtVip = "Membro Comum";
            let colorAccent = '#2b2d31'; 
            let txtValidade = "";

            if (userProfile.vipLevel >= 5) {
                vipRealLevel = 5; txtVip = "⭐ VIP SUPREME"; colorAccent = '#ED4245'; // Vermelho
            }
            else if (userProfile.vipLevel === 4) {
                vipRealLevel = 4; txtVip = "⭐ VIP ELITE"; colorAccent = '#FEE75C'; // Dourado
            }
            else if (userProfile.vipLevel === 3 || (config?.roleVip3 && member.roles.cache.has(config.roleVip3))) {
                vipRealLevel = 3; txtVip = "⭐ VIP EXCLUSIVE"; colorAccent = '#9b59b6'; // Roxo (Holográfico)
            } 
            else if (userProfile.vipLevel === 2 || (config?.roleVip2 && member.roles.cache.has(config.roleVip2))) {
                vipRealLevel = 2; txtVip = "⭐ VIP PRIME"; colorAccent = '#ffffff'; // Branco/Prata
            } 
            else if (userProfile.vipLevel === 1 || (config?.roleVip1 && member.roles.cache.has(config.roleVip1))) {
                vipRealLevel = 1; txtVip = "⭐ VIP BOOSTER"; colorAccent = '#ff85cd'; // Rosa Pink
            }

            // CALCULAR VALIDADE
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

            // 🎨 GERA A IMAGEM DO CARTÃO PREMIUM
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

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('eco_user_store').setLabel('Lojinha Hype').setStyle(ButtonStyle.Primary).setEmoji('🛒'),
                new ButtonBuilder().setCustomId('eco_user_daily').setLabel('Pegar Daily').setStyle(ButtonStyle.Success).setEmoji('🎁'),
                new ButtonBuilder().setCustomId('eco_user_config').setLabel('Benefícios VIP').setStyle(ButtonStyle.Secondary).setEmoji('💎')
            );

            await interaction.editReply({
                embeds: [embed],
                files: [attachment],
                components: [row]
            });

        } catch (error) {
            console.error('❌ Erro ao abrir painel VIP:', error);
            await interaction.editReply({ content: '❌ Erro ao gerar o seu Cartão Hype. Tente novamente.' });
        }
    }
};