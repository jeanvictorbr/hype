const { 
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
    customId: 'dev_guild_manage',

    async execute(interaction, client) {
        const guildId = interaction.values ? interaction.values[0] : null;
        if (!guildId || guildId === 'none') return interaction.reply({ content: '❌ Seleção inválida.', flags: [MessageFlags.Ephemeral] });
        
        // Busca dados
        const discordGuild = client.guilds.cache.get(guildId);
        let dbGuild = await prisma.guild.findUnique({ where: { id: guildId } });
        if (!dbGuild) dbGuild = await prisma.guild.create({ data: { id: guildId } });

        // ==========================================
        // 🧮 CÁLCULO DE LICENÇA (DIAS RESTANTES)
        // ==========================================
        let statusText = "🌑 Plano Gratuito";
        let daysRemaining = 0;
        let expireDateString = "Indefinido";
        let color = 0x2b2d31; // Cinza (Free)

        if (dbGuild.vipExpiresAt) {
            const now = new Date();
            const expiration = new Date(dbGuild.vipExpiresAt);
            const diffTime = expiration - now;
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (daysRemaining > 0) {
                statusText = `💎 Premium Ativo`;
                expireDateString = expiration.toLocaleDateString('pt-BR');
                color = 0xFEE75C; // Dourado
            } else {
                statusText = `⚠️ Premium Expirado`;
                color = 0xED4245; // Vermelho
            }
        }

        const featuresList = dbGuild.features.length > 0 ? dbGuild.features.join(', ') : 'Nenhuma';

        // ==========================================
        // 🎨 UI DO PAINEL DE GESTÃO
        // ==========================================
        const header = new TextDisplayBuilder()
            .setContent(`# 🎛️ Gerenciando: ${discordGuild ? discordGuild.name : 'Desconhecido'}\nID: \`${guildId}\``);

        const stats = new TextDisplayBuilder()
            .setContent(`**Status:** ${statusText}\n**Vencimento:** ${expireDateString} (${daysRemaining} dias)\n**Módulos:** \`[${featuresList}]\``);

        const divider = new SeparatorBuilder();

        // Botões de Tempo (VIP)
        const rowTime = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`dev_vip_add_7_${guildId}`).setLabel('+7 Dias').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`dev_vip_add_30_${guildId}`).setLabel('+30 Dias').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`dev_vip_set_lifetime_${guildId}`).setLabel('👑 Lifetime').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`dev_vip_remove_${guildId}`).setLabel('🛑 Remover VIP').setStyle(ButtonStyle.Danger)
        );

        // Botões de Features
        const rowFeatures = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`dev_feat_toggle_tickets_${guildId}`).setLabel('Tickets (Toggle)').setStyle(ButtonStyle.Secondary).setEmoji('🎫'),
            new ButtonBuilder().setCustomId(`dev_feat_toggle_autovoice_${guildId}`).setLabel('Voice (Toggle)').setStyle(ButtonStyle.Secondary).setEmoji('🔊')
        );

        const container = new ContainerBuilder()
            .setAccentColor(color)
            .addTextDisplayComponents(header)
            .addSeparatorComponents(divider)
            .addTextDisplayComponents(stats)
            .addSeparatorComponents(new SeparatorBuilder())
            .addActionRowComponents(rowTime, rowFeatures);

        await interaction.update({
            components: [container],
            flags: [MessageFlags.IsComponentsV2]
        });
    }
};