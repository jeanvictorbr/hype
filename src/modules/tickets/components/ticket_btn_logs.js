const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder,
    ActionRowBuilder, 
    ChannelSelectMenuBuilder,
    ChannelType,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

module.exports = {
    customId: 'ticket_btn_logs',

    async execute(interaction, client) {
        const headerText = new TextDisplayBuilder()
            .setContent('# 📂 Canal de Transcrições (Logs)\nSelecione no menu abaixo o canal de texto onde o Koda deverá guardar o histórico de conversas dos tickets encerrados.\n\n*Recomendamos usar um canal privado apenas para a Direção.*');

        const divider = new SeparatorBuilder();

        // 🎛️ Menu Nativo de Canais (Filtrado apenas para canais de texto)
        const channelMenuRow = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('select_ticket_logs')
                .setPlaceholder('Selecione o canal de logs...')
                .addChannelTypes(ChannelType.GuildText) // Bloqueia categorias e canais de voz
        );

        const backButtonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('dashboard_select_module')
                .setLabel('◀ Voltar ao Dashboard')
                .setStyle(ButtonStyle.Secondary)
        );

        const logsContainer = new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addComponents(headerText, divider, channelMenuRow, backButtonRow);

        await interaction.update({ components: [logsContainer] });
    }
};