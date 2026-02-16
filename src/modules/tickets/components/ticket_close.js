const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    MessageFlags,
    AttachmentBuilder
} = require('discord.js');
const { prisma } = require('../../../core/database');
// 👇 IMPORTANTE: Importa o novo gerador de HTML que criamos
const { generateTranscriptHTML } = require('../../../utils/htmlGenerator');

module.exports = {
    customId: 'ticket_close',

    async execute(interaction, client) {
        // ==========================================
        // 1. VALIDAÇÕES DE SEGURANÇA
        // ==========================================
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
        // 2. INTERFACE DE ENCERRAMENTO (UX)
        // ==========================================
        const closingHeader = new TextDisplayBuilder()
            .setContent(`# 🔒 A Fechar Ticket...\nO ticket foi encerrado por <@${interaction.user.id}>.\n\n*A gerar transcrição HTML e a enviar para os logs...*`);

        const closingContainer = new ContainerBuilder()
            .setAccentColor(0xED4245) // Vermelho
            .addComponents(closingHeader);

        await interaction.update({ components: [closingContainer] });

        // ==========================================
        // 3. GERAÇÃO DO LOG (TRANSCRIPT HTML)
        // ==========================================
        try {
            // Puxa as últimas 100 mensagens do canal
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            
            // 🔥 GERA O CONTEÚDO HTML COM O NOSSO GERADOR
            // Passamos a guilda, o canal, as mensagens e quem fechou
            const htmlContent = generateTranscriptHTML(
                interaction.guild, 
                interaction.channel, 
                messages, 
                interaction.user.tag
            );

            // Cria o arquivo na memória (Buffer)
            const transcriptBuffer = Buffer.from(htmlContent, 'utf-8');
            
            // Prepara o anexo com extensão .html
            const attachment = new AttachmentBuilder(transcriptBuffer, { 
                name: `transcript-${interaction.channel.name}.html` 
            });

            // ==========================================
            // 4. ENVIO PARA O CANAL DE LOGS (Se configurado)
            // ==========================================
            if (config.logChannel) {
                const logChannelObj = interaction.guild.channels.cache.get(config.logChannel);
                
                if (logChannelObj) {
                    // Interface V2 para o Canal de Logs
                    const logHeader = new TextDisplayBuilder()
                        .setContent(`# 🗄️ Registo de Atendimento (Premium)\n**Ticket:** \`${interaction.channel.name}\`\n**Fechado por:** <@${interaction.user.id}>\n\n*Baixe o ficheiro abaixo e abra no navegador para ver a conversa.*`);
                    
                    const logContainer = new ContainerBuilder()
                        .setAccentColor(0x2C2F33) // Cor Dark (Auditoria)
                        .addComponents(logHeader);

                    // Envia: Container Bonito + Arquivo HTML
                    await logChannelObj.send({
                        flags: [MessageFlags.IsComponentsV2],
                        components: [logContainer],
                        files: [attachment]
                    });
                }
            }

            // ==========================================
            // 5. LIMPEZA FINAL (Banco e Canal)
            // ==========================================
            // Remove o ticket da tabela de "Ativos"
            await prisma.activeTicket.delete({ where: { channelId: interaction.channel.id } });

            // Deleta o canal após 5 segundos
            setTimeout(async () => {
                try {
                    await interaction.channel.delete();
                } catch (err) { 
                    console.error('Erro ao deletar canal:', err);
                }
            }, 5000);

        } catch (error) {
            console.error('❌ Erro crítico ao gerar logs:', error);
            // Opcional: Avisar no canal se der erro, mas como vai ser deletado, o console basta.
        }
    }
};