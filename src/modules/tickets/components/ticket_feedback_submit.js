const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_submit_loader',
    customIdPrefix: 'submit_feedback_',

    async execute(interaction, client) {
        // Formato: submit_feedback_NOTA_GUILDID_STAFFID_PROTOCOL
        const parts = interaction.customId.split('_');
        const rating = parseInt(parts[2]);
        const guildId = parts[3];
        const staffId = parts[4];
        const protocol = parts[5];
        
        const comment = interaction.fields.getTextInputValue('feedback_comment') || 'Sem comentário.';

        // ==========================================
        // 1. ATUALIZA A INTERFACE NA DM (COM AS INFOS)
        // ==========================================
        
        // Tenta recuperar os anexos da mensagem original para não os perder
        const originalAttachments = interaction.message.attachments.map(a => a);

        const thankYouHeader = new TextDisplayBuilder()
            .setContent(`# ✅ Avaliação Registada\n**🔖 Protocolo:** \`${protocol}\`\n**Nota:** ${rating}/5 ⭐\n\nObrigado! A sua opinião ajuda-nos a melhorar.`);

        const thankYouContainer = new ContainerBuilder()
            .setAccentColor(0x57F287) // Verde
            .addTextDisplayComponents(thankYouHeader);

        // Atualiza a mensagem mantendo o protocolo visível e removendo os botões
        await interaction.update({ 
            components: [thankYouContainer], 
            files: originalAttachments, // Tenta manter o transcript na mensagem
            flags: [MessageFlags.IsComponentsV2] 
        }).catch(err => {
            // Fallback se não der para manter o anexo, manda sem ele mas com o protocolo
            console.error('Erro ao manter anexo:', err);
            interaction.editReply({ 
                components: [thankYouContainer], 
                flags: [MessageFlags.IsComponentsV2] 
            });
        });

        // ==========================================
        // 2. PROCESSAMENTO NO BANCO
        // ==========================================
        try {
            await prisma.ticketHistory.update({
                where: { protocol: protocol },
                data: { rating: rating, comment: comment }
            }).catch(() => {}); 

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

            // Log no Servidor
            const config = await prisma.ticketConfig.findUnique({ where: { guildId } });
            if (config?.logChannel) {
                const guild = await client.guilds.fetch(guildId).catch(() => null);
                if (guild) {
                    const logChannel = guild.channels.cache.get(config.logChannel);
                    if (logChannel) {
                        const starsEmoji = '⭐'.repeat(rating);
                        const logContainer = new ContainerBuilder()
                            .setAccentColor(0xFEE75C)
                            .addTextDisplayComponents(
                                new TextDisplayBuilder().setContent(`# 💬 Nova Avaliação\n**Protocolo:** \`${protocol}\`\n**Staff:** <@${staffId}>\n**Nota:** ${rating}/5 ${starsEmoji}\n**Comentário:** "${comment}"\n**Cliente:** <@${interaction.user.id}>`)
                            );
                        await logChannel.send({ components: [logContainer], flags: [MessageFlags.IsComponentsV2] }).catch(() => {});
                    }
                }
            }
        } catch (err) {
            console.error('Erro DB Feedback:', err);
        }
    }
};