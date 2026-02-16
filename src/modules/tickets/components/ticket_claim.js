const { 
    ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_claim',

    async execute(interaction, client) {
        // 1. Validações
        const ticket = await prisma.activeTicket.findUnique({ where: { channelId: interaction.channel.id } });
        if (!ticket) return interaction.reply({ content: '❌ Ticket não encontrado.', flags: [MessageFlags.Ephemeral] });

        const config = await prisma.ticketConfig.findUnique({ where: { guildId: interaction.guild.id } });
        
        const isStaff = interaction.member.roles.cache.some(r => config?.staffRoles.includes(r.id));
        const isAdmin = interaction.member.permissions.has('Administrator');

        if (!isStaff && !isAdmin) return interaction.reply({ content: '🚫 Apenas Staff.', flags: [MessageFlags.Ephemeral] });

        // 2. Atualiza quem assumiu no Banco
        await prisma.activeTicket.update({
            where: { channelId: interaction.channel.id },
            data: { claimerId: interaction.user.id }
        });

        // 3. UI V2 Atualizada (Com botão de Membros restaurado)
        const claimedHeader = new TextDisplayBuilder()
            .setContent(`# 🎫 Atendimento Iniciado\nEste ticket foi assumido por <@${interaction.user.id}>.`);

        const controlRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_close').setLabel('Fechar').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
            new ButtonBuilder().setCustomId('ticket_claim_done').setLabel(`Assumido por ${interaction.user.displayName}`).setEmoji('✅').setStyle(ButtonStyle.Success).setDisabled(true),
            // 👇 Botão Restaurado
            new ButtonBuilder().setCustomId('ticket_users_menu').setLabel('Membros').setStyle(ButtonStyle.Secondary).setEmoji('👥')
        );

        const claimedContainer = new ContainerBuilder()
            .setAccentColor(0xFEE75C) // Amarelo
            .addTextDisplayComponents(claimedHeader)
            .addActionRowComponents(controlRow);

        await interaction.update({ 
            components: [claimedContainer], 
            flags: [MessageFlags.IsComponentsV2] 
        });
    }
};