const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_claim',

    async execute(interaction, client) {
        // ... (Validações de ticket/staff iguais ao anterior) ...
        const ticket = await prisma.activeTicket.findUnique({ where: { channelId: interaction.channel.id } });
        if (!ticket) return interaction.reply({ content: '❌ Erro: Ticket não encontrado no DB.', flags: [MessageFlags.Ephemeral] });

        const config = await prisma.ticketConfig.findUnique({ where: { guildId: interaction.guild.id } });
        const isStaff = interaction.member.roles.cache.some(r => config?.staffRoles.includes(r.id)) || interaction.member.permissions.has('Administrator');
        if (!isStaff) return interaction.reply({ content: '🚫 Apenas Staff.', flags: [MessageFlags.Ephemeral] });

        // ✅ ATUALIZAÇÃO: Salva o Claimer no Banco
        await prisma.activeTicket.update({
            where: { channelId: interaction.channel.id },
            data: { claimerId: interaction.user.id }
        });

        // UI V2
        const claimedHeader = new TextDisplayBuilder()
            .setContent(`# 🎫 Atendimento Iniciado\nEste ticket foi assumido por <@${interaction.user.id}>.\n\n*O staff agora é responsável por este suporte.*`);

        const controlRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_close').setLabel('Encerrar Atendimento').setEmoji('🔒').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('ticket_claim_done').setLabel(`Atendente: ${interaction.user.displayName}`).setEmoji('👨‍💻').setStyle(ButtonStyle.Secondary).setDisabled(true)
        );

        const container = new ContainerBuilder()
            .setAccentColor(0xFEE75C) // Amarelo
            .addTextDisplayComponents(claimedHeader)
            .addActionRowComponents(controlRow);

        await interaction.update({ components: [container], flags: [MessageFlags.IsComponentsV2] });
    }
};