const { 
    ContainerBuilder, TextDisplayBuilder, MessageFlags, AttachmentBuilder
} = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateTranscriptHTML } = require('../../../utils/htmlGenerator');

module.exports = {
    customId: 'ticket_close',

    async execute(interaction, client) {
        if (interaction.replied || interaction.deferred) return;

        // 1. Validações
        const ticket = await prisma.activeTicket.findUnique({ where: { channelId: interaction.channel.id } });
        if (!ticket) return interaction.reply({ content: '❌ Ticket inválido.', flags: [MessageFlags.Ephemeral] });

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
            // Pega mensagens (limite 100 para ser rápido, ou mais se precisar)
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            
            // Gera HTML
            const htmlContent = generateTranscriptHTML(interaction.guild, interaction.channel, messages, interaction.user.tag);
            const transcriptBuffer = Buffer.from(htmlContent, 'utf-8');
            const attachment = new AttachmentBuilder(transcriptBuffer, { name: `transcript-${interaction.channel.name}.html` });

            // Envia para o Canal de Logs
            if (config.logChannel) {
                const logChannel = interaction.guild.channels.cache.get(config.logChannel);
                if (logChannel) {
                    const logHeader = new TextDisplayBuilder()
                        .setContent(`# 🗄️ Log de Atendimento\n**Ticket:** \`${interaction.channel.name}\`\n**Fechado por:** <@${interaction.user.id}>\n**Dono:** <@${ticket.ownerId}>\n\n*Baixe o arquivo anexo para ver a conversa completa.*`);
                    
                    const logContainer = new ContainerBuilder()
                        .setAccentColor(0x2C2F33)
                        .addTextDisplayComponents(logHeader);

                    await logChannel.send({
                        flags: [MessageFlags.IsComponentsV2],
                        components: [logContainer],
                        files: [attachment]
                    });
                }
            }

            // 4. Limpeza
            await prisma.activeTicket.delete({ where: { channelId: interaction.channel.id } });
            
            setTimeout(() => {
                interaction.channel?.delete().catch(() => {});
            }, 5000);

        } catch (error) {
            console.error('Erro Logs:', error);
        }
    }
};