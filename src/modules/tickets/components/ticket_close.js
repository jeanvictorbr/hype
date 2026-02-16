const { 
    ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, MessageFlags, AttachmentBuilder 
} = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateTranscriptHTML } = require('../../../utils/htmlGenerator');

module.exports = {
    customId: 'ticket_close',

    async execute(interaction, client) {
        if (interaction.replied || interaction.deferred) return;

        // 1. Validações
        const ticket = await prisma.activeTicket.findUnique({ where: { channelId: interaction.channel.id } });
        if (!ticket) return interaction.reply({ content: '❌ Ticket inválido ou já fechado.', flags: [MessageFlags.Ephemeral] });

        const config = await prisma.ticketConfig.findUnique({ where: { guildId: interaction.guild.id } });
        
        const isStaff = interaction.member.roles.cache.some(r => config?.staffRoles.includes(r.id));
        const isOwner = interaction.user.id === ticket.ownerId;
        const isAdmin = interaction.member.permissions.has('Administrator');

        if (!isStaff && !isOwner && !isAdmin) return interaction.reply({ content: '🚫 Sem permissão.', flags: [MessageFlags.Ephemeral] });

        // 2. Feedback Visual
        const closingHeader = new TextDisplayBuilder()
            .setContent(`# 🔒 A Fechar Ticket...\nEncerrado por <@${interaction.user.id}>.\n*Gerando logs e salvando transcrição...*`);

        const closingContainer = new ContainerBuilder()
            .setAccentColor(0xED4245)
            .addTextDisplayComponents(closingHeader);

        await interaction.update({ components: [closingContainer], flags: [MessageFlags.IsComponentsV2] });

        // 3. Geração e Envio de Transcript
        try {
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            const htmlContent = generateTranscriptHTML(interaction.guild, interaction.channel, messages, interaction.user.tag);
            const transcriptBuffer = Buffer.from(htmlContent, 'utf-8');
            const attachment = new AttachmentBuilder(transcriptBuffer, { name: `transcript-${interaction.channel.name}.html` });

            if (config.logChannel) {
                const logChannel = interaction.guild.channels.cache.get(config.logChannel);
                if (logChannel) {
                    const claimer = ticket.claimerId ? `<@${ticket.claimerId}>` : 'Ninguém';

                    const logHeader = new TextDisplayBuilder()
                        .setContent(`# 🗄️ Ticket Finalizado\n**Ticket:** \`${interaction.channel.name}\`\n**Dono:** <@${ticket.ownerId}>\n**Fechado por:** <@${interaction.user.id}>\n**Atendido por:** ${claimer}`);
                    
                    const logContainer = new ContainerBuilder()
                        .setAccentColor(0x2C2F33)
                        .addTextDisplayComponents(logHeader);

                    // 🚨 CORREÇÃO: Forçando a flag 4096 (IsComponentsV2) manualmente para garantir
                    await logChannel.send({
                        components: [logContainer],
                        files: [attachment],
                        flags: [4096] 
                    });
                }
            }
        } catch (err) {
            console.error('Erro Logs:', err);
        }

        // ==========================================
        // 4. PAINEL DE FEEDBACK
        // ==========================================
        
        const feedbackHeader = new TextDisplayBuilder()
            .setContent(`# ⭐ Avaliação\nOlá <@${ticket.ownerId}>! O suporte foi encerrado.\nPor favor, avalie o atendimento para nos ajudar a melhorar.`);

        const rowStars = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('rate_1').setLabel('1').setEmoji('⭐').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('rate_2').setLabel('2').setEmoji('⭐').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('rate_3').setLabel('3').setEmoji('⭐').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('rate_4').setLabel('4').setEmoji('⭐').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('rate_5').setLabel('5').setEmoji('⭐').setStyle(ButtonStyle.Success)
        );

        const rowSkip = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('rate_skip').setLabel('Fechar Agora').setStyle(ButtonStyle.Danger)
        );

        const feedbackContainer = new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(feedbackHeader)
            .addActionRowComponents(rowStars)
            .addActionRowComponents(rowSkip);

        await interaction.channel.send({
            content: `<@${ticket.ownerId}>`,
            components: [feedbackContainer],
            flags: [MessageFlags.IsComponentsV2]
        });
    }
};