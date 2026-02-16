const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');

module.exports = {
    // Captura 'rate_1_...', 'rate_5_...'
    customIdPrefix: 'rate_', 

    async execute(interaction, client) {
        // Como estamos na DM, não usamos deferUpdate() se formos abrir modal logo em seguida
        // O Modal deve ser a primeira resposta a um botão se não houver defer.
        
        // Formato: rate_NOTA_GUILDID_STAFFID_PROTOCOL
        const parts = interaction.customId.split('_');
        const rating = parts[1];
        const guildId = parts[2];
        const staffId = parts[3];
        const protocol = parts[4];

        // Se for staff 'none', agradece direto (sem modal)
        if (staffId === 'none') {
            await interaction.reply({ content: '✅ Obrigado pela avaliação!', flags: [MessageFlags.Ephemeral] });
            return;
        }

        // Abre Modal para comentário
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