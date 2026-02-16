const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, AttachmentBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateTranscriptHTML } = require('../../../utils/htmlGenerator');

module.exports = {
    customId: 'ticket_close',

    async execute(interaction, client) {
        if (interaction.replied || interaction.deferred) return;

        // 1. Busca dados
        const ticket = await prisma.activeTicket.findUnique({ where: { channelId: interaction.channel.id } });
        if (!ticket) return interaction.reply({ content: '❌ Ticket inválido/já fechado.', flags: [MessageFlags.Ephemeral] });

        const config = await prisma.ticketConfig.findUnique({ where: { guildId: interaction.guild.id } });
        
        // 2. Feedback inicial
        await interaction.reply({ content: '🔄 **A gerar logs e a preparar encerramento...**', flags: [MessageFlags.Ephemeral] });

        // ==========================================
        // 3. GERAÇÃO E ENVIO DE LOGS (TRANSCRIPT)
        // ==========================================
        try {
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            const htmlContent = generateTranscriptHTML(interaction.guild, interaction.channel, messages, interaction.user.tag);
            const attachment = new AttachmentBuilder(Buffer.from(htmlContent, 'utf-8'), { name: `transcript-${interaction.channel.name}.html` });

            if (config.logChannel) {
                const logChannel = interaction.guild.channels.cache.get(config.logChannel);
                if (logChannel) {
                    // Busca quem atendeu (se houve claim)
                    const claimer = ticket.claimerId ? `<@${ticket.claimerId}>` : 'Ninguém (Não assumido)';

                    const logHeader = new TextDisplayBuilder()
                        .setContent(`# 🗄️ Ticket Finalizado\n**Ticket:** \`${interaction.channel.name}\`\n**Dono:** <@${ticket.ownerId}>\n**Fechado por:** <@${interaction.user.id}>\n**Atendido por:** ${claimer}\n\n*Arquivo de transcrição anexado abaixo.*`);
                    
                    const logContainer = new ContainerBuilder()
                        .setAccentColor(0x2b2d31)
                        .addTextDisplayComponents(logHeader);

                    // 🔥 CORREÇÃO DO TRANSCRIPT: 'files' fica fora do body do container/components
                    await logChannel.send({
                        components: [logContainer], // Usando a API normal de components para compatibilidade com files
                        files: [attachment]
                    });
                }
            }
        } catch (err) {
            console.error('Erro Log:', err);
        }

        // ==========================================
        // 4. PAINEL DE FEEDBACK (AVALIAÇÃO)
        // ==========================================
        // Não deletamos o canal ainda. Perguntamos a nota primeiro.
        
        const feedbackHeader = new TextDisplayBuilder()
            .setContent(`# ⭐ Avaliação de Atendimento\nOlá <@${ticket.ownerId}>! O seu ticket foi finalizado.\n\nPor favor, avalie o atendimento da nossa equipa para nos ajudar a melhorar.`);

        // Botões de 1 a 5 estrelas
        const rowStars = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('rate_1').setLabel('1').setEmoji('⭐').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('rate_2').setLabel('2').setEmoji('⭐').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('rate_3').setLabel('3').setEmoji('⭐').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('rate_4').setLabel('4').setEmoji('⭐').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('rate_5').setLabel('5').setEmoji('⭐').setStyle(ButtonStyle.Success)
        );

        // Botão para pular (Staff fecha forçado)
        const rowSkip = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('rate_skip').setLabel('Pular / Fechar Agora').setStyle(ButtonStyle.Danger)
        );

        const feedbackContainer = new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(feedbackHeader)
            .addActionRowComponents(rowStars)
            .addActionRowComponents(rowSkip);

        // Envia no canal e apaga a UI antiga
        await interaction.channel.send({
            content: `<@${ticket.ownerId}>`, // Pinga o dono para ele ver
            components: [feedbackContainer],
            flags: [MessageFlags.IsComponentsV2]
        });
    }
};