const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_claim',

    async execute(interaction, client) {
        // 1. Validação na Base de Dados
        const ticket = await prisma.activeTicket.findUnique({ 
            where: { channelId: interaction.channel.id } 
        });

        if (!ticket) {
            return interaction.reply({ 
                content: '❌ Este ticket não foi encontrado na base de dados.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // 2. Validação de Staff (Apenas a equipa pode assumir)
        const config = await prisma.ticketConfig.findUnique({ 
            where: { guildId: interaction.guild.id } 
        });

        const isStaff = interaction.member.roles.cache.some(role => config?.staffRoles.includes(role.id));
        const isAdmin = interaction.member.permissions.has('Administrator');

        if (!isStaff && !isAdmin) {
            return interaction.reply({ 
                content: '🚫 Apenas os membros da equipa de suporte (Staff) podem assumir tickets.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // ==========================================
        // 3. ATUALIZAÇÃO REATIVA DA INTERFACE (V2)
        // ==========================================
        const claimedHeader = new TextDisplayBuilder()
            .setContent(`# 🎫 Atendimento em Curso\nEste ticket foi assumido e está a ser analisado por <@${interaction.user.id}>.\n\n*Por favor, aguarde o suporte.*`);

        const controlRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_close')
                .setLabel('Fechar Ticket')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger),
            
            // O botão altera-se para mostrar quem assumiu e fica desativado!
            new ButtonBuilder()
                .setCustomId('ticket_claim_done')
                .setLabel(`Assumido por ${interaction.user.displayName}`)
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success)
                .setDisabled(true) 
        );

        const claimedContainer = new ContainerBuilder()
            .setAccentColor(0xFEE75C) // Amarelo/Dourado para indicar "Em Progresso"
            .addComponents(claimedHeader, controlRow);

        // Atualiza a mensagem original instantaneamente
        await interaction.update({ components: [claimedContainer] });
    }
};