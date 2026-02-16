const { 
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    ActionRowBuilder, RoleSelectMenuBuilder, ButtonBuilder,
    ButtonStyle, MessageFlags
} = require('discord.js');

module.exports = {
    customId: 'ticket_btn_staff',

    async execute(interaction, client) {
        const headerText = new TextDisplayBuilder()
            .setContent('# 👮 Definir Equipa (Staff)\nSelecione no menu abaixo os cargos que terão permissão para ver e fechar tickets.\n\n*Dica: Pode selecionar múltiplos cargos.*');

        const divider = new SeparatorBuilder();

        const roleMenuRow = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
                .setCustomId('select_ticket_staff')
                .setPlaceholder('Selecione os cargos da equipa...')
                .setMinValues(1)
                .setMaxValues(10)
        );

        const backButtonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('dashboard_select_module').setLabel('◀ Voltar ao Dashboard').setStyle(ButtonStyle.Secondary)
        );

        const staffContainer = new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(headerText)      // ✅
            .addSeparatorComponents(divider)           // ✅
            .addActionRowComponents(roleMenuRow)       // ✅
            .addActionRowComponents(backButtonRow);    // ✅

        await interaction.update({ components: [staffContainer], flags: [MessageFlags.IsComponentsV2] });
    }
};