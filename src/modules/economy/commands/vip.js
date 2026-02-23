const { 
    SlashCommandBuilder, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vip')
        .setDescription('💳 Acesse seu Cartão Hype, saldo e benefícios'),

    async execute(interaction, client) {
        // Mensagem ephemeral para que apenas o jogador veja o seu saldo
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            // 1. Busca as informações do Usuário e da Guilda
            let [userProfile, config] = await Promise.all([
                prisma.hypeUser.findUnique({ where: { id: userId } }),
                prisma.vipConfig.findUnique({ where: { guildId } })
            ]);

            // ==========================================
            // GERAÇÃO DO CARTÃO HYPE (SE NÃO TIVER)
            // ==========================================
            if (!userProfile || !userProfile.cardNumber) {
                // Gera um número único no formato HYPE-XXXX-YYYY
                const randomHex = () => Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0');
                const newCardNumber = `HYPE-${randomHex()}-${randomHex()}`;

                userProfile = await prisma.hypeUser.upsert({
                    where: { id: userId },
                    update: { cardNumber: newCardNumber },
                    create: { id: userId, cardNumber: newCardNumber }
                });
            }

            // ==========================================
            // VERIFICAÇÃO DE VIP (BANCO + CARGOS DO DISCORD)
            // ==========================================
            const member = interaction.member;
            let vipRealLevel = 0;
            let txtVip = "Membro Comum";
            let colorAccent = 0x2b2d31; // Cor padrão (cinza escuro)
            let txtValidade = "";

            // Verifica primeiro o VIP 3 (Dono do Baile)
            if (userProfile.vipLevel >= 3 || (config?.roleVip3 && member.roles.cache.has(config.roleVip3))) {
                vipRealLevel = 3; 
                txtVip = "🥇 Dono do Baile"; 
                colorAccent = 16766720; // Dourado
            } 
            // Se não for, verifica o VIP 2 (Camarote)
            else if (userProfile.vipLevel >= 2 || (config?.roleVip2 && member.roles.cache.has(config.roleVip2))) {
                vipRealLevel = 2; 
                txtVip = "🥈 Camarote"; 
                colorAccent = 12632256; // Prateado
            } 
            // Se não for, verifica o VIP 1 (Pista Premium)
            else if (userProfile.vipLevel >= 1 || (config?.roleVip1 && member.roles.cache.has(config.roleVip1))) {
                vipRealLevel = 1; 
                txtVip = "🥉 Pista Premium"; 
                colorAccent = 13467442; // Bronze
            }

            // CALCULAR VALIDADE
            if (vipRealLevel > 0 && userProfile.vipExpiresAt) {
                const now = new Date();
                const expires = new Date(userProfile.vipExpiresAt);
                const diffTime = expires - now;
                const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diasRestantes > 0) {
                    txtValidade = ` *(Vence em ${diasRestantes} dias)*`;
                } else {
                    txtVip = "⚠️ VIP Expirado"; 
                    colorAccent = 0xED4245; // Vermelho
                    txtValidade = "";
                }
            } else if (vipRealLevel > 0) {
                txtValidade = ` *(Vitalício / Cargo)*`;
            }

            // ==========================================
            // CONSTRUIR A INTERFACE DO CARTÃO
            // ==========================================
            const header = new TextDisplayBuilder()
                .setContent(`# 💳 Seu Cartão Hype\nBem-vindo de volta ao seu painel financeiro, ${interaction.user}.`);

            const saldoFormatado = (userProfile.hypeCash || 0).toLocaleString('pt-BR');

            const status = new TextDisplayBuilder()
                .setContent(`**💳 Número do Cartão:** \`${userProfile.cardNumber}\`\n**👑 Status VIP:** ${txtVip}${txtValidade}\n**💰 Saldo Atual:** **${saldoFormatado}** HypeCash`);

            // 4. Botões Interativos
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('eco_user_store')
                    .setLabel('Lojinha Hype')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🛒'),
                new ButtonBuilder()
                    .setCustomId('eco_user_daily')
                    .setLabel('Pegar Daily')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🎁'),
                new ButtonBuilder()
                    .setCustomId('eco_user_config')
                    .setLabel('Benefícios VIP')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('💎')
            );

            const container = new ContainerBuilder()
                .setAccentColor(colorAccent)
                .addTextDisplayComponents(header)
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(status)
                .addSeparatorComponents(new SeparatorBuilder())
                .addActionRowComponents(row);

            await interaction.editReply({
                components: [container],
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
            });

        } catch (error) {
            console.error('❌ Erro ao abrir painel VIP:', error);
            await interaction.editReply({ 
                content: '❌ Erro ao acessar o banco de dados. Tente novamente mais tarde.' 
            });
        }
    }
};