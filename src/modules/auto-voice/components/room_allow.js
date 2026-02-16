const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, UserSelectMenuBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'room_allow',
    async execute(interaction, client) {
        const room = await prisma.autoVoiceRoom.findUnique({ where: { channelId: interaction.channel.id } });
        if (!room || interaction.user.id !== room.ownerId) {
            return interaction.reply({ content: '🚫 Apenas o dono!', flags: [MessageFlags.Ephemeral] });
        }

        const header = new TextDisplayBuilder()
            .setContent('# ✅ Permitir Acesso\nEscolha um membro para permitir que ele entre na sua sala, mesmo que ela esteja trancada.');
        
        const userSelect = new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder()
                .setCustomId('select_room_allow')
                .setPlaceholder('Selecione o membro...')
        );

        const container = new ContainerBuilder()
            .setAccentColor(0x57F287)
            .addTextDisplayComponents(header)
            .addActionRowComponents(userSelect);

        await interaction.reply({ 
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2], 
            components: [container] 
        });
    }
};