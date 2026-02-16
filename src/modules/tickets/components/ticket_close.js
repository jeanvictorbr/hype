const { 
    ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, MessageFlags, AttachmentBuilder 
} = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateTranscriptHTML } = require('../../../utils/htmlGenerator');

module.exports = {
    customId: 'ticket_close',

    async execute(interaction, client) {
        // Blindagem contra cliques duplos
        if (interaction.replied || interaction.deferred) return;
        
        // 1. Inicia processo (Avisa que vai demorar um pouco)
        await interaction.reply({ content: '🔄 **A processar encerramento...** (A guardar logs e a enviar DM)', flags: [MessageFlags.Ephemeral] });

        const ticket = await prisma.activeTicket.findUnique({ where: { channelId: interaction.channel.id } });
        if (!ticket) return interaction.editReply({ content: '❌ Ticket já não existe.' });

        const config = await prisma.ticketConfig.findUnique({ where: { guildId: interaction.guild.id } });
        
        // 2. Validação de Permissão
        const isStaff = interaction.member.roles.cache.some(r => config?.staffRoles.includes(r.id));
        const isOwner = interaction.user.id === ticket.ownerId;
        const isAdmin = interaction.member.permissions.has('Administrator');

        if (!isStaff && !isOwner && !isAdmin) {
            return interaction.editReply({ content: '🚫 Sem permissão.' });
        }

        try {
            // ==========================================
            // 3. GERAÇÃO DO TRANSCRIPT (HTML)
            // ==========================================
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            const htmlContent = generateTranscriptHTML(interaction.guild, interaction.channel, messages, interaction.user.tag);
            const transcriptBuffer = Buffer.from(htmlContent, 'utf-8');
            
            // Cria dois anexos idênticos (um para log, um para DM)
            const attachmentLog = new AttachmentBuilder(transcriptBuffer, { name: `transcript-${interaction.channel.name}.html` });
            const attachmentDM = new AttachmentBuilder(transcriptBuffer, { name: `transcript-${interaction.channel.name}.html` });

            // Identifica quem atendeu (para o ranking)
            const claimerId = ticket.claimerId || 'none'; 
            const guildId = interaction.guild.id;

            // ==========================================
            // 4. ENVIO PARA CANAL DE LOGS (Servidor)
            // ==========================================
            if (config.logChannel) {
                const logChannel = interaction.guild.channels.cache.get(config.logChannel);
                if (logChannel) {
                    const logContainer = new ContainerBuilder()
                        .setAccentColor(0x2C2F33)
                        .addTextDisplayComponents(
                            new TextDisplayBuilder().setContent(`# 🗄️ Ticket Finalizado\n**Ticket:** \`${interaction.channel.name}\`\n**Dono:** <@${ticket.ownerId}>\n**Fechado por:** <@${interaction.user.id}>\n**Atendido por:** <@${claimerId !== 'none' ? claimerId : interaction.user.id}>`)
                        );

                    // Envia Log e Arquivo separadamente para evitar erro 50035
                    await logChannel.send({ components: [logContainer], flags: [MessageFlags.IsComponentsV2] }).catch(() => {});
                    await logChannel.send({ files: [attachmentLog] }).catch(() => {});
                }
            }

            // ==========================================
            // 5. ENVIO PARA DM DO USUÁRIO (Feedback)
            // ==========================================
            const ticketOwner = await client.users.fetch(ticket.ownerId).catch(() => null);
            
            if (ticketOwner) {
                const feedbackHeader = new TextDisplayBuilder()
                    .setContent(`# ⭐ Avaliação de Atendimento\nOlá! O seu ticket no servidor **${interaction.guild.name}** foi encerrado.\n\n📄 **O histórico da conversa está em anexo.**\n\nPor favor, avalie o atendimento abaixo:`);

                // IDs inteligentes: rate_NOTA_GUILDID_STAFFID
                const rowStars = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`rate_1_${guildId}_${claimerId}`).setLabel('1').setEmoji('⭐').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`rate_2_${guildId}_${claimerId}`).setLabel('2').setEmoji('⭐').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId(`rate_3_${guildId}_${claimerId}`).setLabel('3').setEmoji('⭐').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId(`rate_4_${guildId}_${claimerId}`).setLabel('4').setEmoji('⭐').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId(`rate_5_${guildId}_${claimerId}`).setLabel('5').setEmoji('⭐').setStyle(ButtonStyle.Success)
                );

                const dmContainer = new ContainerBuilder()
                    .setAccentColor(0x5865F2)
                    .addTextDisplayComponents(feedbackHeader)
                    .addActionRowComponents(rowStars);

                await ticketOwner.send({ 
                    components: [dmContainer], 
                    files: [attachmentDM],
                    flags: [MessageFlags.IsComponentsV2] 
                }).catch(err => console.log('Não foi possível enviar DM para o user (DM Fechada).'));
            }

            // ==========================================
            // 6. DELEÇÃO TOTAL (Limpeza)
            // ==========================================
            await prisma.activeTicket.delete({ where: { channelId: interaction.channel.id } });
            await interaction.channel.delete();

        } catch (error) {
            console.error('Erro Ticket Close:', error);
            await interaction.editReply({ content: '❌ Erro ao fechar ticket. Verifique o console.' });
        }
    }
};