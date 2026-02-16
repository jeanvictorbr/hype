const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    // Captura submit_feedback_...
    customIdPrefix: 'submit_feedback_',

    async execute(interaction, client) {
        // Formato: submit_feedback_NOTA_GUILDID_STAFFID
        const parts = interaction.customId.split('_');
        const rating = parseInt(parts[2]);
        const guildId = parts[3];
        const staffId = parts[4];
        
        const comment = interaction.fields.getTextInputValue('feedback_comment') || 'Sem comentário.';

        // 1. Atualiza DB (Ranking)
        // Usa upsert para criar se não existir ou atualizar se existir
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

        // 2. Feedback ao Usuário
        await interaction.reply({ content: '✅ **Feedback enviado com sucesso!** Obrigado por avaliar a nossa equipa.', flags: [MessageFlags.Ephemeral] });

        // 3. Log no Servidor (Opcional: Avisa no canal de logs que chegou uma avaliação)
        try {
            const config = await prisma.ticketConfig.findUnique({ where: { guildId } });
            if (config?.logChannel) {
                const guild = await client.guilds.fetch(guildId);
                const logChannel = guild.channels.cache.get(config.logChannel);
                
                if (logChannel) {
                    const starsEmoji = '⭐'.repeat(rating);
                    const logContainer = new ContainerBuilder()
                        .setAccentColor(0xFEE75C) // Dourado
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`# 💬 Nova Avaliação Recebida\n**Staff:** <@${staffId}>\n**Nota:** ${rating}/5 ${starsEmoji}\n**Comentário:** "${comment}"\n**Cliente:** <@${interaction.user.id}>`)
                        );
                    
                    await logChannel.send({ components: [logContainer], flags: [MessageFlags.IsComponentsV2] });
                }
            }
        } catch (err) {
            console.error('Erro ao enviar log de feedback:', err);
        }
    }
};