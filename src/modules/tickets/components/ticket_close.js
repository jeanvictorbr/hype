const { 
    ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, MessageFlags, AttachmentBuilder 
} = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateTranscriptHTML } = require('../../../utils/htmlGenerator');

// Função para gerar protocolo único (Ex: TKT-A1B2)
const generateProtocol = () => {
    return 'TKT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

module.exports = {
    customId: 'ticket_close',

    async execute(interaction, client) {
        if (interaction.replied || interaction.deferred) return;
        
        await interaction.reply({ content: '🔄 **A fechar ticket...**', flags: [MessageFlags.Ephemeral] });

        const ticket = await prisma.activeTicket.findUnique({ where: { channelId: interaction.channel.id } });
        if (!ticket) return interaction.editReply({ content: '❌ Ticket já não existe.' });

        const config = await prisma.ticketConfig.findUnique({ where: { guildId: interaction.guild.id } });
        
        // Validação Staff
        const isStaff = interaction.member.roles.cache.some(r => config?.staffRoles.includes(r.id));
        const isOwner = interaction.user.id === ticket.ownerId;
        const isAdmin = interaction.member.permissions.has('Administrator');

        if (!isStaff && !isOwner && !isAdmin) return interaction.editReply({ content: '🚫 Sem permissão.' });

        try {
            const protocol = generateProtocol();
            const claimerId = ticket.claimerId || 'none';
            const guildId = interaction.guild.id;

            // 1. Geração do Transcript
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            const htmlContent = generateTranscriptHTML(interaction.guild, interaction.channel, messages, interaction.user.tag);
            const transcriptBuffer = Buffer.from(htmlContent, 'utf-8');
            const attachment = new AttachmentBuilder(transcriptBuffer, { name: `transcript-${protocol}.html` });

            let transcriptUrl = null;

            // 2. Envio para Logs (Para gerar o Link Permanente)
            if (config.logChannel) {
                const logChannel = interaction.guild.channels.cache.get(config.logChannel);
                if (logChannel) {
                    const logContainer = new ContainerBuilder()
                        .setAccentColor(0x2C2F33)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`# 🗄️ Ticket Finalizado\n**Protocolo:** \`${protocol}\`\n**Ticket:** \`${interaction.channel.name}\`\n**Dono:** <@${ticket.ownerId}>\n**Fechado por:** <@${interaction.user.id}>\n**Staff:** <@${claimerId !== 'none' ? claimerId : interaction.user.id}>`)
                        );

                    // Envia Interface
                    await logChannel.send({ components: [logContainer], flags: [MessageFlags.IsComponentsV2] }).catch(() => {});
                    
                    // Envia Arquivo e pega a URL
                    const msgFile = await logChannel.send({ files: [attachment] }).catch(() => {});
                    if (msgFile) transcriptUrl = msgFile.attachments.first()?.url;
                }
            }

            // 3. Salva no Histórico (Backup)
            await prisma.ticketHistory.create({
                data: {
                    protocol: protocol,
                    guildId: guildId,
                    ownerId: ticket.ownerId,
                    staffId: claimerId !== 'none' ? claimerId : null,
                    transcriptUrl: transcriptUrl
                }
            });

            // 4. Envio para DM do Usuário (COM PROTOCOLO e SEM ANEXO)
            const ticketOwner = await client.users.fetch(ticket.ownerId).catch(() => null);
            
            if (ticketOwner) {
                const feedbackHeader = new TextDisplayBuilder()
                    .setContent(`# ✅ Atendimento Finalizado\nOlá! O seu ticket foi encerrado com sucesso.\n\n**🔖 Protocolo:** \`${protocol}\`\n\n*Guarde este protocolo caso precise rever este atendimento no futuro.*\n\nPor favor, avalie a nossa equipa abaixo:`);

                // IDs Blindados: rate_NOTA_GUILDID_STAFFID_PROTOCOL
                const rowStars = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`rate_1_${guildId}_${claimerId}_${protocol}`).setLabel('1').setEmoji('⭐').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`rate_2_${guildId}_${claimerId}_${protocol}`).setLabel('2').setEmoji('⭐').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`rate_3_${guildId}_${claimerId}_${protocol}`).setLabel('3').setEmoji('⭐').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId(`rate_4_${guildId}_${claimerId}_${protocol}`).setLabel('4').setEmoji('⭐').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId(`rate_5_${guildId}_${claimerId}_${protocol}`).setLabel('5').setEmoji('⭐').setStyle(ButtonStyle.Success)
                );

                const dmContainer = new ContainerBuilder()
                    .setAccentColor(0x5865F2)
                    .addTextDisplayComponents(feedbackHeader)
                    .addActionRowComponents(rowStars);

                await ticketOwner.send({ 
                    components: [dmContainer], 
                    flags: [MessageFlags.IsComponentsV2] 
                }).catch(() => console.log('DM Fechada'));
            }

            // 5. Delete Final
            await prisma.activeTicket.delete({ where: { channelId: interaction.channel.id } });
            await interaction.channel.delete();

        } catch (error) {
            console.error('Erro Ticket Close:', error);
        }
    }
};