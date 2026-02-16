const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    // Captura 'rate_1', 'rate_2', ... 'rate_skip'
    customIdPrefix: 'rate_', 

    async execute(interaction, client) {
        const rating = interaction.customId.replace('rate_', '');
        const ticket = await prisma.activeTicket.findUnique({ where: { channelId: interaction.channel.id } });

        // Se for Skip ou se não tiver ticket no DB (bug), deleta logo
        if (rating === 'skip' || !ticket) {
            await interaction.reply({ content: '👋 Fechando ticket...', flags: [MessageFlags.Ephemeral] });
            if (ticket) await prisma.activeTicket.delete({ where: { channelId: interaction.channel.id } });
            setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
            return;
        }

        // Se for nota (1-5), mostra Modal de Comentário
        const modal = new ModalBuilder()
            .setCustomId(`submit_feedback_${rating}`) // Passamos a nota no ID
            .setTitle(`Avaliação: ${rating} Estrelas`);

        const commentInput = new TextInputBuilder()
            .setCustomId('feedback_comment')
            .setLabel('Deixe um comentário (Opcional)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('O atendimento foi rápido? O problema foi resolvido?')
            .setRequired(false)
            .setMaxLength(200);

        modal.addComponents(new ActionRowBuilder().addComponents(commentInput));
        await interaction.showModal(modal);
    }
};