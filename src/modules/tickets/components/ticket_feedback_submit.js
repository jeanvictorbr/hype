const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'submit_feedback_',

    async execute(interaction, client) {
        await interaction.deferUpdate(); // Não queremos responder visualmente, vamos deletar o canal

        const rating = parseInt(interaction.customId.replace('submit_feedback_', ''));
        const comment = interaction.fields.getTextInputValue('feedback_comment') || 'Sem comentário.';
        const channelId = interaction.channel.id;
        const guildId = interaction.guild.id;

        // 1. Busca info do Ticket para saber quem avaliar
        const ticket = await prisma.activeTicket.findUnique({ where: { channelId: channelId } });

        if (ticket && ticket.claimerId) {
            const staffId = ticket.claimerId;

            // 2. Atualiza Estatísticas do Staff (Ranking)
            // Lógica de média ponderada simples
            const currentStats = await prisma.staffStats.findUnique({
                where: { guildId_staffId: { guildId, staffId } }
            }) || { ticketsClosed: 0, totalStars: 0 };

            const newTotal = currentStats.ticketsClosed + 1;
            const newStars = currentStats.totalStars + rating;
            const newAverage = parseFloat((newStars / newTotal).toFixed(2));

            await prisma.staffStats.upsert({
                where: { guildId_staffId: { guildId, staffId } },
                create: {
                    guildId,
                    staffId,
                    ticketsClosed: 1,
                    totalStars: rating,
                    averageRating: parseFloat(rating.toFixed(2))
                },
                update: {
                    ticketsClosed: newTotal,
                    totalStars: newStars,
                    averageRating: newAverage
                }
            });

            // 3. Envia Log do Feedback (Opcional, mas profissional)
            const config = await prisma.ticketConfig.findUnique({ where: { guildId } });
            if (config?.logChannel) {
                const logChannel = interaction.guild.channels.cache.get(config.logChannel);
                if (logChannel) {
                    const starsEmoji = '⭐'.repeat(rating);
                    const logContainer = new ContainerBuilder()
                        .setAccentColor(0xFEE75C)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`# 💬 Novo Feedback Recebido\n**Staff:** <@${staffId}>\n**Nota:** ${rating}/5 ${starsEmoji}\n**Comentário:** "${comment}"\n**Cliente:** <@${interaction.user.id}>`)
                        );
                    await logChannel.send({ components: [logContainer], flags: [MessageFlags.IsComponentsV2] }).catch(() => {});
                }
            }
        }

        // 4. Limpeza Final
        if (ticket) await prisma.activeTicket.delete({ where: { channelId } });
        
        await interaction.followUp({ content: '✅ Obrigado! Fechando ticket...', flags: [MessageFlags.Ephemeral] });
        setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
    }
};