const { 
    PermissionFlagsBits, 
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
        // 1. Busca no banco
        const room = await prisma.autoVoiceRoom.findUnique({
            where: { channelId: interaction.channel.id }
        });

        if (!room) return interaction.reply({ content: '❌ Sala não encontrada no DB.', ephemeral: true });

        // 2. Trava de segurança
        if (interaction.user.id !== room.ownerId) {
            return interaction.reply({ content: '🚫 Apenas o dono pode destrancar.', ephemeral: true });
        }

        // 3. Libera o acesso no Discord (Permite a conexão para o @everyone)
        // Setar como 'null' remove a proibição e volta ao padrão da Categoria
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, {
            Connect: null
        });

        // ==========================================
        // 4. RECONSTRUINDO A INTERFACE V2 (ESTADO: ABERTA)
        // ==========================================
        const header = new TextDisplayBuilder()
            .setContent(`# 🔓 Sala Aberta\nA sala está pública. Qualquer membro do servidor pode entrar.`);

        const controlsRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('room_lock')
                .setLabel('Trancar')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Secondary), // Volta ao normal
            new ButtonBuilder()
                .setCustomId('room_unlock')
                .setLabel('Destrancar')
                .setEmoji('🔓')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true), // Desativa pois já está aberta!
            new ButtonBuilder()
                .setCustomId('room_rename')
                .setLabel('Renomear')
                .setEmoji('✏️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('room_kick')
                .setLabel('Expulsar')
                .setEmoji('👢')
                .setStyle(ButtonStyle.Danger)
        );

        const panelContainer = new ContainerBuilder()
            .setAccentColor(0x57F287) // Cor Verde (Indicador de livre acesso)
            .addComponents(header, controlsRow);

        await interaction.update({ components: [panelContainer] });
    }
};