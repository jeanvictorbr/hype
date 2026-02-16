const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder,
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    MessageFlags
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_btn_panel',

    async execute(interaction, client) {
        // ==========================================
        // 1. VALIDAÇÃO DE INFRAESTRUTURA
        // ==========================================
        // Verifica se o admin já fez o setup básico antes de tentar mandar o painel
        const config = await prisma.ticketConfig.findUnique({
            where: { guildId: interaction.guild.id }
        });

        if (!config || !config.ticketCategory) {
            const errorText = new TextDisplayBuilder()
                .setContent('# ⚠️ Setup Incompleto\nVocê precisa rodar o **✨ Setup Rápido (Tickets)** primeiro para o bot criar a categoria de atendimento antes de enviar este painel.');
            
            const errorContainer = new ContainerBuilder()
                .setAccentColor(0xFEE75C) // Amarelo de Alerta
                .addComponents(errorText);

            return interaction.update({ components: [errorContainer] });
        }

        try {
            // ==========================================
            // 2. CONSTRUINDO O PAINEL PÚBLICO (Para os Membros)
            // ==========================================
            const publicHeader = new TextDisplayBuilder()
                .setContent('# 📩 Central de Atendimento\nPrecisa de suporte, quer tirar uma dúvida ou reportar um problema? Clique no botão abaixo para abrir um canal privado com a nossa equipe.');

            const publicRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_open') // 🚨 O ID mágico que vamos programar no próximo passo
                    .setLabel('Abrir Ticket')
                    .setEmoji('🎫')
                    .setStyle(ButtonStyle.Primary)
            );

            const publicContainer = new ContainerBuilder()
                .setAccentColor(0x2b2d31) // Dark theme liso
                .addComponents(publicHeader, publicRow);

            // 🚀 Envia o painel para o canal ATUAL onde o admin digitou /hype
            await interaction.channel.send({
                flags: [MessageFlags.IsComponentsV2],
                components: [publicContainer]
            });

            // ==========================================
            // 3. ATUALIZANDO O PAINEL DO ADMIN (Dashboard)
            // ==========================================
            const successText = new TextDisplayBuilder()
                .setContent(`# ✅ Painel Enviado!\nO painel de atendimento foi fixado com sucesso no canal <#${interaction.channel.id}>. Agora os membros já podem abrir tickets.`);
            
            const divider = new SeparatorBuilder();

            const backRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('dashboard_select_module')
                    .setLabel('◀ Voltar ao Dashboard')
                    .setStyle(ButtonStyle.Secondary)
            );

            const successContainer = new ContainerBuilder()
                .setAccentColor(0x57F287) // Verde
                .addComponents(successText, divider, backRow);

            // Atualiza a tela do admin invisívelmente
            await interaction.update({ components: [successContainer] });

        } catch (error) {
            console.error('❌ Erro ao enviar painel de tickets:', error);
            
            const errorText = new TextDisplayBuilder()
                .setContent('# ❌ Erro de Permissão\nNão consegui enviar o painel neste canal. Verifique se tenho permissão para **Enviar Mensagens** aqui.');
            
            const errorContainer = new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addComponents(errorText);

            await interaction.update({ components: [errorContainer] });
        }
    }
};