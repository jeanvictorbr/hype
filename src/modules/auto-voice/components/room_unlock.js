const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'room_unlock',
    async execute(interaction, client) {
        const room = await prisma.autoVoiceRoom.findUnique({ where: { channelId: interaction.channel.id } });
        if (!room || interaction.user.id !== room.ownerId) return interaction.reply({ content: '🚫 Ação não autorizada.', ephemeral: true });

        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, { Connect: null });

        const header = new TextDisplayBuilder().setContent(`# 🔓 Sala Aberta\nA sala está pública. Qualquer membro pode entrar.`);

        const controlsRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('room_lock').setLabel('Trancar').setEmoji('🔒').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('room_unlock').setLabel('Destrancar').setEmoji('🔓').setStyle(ButtonStyle.Secondary).setDisabled(true),
            new ButtonBuilder().setCustomId('room_rename').setLabel('Renomear').setEmoji('✏️').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('room_kick').setLabel('Expulsar').setEmoji('👢').setStyle(ButtonStyle.Danger)
        );

        const panelContainer = new ContainerBuilder()
            .setAccentColor(0x57F287)
            .addTextDisplayComponents(header) // ✅ CORREÇÃO V2
            .addActionRowComponents(controlsRow); // ✅ CORREÇÃO V2

        await interaction.update({ components: [panelContainer] });
    }
};