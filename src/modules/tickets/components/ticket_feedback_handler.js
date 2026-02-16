const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder } = require('discord.js');

module.exports = {
    // ID Fictício para o loader
    customId: 'ticket_rate_loader',
    customIdPrefix: 'rate_', 

    async execute(interaction, client) {
        const parts = interaction.customId.split('_');
        const rating = parts[1];
        const guildId = parts[2];
        const staffId = parts[3];
        const protocol = parts[4];

        // Se ninguém atendeu, não abre modal, apenas finaliza e remove botões
        if (staffId === 'none') {
            const thankYouHeader = new TextDisplayBuilder()
                .setContent('# ✅ Feedback Recebido\nObrigado pela sua avaliação!');

            const container = new ContainerBuilder()
                .setAccentColor(0x57F287)
                .addTextDisplayComponents(thankYouHeader);

            // Remove os botões imediatamente
            return interaction.update({ 
                components: [container], 
                flags: [MessageFlags.IsComponentsV2] 
            });
        }

        // Abre Modal
        const modal = new ModalBuilder()
            .setCustomId(`submit_feedback_${rating}_${guildId}_${staffId}_${protocol}`) 
            .setTitle(`Avaliação: ${rating} Estrelas`);

        const commentInput = new TextInputBuilder()
            .setCustomId('feedback_comment')
            .setLabel('Comentário (Opcional)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Como foi o atendimento?')
            .setRequired(false)
            .setMaxLength(200);

        modal.addComponents(new ActionRowBuilder().addComponents(commentInput));
        
        await interaction.showModal(modal);
    }
};