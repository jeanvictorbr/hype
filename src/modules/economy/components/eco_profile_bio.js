const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');

module.exports = {
    customIdPrefix: 'eco_profile_bio_', // 👈 Agora usa o prefixo para aceitar a tranca do ID

    async execute(interaction) {
        // 🔒 SEGURANÇA: Extrai o ID do dono a partir do botão
        const ownerId = interaction.customId.replace('eco_profile_bio_', '');

        if (interaction.user.id !== ownerId) {
            return interaction.reply({ 
                content: '🛑 **Acesso Negado:** Tu só podes alterar a tua própria biografia!', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        const modal = new ModalBuilder()
            .setCustomId('eco_profile_bio_submit')
            .setTitle('Editar Biografia Hype');

        const bioInput = new TextInputBuilder()
            .setCustomId('bioInput') // 👈 O ID exato que o submit vai procurar
            .setLabel("Escreve a tua nova frase de perfil:")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Ex: A dominar o Cassino Hype desde 2024.')
            .setMaxLength(140)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(bioInput);
        modal.addComponents(row);
        await interaction.showModal(modal);
    }
};