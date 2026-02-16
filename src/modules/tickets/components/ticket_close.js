const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    MessageFlags,
    AttachmentBuilder
} = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateTranscriptHTML } = require('../../../utils/htmlGenerator');

module.exports = {
    customId: 'ticket_close',

    async execute(interaction, client) {
        // Blindagem contra duplo clique
        if (interaction.replied || interaction.deferred) return;

        // 1. Validações
        const ticket = await prisma.activeTicket.findUnique({ 
            where: { channelId: interaction.channel.id } 
        });

        if (!ticket) return interaction.reply({ content: '❌ Ticket inválido.', flags: [MessageFlags.Ephemeral] });

        const config = await prisma.ticketConfig.findUnique({ 
            where: { guildId: interaction.guild.id } 
        });
        
        const isStaff = interaction.member.roles.cache.some(role => config?.staffRoles.includes(role.id));
        const isOwner = interaction.user.id === ticket.ownerId;
        const isAdmin = interaction.member.permissions.has('Administrator');

        if (!isStaff && !isOwner && !isAdmin) {
            return interaction.reply({ content: '🚫 Sem permissão.', flags: [MessageFlags.Ephemeral] });
        }

        // ==========================================
        // 2. INTERFACE DE ENCERRAMENTO (V2 CORRIGIDA)
        // ==========================================
        const closingHeader = new TextDisplayBuilder()
            .setContent(`# 🔒 A Fechar Ticket...\nEncerrado por <@${interaction.user.id}>.\n\n*Gerando transcrição e salvando logs...*`);

        const closingContainer = new ContainerBuilder()
            .setAccentColor(0xED4245)
            .addTextDisplayComponents(closingHeader); // ✅ CORRIGIDO

        await interaction.update({ components: [closingContainer] });

        // ==========================================
        // 3. GERAÇÃO DE LOGS
        // ==========================================
        try {
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            
            const htmlContent = generateTranscriptHTML(
                interaction.guild, 
                interaction.channel, 
                messages, 
                interaction.user.tag
            );

            const transcriptBuffer = Buffer.from(htmlContent, 'utf-8');
            const attachment = new AttachmentBuilder(transcriptBuffer, { 
                name: `transcript-${interaction.channel.name}.html` 
            });

            if (config.logChannel) {
                const logChannelObj = interaction.guild.channels.cache.get(config.logChannel);
                if (logChannelObj) {
                    const logHeader = new TextDisplayBuilder()
                        .setContent(`# 🗄️ Log de Atendimento\n**Ticket:** \`${interaction.channel.name}\`\n**Fechado por:** <@${interaction.user.id}>`);
                    
                    const logContainer = new ContainerBuilder()
                        .setAccentColor(0x2C2F33)
                        .addTextDisplayComponents(logHeader); // ✅ CORRIGIDO

                    await logChannelObj.send({
                        flags: [MessageFlags.IsComponentsV2],
                        components: [logContainer],
                        files: [attachment]
                    });
                }
            }

            // Limpeza
            await prisma.activeTicket.delete({ where: { channelId: interaction.channel.id } });

            setTimeout(async () => {
                if (interaction.channel) await interaction.channel.delete().catch(() => {});
            }, 5000);

        } catch (error) {
            console.error('Erro no log:', error);
        }
    }
};