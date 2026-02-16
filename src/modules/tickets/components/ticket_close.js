const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    MessageFlags,
    AttachmentBuilder
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_close',

    async execute(interaction, client) {
        const ticket = await prisma.activeTicket.findUnique({ 
            where: { channelId: interaction.channel.id } 
        });

        if (!ticket) return interaction.reply({ content: '❌ Ticket não reconhecido.', flags: [MessageFlags.Ephemeral] });

        const config = await prisma.ticketConfig.findUnique({ 
            where: { guildId: interaction.guild.id } 
        });
        
        const isStaff = interaction.member.roles.cache.some(role => config?.staffRoles.includes(role.id));
        const isOwner = interaction.user.id === ticket.ownerId;
        const isAdmin = interaction.member.permissions.has('Administrator');

        if (!isStaff && !isOwner && !isAdmin) {
            return interaction.reply({ content: '🚫 Não tens permissão para fechar isto.', flags: [MessageFlags.Ephemeral] });
        }

        // ==========================================
        // 1. TELA DE ENCERRAMENTO (UX)
        // ==========================================
        const closingHeader = new TextDisplayBuilder()
            .setContent(`# 🔒 Encerrando e Guardando Logs...\nO ticket foi fechado por <@${interaction.user.id}>.\n\n*A gerar transcrição de mensagens e a finalizar a sessão em 5 segundos...*`);

        const closingContainer = new ContainerBuilder()
            .setAccentColor(0xED4245)
            .addComponents(closingHeader);

        await interaction.update({ components: [closingContainer] });

        // ==========================================
        // 2. GERAÇÃO DA TRANSCRIÇÃO (Nativo Node.js)
        // ==========================================
        try {
            // Puxa as últimas 100 mensagens do canal
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            
            // Inverte a ordem para ficar cronológico (da mais antiga para a mais nova)
            const chronologicalMessages = Array.from(messages.values()).reverse();
            
            // Formata as mensagens num texto limpo
            const transcriptArray = chronologicalMessages.map(msg => {
                const date = new Date(msg.createdTimestamp).toLocaleString('pt-PT');
                // Se for o bot a falar do painel, ignoramos ou formatamos diferente
                if (msg.author.bot) return `[${date}] SISTEMA: Painel de Controlo`;
                return `[${date}] ${msg.author.tag}: ${msg.content || '[Anexo/Imagem]'}`;
            });

            // Junta tudo num cabeçalho organizado
            const transcriptText = `=== TRANSCRICAO DO TICKET ===\nServidor: ${interaction.guild.name}\nTicket ID: ${interaction.channel.name}\nAberto por ID: ${ticket.ownerId}\nFechado por: ${interaction.user.tag}\n=============================\n\n${transcriptArray.join('\n')}`;

            // Transforma o texto num Buffer (Ficheiro na memória RAM)
            const transcriptBuffer = Buffer.from(transcriptText, 'utf-8');
            const attachment = new AttachmentBuilder(transcriptBuffer, { name: `transcript-${interaction.channel.name}.txt` });

            // ==========================================
            // 3. ENVIO PARA O CANAL DE LOGS
            // ==========================================
            if (config.logChannel) {
                const logChannelObj = interaction.guild.channels.cache.get(config.logChannel);
                if (logChannelObj) {
                    const logHeader = new TextDisplayBuilder()
                        .setContent(`# 🗄️ Registo de Atendimento\n**Ticket:** \`${interaction.channel.name}\`\n**Fechado por:** <@${interaction.user.id}>\n\n*A transcrição completa da conversa encontra-se no ficheiro em anexo.*`);
                    
                    const logContainer = new ContainerBuilder()
                        .setAccentColor(0x2C2F33) // Cor Dark (Auditoria)
                        .addComponents(logHeader);

                    await logChannelObj.send({
                        flags: [MessageFlags.IsComponentsV2],
                        components: [logContainer],
                        files: [attachment] // Envia o ficheiro .txt junto com a interface V2!
                    });
                }
            }

            // =========s=================================
            // 4. LIMPEZA FINAL
            // ==========================================
            await prisma.activeTicket.delete({ where: { channelId: interaction.channel.id } });

            setTimeout(async () => {
                try {
                    await interaction.channel.delete();
                } catch (err) { }
            }, 5000);

        } catch (error) {
            console.error('❌ Erro na geração de logs:', error);
        }
    }
};