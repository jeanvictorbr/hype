const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'modal_room_rename',
    async execute(interaction, client) {
        const room = await prisma.autoVoiceRoom.findUnique({ where: { channelId: interaction.channel.id } });
        if (!room || interaction.user.id !== room.ownerId) return interaction.reply({ content: '🚫 Ação não autorizada.', ephemeral: true });

        const newName = interaction.fields.getTextInputValue('input_new_name');

        try {
            await interaction.channel.setName(newName);

            const successText = new TextDisplayBuilder().setContent(`# ✅ Nome Alterado\nSala renomeada para **${newName}**.`);
            
            const successContainer = new ContainerBuilder()
                .setAccentColor(0x57F287)
                .addTextDisplayComponents(successText); // ✅ CORREÇÃO V2

            await interaction.reply({ components: [successContainer], flags: [MessageFlags.Ephemeral] });
        } catch (error) {
            console.error('❌ Erro ao renomear sala:', error);
            await interaction.reply({ content: '❌ Erro ao renomear. Pode ser o limite de tempo do Discord (2 trocas a cada 10min).', flags: [MessageFlags.Ephemeral] });
        }
    }
};