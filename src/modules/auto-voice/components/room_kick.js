const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'room_kick',

    async execute(interaction, client) {
        // 1. Validação padrão de segurança no PostgreSQL
        const room = await prisma.autoVoiceRoom.findUnique({
            where: { channelId: interaction.channel.id }
        });

        if (!room || interaction.user.id !== room.ownerId) {
            return interaction.reply({ 
                content: '🚫 Apenas o dono da sala pode expulsar membros.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // 2. Busca quem está na call de voz neste exato momento
        const voiceChannel = interaction.channel;
        const membersInCall = voiceChannel.members;

        // Filtra para tirar o próprio dono e bots da lista de alvos
        const targets = membersInCall.filter(m => m.id !== room.ownerId && !m.user.bot);

        if (targets.size === 0) {
            return interaction.reply({ 
                content: '🤷‍♂️ Não há mais ninguém na sua sala para expulsar.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // ==========================================
        // 3. CONSTRUINDO A INTERFACE V2 DINÂMICA
        // ==========================================
        const header = new TextDisplayBuilder()
            .setContent('# 👢 Expulsar Membro\nSelecione abaixo quem você deseja remover da sua sala. A pessoa será desconectada imediatamente.');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_room_kick') // ID que o próximo arquivo vai escutar
            .setPlaceholder('Selecione o alvo...');

        // Adiciona cada pessoa da call como uma opção no menu
        targets.forEach(target => {
            selectMenu.addOptions({
                label: target.displayName,
                description: `ID: ${target.id}`,
                value: target.id,
                emoji: '👤'
            });
        });

        const actionRow = new ActionRowBuilder().addComponents(selectMenu);

        const panelContainer = new ContainerBuilder()
            .setAccentColor(0xED4245) // Vermelho Perigo
            .addComponents(header, actionRow);

        // Envia como uma interface "Fantasma" (Ephemeral) só pro dono
        await interaction.reply({
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            components: [panelContainer]
        });
    }
};