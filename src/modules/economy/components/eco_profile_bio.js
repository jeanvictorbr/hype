const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');

module.exports = {
    customId: 'eco_profile_bio',

    async execute(interaction) {
        // 🔒 SEGURANÇA: Verifica se o clicador é o dono da interação original
        if (interaction.message.interaction && interaction.user.id !== interaction.message.interaction.user.id) {
            return interaction.reply({ 
                content: '❌ **Acesso Negado!** Você só pode editar o seu próprio perfil.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        const modal = new ModalBuilder()
            .setCustomId('eco_profile_bio_submit')
            .setTitle('Editar Biografia Hype');

        const bioInput = new TextInputBuilder()
            .setCustomId('bioInput')
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