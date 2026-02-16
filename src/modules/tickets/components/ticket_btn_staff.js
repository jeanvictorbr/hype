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
    customId: 'ticket_btn_staff',

    async execute(interaction, client) {
        
        // ==========================================
        // CONSTRUINDO A INTERFACE V2 (App Nativo)
        // ==========================================
        const headerText = new TextDisplayBuilder()
            .setContent('# 👮 Definir Equipa (Staff)\nSelecione no menu abaixo os cargos que terão permissão para ver, responder e fechar os tickets abertos pelos membros.\n\n*Dica: Pode selecionar múltiplos cargos de uma só vez.*');

        const divider = new SeparatorBuilder();

        // 🎛️ Menu Suspenso Nativo para Cargos
        const roleMenuRow = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
                .setCustomId('select_ticket_staff') // O ID que processará a gravação na base de dados
                .setPlaceholder('Selecione os cargos da equipa de atendimento...')
                .setMinValues(1)
                .setMaxValues(10)
        );

        // Botão de recuo seguro
        const backButtonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('dashboard_select_module') // Volta ao menu principal
                .setLabel('◀ Voltar ao Dashboard')
                .setStyle(ButtonStyle.Secondary)
        );

        const staffContainer = new ContainerBuilder()
            .setAccentColor(0x5865F2) // Cor Blurple do Discord
            .addComponents(headerText, divider, roleMenuRow, backButtonRow);

        // Atualiza o ecrã instantaneamente
        await interaction.update({ components: [staffContainer] });
    }
};