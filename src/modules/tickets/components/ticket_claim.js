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

        // 2. Validação de Staff
        const config = await prisma.ticketConfig.findUnique({ 
            where: { guildId: interaction.guild.id } 
        });

        const isStaff = interaction.member.roles.cache.some(role => config?.staffRoles.includes(role.id));
        const isAdmin = interaction.member.permissions.has('Administrator');

        if (!isStaff && !isAdmin) {
            return interaction.reply({ 
                content: '🚫 Apenas a equipe de Staff pode assumir tickets.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // ==========================================
        // 3. ATUALIZAÇÃO REATIVA (V2 CORRIGIDA)
        // ==========================================
        const claimedHeader = new TextDisplayBuilder()
            .setContent(`# 🎫 Atendimento em Curso\nEste ticket foi assumido por <@${interaction.user.id}>.\n\n*Aguarde o atendimento.*`);

        const controlRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_close')
                .setLabel('Fechar Ticket')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger),
            
            new ButtonBuilder()
                .setCustomId('ticket_claim_done')
                .setLabel(`Assumido por ${interaction.user.displayName}`)
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success)
                .setDisabled(true) 
        );

        const claimedContainer = new ContainerBuilder()
            .setAccentColor(0xFEE75C) // Amarelo
            .addTextDisplayComponents(claimedHeader) // ✅ CORRIGIDO
            .addActionRowComponents(controlRow);     // ✅ CORRIGIDO

        await interaction.update({ 
            components: [claimedContainer],
            flags: [MessageFlags.IsComponentsV2]
        });
    }
};