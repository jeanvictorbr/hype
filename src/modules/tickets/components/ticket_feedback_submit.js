const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'submit_feedback_',

    async execute(interaction, client) {
        // Formato: submit_feedback_NOTA_GUILDID_STAFFID_PROTOCOL
        const parts = interaction.customId.split('_');
        const rating = parseInt(parts[2]);
        const guildId = parts[3];
        const staffId = parts[4];
        const protocol = parts[5];
        
        const comment = interaction.fields.getTextInputValue('feedback_comment') || 'Sem comentário.';

        // Responder ao usuário na DM (Update na msg original ou nova msg)
        await interaction.reply({ content: '✅ **Feedback recebido!** Agradecemos a sua colaboração.', flags: [MessageFlags.Ephemeral] });

        try {
            // 1. Atualiza Histórico do Ticket (Adiciona a nota ao registro permanente)
            await prisma.ticketHistory.update({
                where: { protocol: protocol },
                data: {
                    rating: rating,
                    comment: comment
                }
            }).catch(() => {}); // Ignora se não achar por algum motivo

            // 2. Atualiza Ranking do Staff
            const currentStats = await prisma.staffStats.findUnique({
                where: { guildId_staffId: { guildId, staffId } }
            }) || { ticketsClosed: 0, totalStars: 0 };

            const newTotal = currentStats.ticketsClosed + 1;
            const newStars = currentStats.totalStars + rating;
            const newAverage = parseFloat((newStars / newTotal).toFixed(2));

            await prisma.staffStats.upsert({
                where: { guildId_staffId: { guildId, staffId } },
                create: { guildId, staffId, ticketsClosed: 1, totalStars: rating, averageRating: parseFloat(rating.toFixed(2)) },
                update: { ticketsClosed: newTotal, totalStars: newStars, averageRating: newAverage }
            });

            // 3. Log no Servidor (Avisa a staff sobre o feedback)
            const config = await prisma.ticketConfig.findUnique({ where: { guildId } });
            if (config?.logChannel) {
                const guild = await client.guilds.fetch(guildId).catch(() => null);
                if (guild) {
                    const logChannel = guild.channels.cache.get(config.logChannel);
                    if (logChannel) {
                        const logContainer = new ContainerBuilder()
                            .setAccentColor(0xFEE75C)
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`# ⭐ Nova Avaliação\n**Protocolo:** \`${protocol}\`\n**Staff:** <@${staffId}>\n**Nota:** ${rating}/5\n**Comentário:** "${comment}"\n**Cliente:** <@${interaction.user.id}>`)
                            );
                        
                        await logChannel.send({ components: [logContainer], flags: [MessageFlags.IsComponentsV2] });
                    }
                }
            }
        } catch (err) {
            console.error('Erro Feedback Submit:', err);
        }
    }
};