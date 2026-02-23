const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: 'eco_vip_edit_name',
    async execute(interaction, client) {
        const modal = new ModalBuilder().setCustomId('eco_vip_edit_name_submit').setTitle('✏️ Alterar Nome do Cargo');

        const nameInput = new TextInputBuilder()
            .setCustomId('new_name')
            .setLabel('Novo Nome (com Emoji)')
            .setPlaceholder('Ex: 👑 Os Magnatas')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(50).setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
        await interaction.showModal(modal);
    }
};