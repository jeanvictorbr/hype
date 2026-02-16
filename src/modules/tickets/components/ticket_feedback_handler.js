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

        // Se ninguém atendeu, finaliza direto mantendo as infos
        if (staffId === 'none') {
            const finalHeader = new TextDisplayBuilder()
                .setContent(`# ✅ Atendimento Finalizado\nOlá! O seu ticket foi encerrado com sucesso.\n\n**🔖 Protocolo:** \`${protocol}\`\n\n*Guarde este protocolo caso precise rever este atendimento no futuro.*\n\n✅ **Feedback Recebido:** ${rating}/5 ⭐\nObrigado!`);

            const container = new ContainerBuilder()
                .setAccentColor(0x57F287)
                .addTextDisplayComponents(finalHeader);

            // Remove botões e atualiza texto
            return interaction.update({ 
                components: [container], 
                flags: [MessageFlags.IsComponentsV2] 
            });
        }

        // Se tem staff, abre Modal para comentário
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