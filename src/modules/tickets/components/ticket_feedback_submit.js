const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    // ID Fictício para o loader carregar o arquivo
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
        // 1. ATUALIZA A INTERFACE NA DM (MANTENDO O PROTOCOLO)
        // ==========================================
        
        // Reconstrói o texto original + Agradecimento
        const finalHeader = new TextDisplayBuilder()
            .setContent(`# ✅ Atendimento Finalizado\nOlá! O seu ticket foi encerrado com sucesso.\n\n**🔖 Protocolo:** \`${protocol}\`\n\n*Guarde este protocolo caso precise rever este atendimento no futuro.*\n\n✅ **Feedback Recebido:** ${rating}/5 ⭐\nObrigado!`);

        const container = new ContainerBuilder()
            .setAccentColor(0x57F287) // Verde
            .addTextDisplayComponents(finalHeader);

        // Update substitui a mensagem anterior (remove botões) e mantém o texto
        await interaction.update({ 
            components: [container], 
            flags: [MessageFlags.IsComponentsV2] 
        });

        // ==========================================
        // 2. PROCESSAMENTO NO BANCO (Background)
        // ==========================================
        try {
            // Atualiza Histórico
            await prisma.ticketHistory.update({
                where: { protocol: protocol },
                data: { rating: rating, comment: comment }
            }).catch(() => {}); 

            // Atualiza Ranking
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
            console.error('Erro Feedback:', err);
        }
    }
};