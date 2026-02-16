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
    customId: 'room_unlock',
    async execute(interaction, client) {
        const room = await prisma.autoVoiceRoom.findUnique({ where: { channelId: interaction.channel.id } });
        
        if (!room) return interaction.reply({ content: '❌ Sala não encontrada.', flags: [MessageFlags.Ephemeral] });
        if (interaction.user.id !== room.ownerId) return interaction.reply({ content: '🚫 Ação não autorizada.', flags: [MessageFlags.Ephemeral] });

        // Libera a sala
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
            .addTextDisplayComponents(header)
            .addActionRowComponents(controlsRow);

        // 🛠️ CORREÇÃO: Adicionando a flag de V2 no update para garantir que o Discord entenda o Container
        await interaction.update({ 
            flags: [MessageFlags.IsComponentsV2],
            components: [panelContainer] 
        });
    }
};