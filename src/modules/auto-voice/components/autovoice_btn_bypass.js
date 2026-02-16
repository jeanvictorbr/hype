const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder,
    ActionRowBuilder, 
    RoleSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

module.exports = {
    customId: 'autovoice_btn_bypass',

    async execute(interaction, client) {
        
        const headerText = new TextDisplayBuilder()
            .setContent('# 🎟️ Configurar Passe Livre\nSelecione no menu abaixo os cargos da sua Staff. Membros com estes cargos poderão entrar em **qualquer sala temporária**, mesmo se o dono tiver trancado a porta com o cadeado 🔒.\n\n*Dica: Você pode selecionar múltiplos cargos de uma vez.*');

        const divider = new SeparatorBuilder();

        const roleMenuRow = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
                .setCustomId('select_bypass_role')
                .setPlaceholder('Selecione os cargos da Staff...')
                .setMinValues(1)
                .setMaxValues(10)
        );

        const backButtonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('dashboard_select_module')
                .setLabel('◀ Voltar')
                .setStyle(ButtonStyle.Secondary)
        );

        // 🛠️ CORREÇÃO V2 APLICADA: Separando TextDisplay, Separator e ActionRows
        const bypassContainer = new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(headerText)
            .addSeparatorComponents(divider)
            .addActionRowComponents(roleMenuRow, backButtonRow);

        await interaction.update({ components: [bypassContainer] });
    }
};