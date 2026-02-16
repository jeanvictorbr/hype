const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder,
    ActionRowBuilder, 
    RoleSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');

module.exports = {
    customId: 'autovoice_btn_bypass',

    async execute(interaction, client) {
        const headerText = new TextDisplayBuilder()
            .setContent('# 🎟️ Configurar Passe Livre\nSelecione no menu abaixo os cargos da sua Staff que podem entrar em salas trancadas.');

        const divider = new SeparatorBuilder();

        const roleMenuRow = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
                .setCustomId('select_bypass_role')
                .setPlaceholder('Selecione os cargos...')
                .setMinValues(1)
                .setMaxValues(10)
        );

        const backButtonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('dashboard_select_module') // Volta para o menu Auto-Voice
                .setLabel('◀ Voltar')
                .setStyle(ButtonStyle.Secondary)
        );

        const bypassContainer = new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(headerText)
            .addSeparatorComponents(divider)
            .addActionRowComponents(roleMenuRow)
            .addActionRowComponents(backButtonRow); // ✅ Linhas separadas

        await interaction.update({ components: [bypassContainer], flags: [MessageFlags.IsComponentsV2] });
    }
};