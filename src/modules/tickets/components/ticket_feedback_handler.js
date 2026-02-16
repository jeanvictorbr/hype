const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder } = require('discord.js');

module.exports = {
    customId: 'ticket_rate_loader',
    customIdPrefix: 'rate_', 

    async execute(interaction, client) {
        const parts = interaction.customId.split('_');
        const rating = parts[1];
        const guildId = parts[2];
        const staffId = parts[3];
        const protocol = parts[4];

        // Se ninguém atendeu, finaliza direto mantendo as infos
        if (staffId === 'none') {
            const originalAttachments = interaction.message.attachments.map(a => a);

            const thankYouHeader = new TextDisplayBuilder()
                .setContent(`# ✅ Feedback Recebido\n**🔖 Protocolo:** \`${protocol}\`\n**Nota:** ${rating}/5 ⭐\n\nObrigado pela sua avaliação!`);

            const container = new ContainerBuilder()
                .setAccentColor(0x57F287)
                .addTextDisplayComponents(thankYouHeader);

            return interaction.update({ 
                components: [container], 
                files: originalAttachments, // Mantém anexo
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