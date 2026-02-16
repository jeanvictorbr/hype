const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'room_lock',
    async execute(interaction, client) {
        const room = await prisma.autoVoiceRoom.findUnique({ where: { channelId: interaction.channel.id } });
        if (!room || interaction.user.id !== room.ownerId) return interaction.reply({ content: '🚫 Ação não autorizada.', flags: [MessageFlags.Ephemeral] });

        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, { Connect: false });

        const title = new TextDisplayBuilder().setContent('# 🔒 Sala Restrita');
        const subtitle = new TextDisplayBuilder().setContent('A porta foi trancada. Apenas membros permitidos podem entrar.');
        const divider = new SeparatorBuilder();

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('room_lock').setLabel('Trancar').setEmoji('🔒').setStyle(ButtonStyle.Secondary).setDisabled(true),
            new ButtonBuilder().setCustomId('room_unlock').setLabel('Abrir').setEmoji('🔓').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('room_rename').setLabel('Nome').setEmoji('✏️').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('room_limit').setLabel('Limite').setEmoji('👥').setStyle(ButtonStyle.Primary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('room_allow').setLabel('Permitir').setEmoji('✅').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('room_kick').setLabel('Desconectar').setEmoji('👢').setStyle(ButtonStyle.Danger)
        );

        const panelContainer = new ContainerBuilder()
            .setAccentColor(0xED4245)
            .addTextDisplayComponents(title, subtitle)
            .addSeparatorComponents(divider)
            .addActionRowComponents(row1, row2); // ✅ Mantém todas as funcionalidades ativas

        await interaction.update({ flags: [MessageFlags.IsComponentsV2], components: [panelContainer] });
    }
};