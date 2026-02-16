const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'room_limit',
    async execute(interaction, client) {
        const room = await prisma.autoVoiceRoom.findUnique({ where: { channelId: interaction.channel.id } });
        if (!room || interaction.user.id !== room.ownerId) {
            return interaction.reply({ content: '🚫 Apenas o dono da sala!', flags: [MessageFlags.Ephemeral] });
        }

        const modal = new ModalBuilder()
            .setCustomId('modal_room_limit')
            .setTitle('👥 Limite da Sala');

        const limitInput = new TextInputBuilder()
            .setCustomId('input_room_limit')
            .setLabel('Capacidade (0 para ilimitado, máx 99)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: 5')
            .setRequired(true)
            .setMaxLength(2);

        modal.addComponents(new ActionRowBuilder().addComponents(limitInput));
        await interaction.showModal(modal);
    }
};