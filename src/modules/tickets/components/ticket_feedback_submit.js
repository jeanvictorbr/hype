const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    // 🚨 IMPORTANTE: ID Fictício para o loader
    customId: 'ticket_submit_loader',
    
    // O prefixo real que captura o modal
    customIdPrefix: 'submit_feedback_',

    async execute(interaction, client) {
        // Formato do ID: submit_feedback_NOTA_GUILDID_STAFFID_PROTOCOL
        const parts = interaction.customId.split('_');
        
        // parts[0] = "submit"
        // parts[1] = "feedback"
        // parts[2] = Nota
        const rating = parseInt(parts[2]);
        const guildId = parts[3];
        const staffId = parts[4];
        const protocol = parts[5];
        
        const comment = interaction.fields.getTextInputValue('feedback_comment') || 'Sem comentário.';

        // 1. Resposta Imediata na DM (Evita timeout)
        await interaction.reply({ content: '✅ **Feedback recebido!** Agradecemos a sua colaboração.', flags: [MessageFlags.Ephemeral] });

        try {
            // 2. Atualiza Histórico do Ticket
            await prisma.ticketHistory.update({
                where: { protocol: protocol },
                data: {
                    rating: rating,
                    comment: comment
                }
            }).catch(() => {}); // Ignora se não achar

            // 3. Atualiza Ranking do Staff (Média Ponderada)
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

            // 4. Envia Log para o Servidor (Opcional, mas recomendado)
            const config = await prisma.ticketConfig.findUnique({ where: { guildId } });
            if (config?.logChannel) {
                // Precisamos buscar a guilda pois estamos na DM do usuário
                const guild = await client.guilds.fetch(guildId).catch(() => null);
                if (guild) {
                    const logChannel = guild.channels.cache.get(config.logChannel);
                    if (logChannel) {
                        const starsEmoji = '⭐'.repeat(rating);
                        const logContainer = new ContainerBuilder()
                            .setAccentColor(0xFEE75C) // Dourado
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`# 💬 Nova Avaliação Recebida\n**Protocolo:** \`${protocol}\`\n**Staff:** <@${staffId}>\n**Nota:** ${rating}/5 ${starsEmoji}\n**Comentário:** "${comment}"\n**Cliente:** <@${interaction.user.id}>`)
                            );
                        
                        await logChannel.send({ components: [logContainer], flags: [MessageFlags.IsComponentsV2] }).catch(() => {});
                    }
                }
            }

        } catch (err) {
            console.error('Erro ao processar feedback:', err);
        }
    }
};