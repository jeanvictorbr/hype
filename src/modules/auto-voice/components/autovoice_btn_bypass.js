const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder,
    ActionRowBuilder, 
    RoleSelectMenuBuilder, // 👈 O segredo está aqui! (Puxa os Cargos)
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');

module.exports = {
    customId: 'autovoice_btn_bypass',

    async execute(interaction, client) {
        const headerText = new TextDisplayBuilder()
            .setContent('# 🎟️ Configurar Passe Livre\nSelecione no menu abaixo os **Cargos** da sua Staff que podem entrar em salas trancadas.');

        const divider = new SeparatorBuilder();

        // 👇 AQUI: Menu nativo exclusivo para Cargos (Roles)
        const roleMenuRow = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
                .setCustomId('select_bypass_role')
                .setPlaceholder('Selecione os cargos...')
                .setMinValues(1)
                .setMaxValues(10)
        );

        // Botão para voltar ao Menu do Auto-Voice
        const backButtonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('dashboard_btn_back') // 👈 Corrigido para voltar ao painel de Voice
                .setLabel('◀ Voltar ao Painel')
                .setStyle(ButtonStyle.Secondary)
        );

        const bypassContainer = new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(headerText)
            .addSeparatorComponents(divider)
            .addActionRowComponents(roleMenuRow)
            .addActionRowComponents(backButtonRow);

        await interaction.update({ 
            components: [bypassContainer], 
            flags: [MessageFlags.IsComponentsV2] 
        });
    }
};