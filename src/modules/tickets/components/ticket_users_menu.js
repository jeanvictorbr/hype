const { 
    ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, 
    UserSelectMenuBuilder, MessageFlags 
} = require('discord.js');

module.exports = {
    customId: 'ticket_users_menu',

    async execute(interaction, client) {
        // Menu para ADICIONAR
        const rowAdd = new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder()
                .setCustomId('ticket_user_add')
                .setPlaceholder('Selecione usuários para ADICIONAR...')
                .setMaxValues(5)
        );

        // Menu para REMOVER
        const rowRem = new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder()
                .setCustomId('ticket_user_remove')
                .setPlaceholder('Selecione usuários para REMOVER...')
                .setMaxValues(5)
        );

        const container = new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent('# 👥 Gestão de Membros\nUse os menus abaixo para conceder ou revogar acesso a este ticket.'))
            .addActionRowComponents(rowAdd)
            .addActionRowComponents(rowRem);

        await interaction.reply({ 
            components: [container], 
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] 
        });
    }
};