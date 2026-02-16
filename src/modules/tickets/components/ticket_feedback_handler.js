const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');

module.exports = {
    // Captura 'rate_1_...', 'rate_5_...'
    customIdPrefix: 'rate_', 

    async execute(interaction, client) {
        // Formato: rate_NOTA_GUILDID_STAFFID
        const parts = interaction.customId.split('_');
        const rating = parts[1];
        const guildId = parts[2];
        const staffId = parts[3];

        // Se ninguém atendeu (staffId = none), apenas agradece
        if (staffId === 'none') {
            return interaction.reply({ content: '✅ Obrigado pelo feedback! (Atendimento sem staff específico)', flags: [MessageFlags.Ephemeral] });
        }

        // Abre Modal para comentário
        const modal = new ModalBuilder()
            .setCustomId(`submit_feedback_${rating}_${guildId}_${staffId}`) // Passa os dados para o próximo passo
            .setTitle(`Avaliação: ${rating} Estrelas`);

        const commentInput = new TextInputBuilder()
            .setCustomId('feedback_comment')
            .setLabel('Comentário (Opcional)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Elogios, críticas ou sugestões...')
            .setRequired(false)
            .setMaxLength(200);

        modal.addComponents(new ActionRowBuilder().addComponents(commentInput));
        
        await interaction.showModal(modal);
    }
};