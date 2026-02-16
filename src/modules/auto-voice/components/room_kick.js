const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'room_kick',
    async execute(interaction, client) {
        const room = await prisma.autoVoiceRoom.findUnique({ where: { channelId: interaction.channel.id } });
        if (!room || interaction.user.id !== room.ownerId) return interaction.reply({ content: '🚫 Ação não autorizada.', flags: [MessageFlags.Ephemeral] });

        const targets = interaction.channel.members.filter(m => m.id !== room.ownerId && !m.user.bot);
        if (targets.size === 0) return interaction.reply({ content: '🤷‍♂️ Não há ninguém para expulsar.', flags: [MessageFlags.Ephemeral] });

        const header = new TextDisplayBuilder().setContent('# 👢 Expulsar Membro\nSelecione quem você deseja remover.');
        const selectMenu = new StringSelectMenuBuilder().setCustomId('select_room_kick').setPlaceholder('Escolha o alvo...');

        targets.forEach(target => {
            selectMenu.addOptions({ label: target.displayName, value: target.id, emoji: '👤' });
        });

        const panelContainer = new ContainerBuilder()
            .setAccentColor(0xED4245)
            .addTextDisplayComponents(header) // ✅ CORREÇÃO V2
            .addActionRowComponents(new ActionRowBuilder().addComponents(selectMenu)); // ✅ CORREÇÃO V2

        await interaction.reply({ components: [panelContainer], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
    }
};