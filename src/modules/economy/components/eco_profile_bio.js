const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customIdPrefix: 'eco_profile_bio_',
    async execute(interaction) {
        const ownerId = interaction.customId.replace('eco_profile_bio_', '');

        if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: '🛑 **Acesso Negado:** Só podes alterar a tua própria biografia!', ephemeral: true });
        }

        const modal = new ModalBuilder()
            .setCustomId('eco_profile_bio_submit')
            .setTitle('Editar Biografia do Perfil');

        const bioInput = new TextInputBuilder()
            .setCustomId('bio')
            .setLabel('Uma frase sobre si')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(85)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(bioInput));
        await interaction.showModal(modal);
    }
};