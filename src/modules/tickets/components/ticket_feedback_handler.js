const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');

module.exports = {
    // 🚨 IMPORTANTE: ID Fictício para o loader carregar este arquivo na memória
    customId: 'ticket_rate_loader',
    
    // O interactionCreate vai usar este prefixo para rotear a ação correta
    customIdPrefix: 'rate_', 

    async execute(interaction, client) {
        // Formato recebido: rate_NOTA_GUILDID_STAFFID_PROTOCOL
        const parts = interaction.customId.split('_');
        
        // parts[0] = "rate"
        // parts[1] = Nota (1-5)
        // parts[2] = Guild ID
        // parts[3] = Staff ID
        // parts[4] = Protocolo

        const rating = parts[1];
        const guildId = parts[2];
        const staffId = parts[3];
        const protocol = parts[4];

        // Se o Staff for 'none' (ninguém atendeu), apenas agradecemos
        if (staffId === 'none') {
            return interaction.reply({ content: '✅ Obrigado pelo feedback!', flags: [MessageFlags.Ephemeral] });
        }

        // Cria o Modal para comentário
        const modal = new ModalBuilder()
            // Passamos todos os dados para o ID do modal para usar depois
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