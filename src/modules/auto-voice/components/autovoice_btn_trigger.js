const { 
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType,
    ButtonBuilder, ButtonStyle, MessageFlags 
} = require('discord.js');

module.exports = {
    customId: 'autovoice_btn_trigger',

    async execute(interaction, client) {
        const headerText = new TextDisplayBuilder()
            .setContent('# 📍 Definir Canal Gatilho\nSelecione no menu abaixo o **Canal de Voz** que servirá como "Criar Sala".\n\n*Quando um membro entrar neste canal, o bot criará uma sala privada e puxá-lo-á para lá.*');

        const divider = new SeparatorBuilder();

        // Menu de Canais de Voz
        const channelMenuRow = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('select_autovoice_trigger')
                .setPlaceholder('Selecione o canal de voz...')
                .addChannelTypes(ChannelType.GuildVoice)
        );

        const backButtonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('dashboard_select_module')
                .setLabel('◀ Voltar ao Dashboard')
                .setStyle(ButtonStyle.Secondary)
        );

        const container = new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(headerText)
            .addSeparatorComponents(divider)
            .addActionRowComponents(channelMenuRow)
            .addActionRowComponents(backButtonRow);

        await interaction.update({ components: [container], flags: [MessageFlags.IsComponentsV2] });
    }
};