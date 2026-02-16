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
    customId: 'room_lock',

    async execute(interaction, client) {
        // 1. Consulta no PostgreSQL para garantir a segurança
        const room = await prisma.autoVoiceRoom.findUnique({
            where: { channelId: interaction.channel.id }
        });

        if (!room) {
            return interaction.reply({ 
                content: '❌ Esta sala não consta no banco de dados ativo.', 
                ephemeral: true 
            });
        }

        // 2. Trava de Segurança: Apenas o dono pode trancar
        if (interaction.user.id !== room.ownerId) {
            return interaction.reply({ 
                content: '🚫 Apenas o dono da sala pode usar este painel.', 
                ephemeral: true 
            });
        }

        // 3. Altera a permissão do Discord (Nega a conexão para o @everyone)
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, {
            Connect: false
        });

        // ==========================================
        // 4. RECONSTRUINDO A INTERFACE V2 (ESTADO: TRANCADO)
        // ==========================================
        const header = new TextDisplayBuilder()
            .setContent(`# 🔒 Sala Trancada\nA sala foi trancada por <@${interaction.user.id}>. Novos membros não podem entrar (exceto a Staff com Passe Livre).`);

        const controlsRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('room_lock')
                .setLabel('Trancar')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true), // Desativa o botão, pois já está trancada!
            new ButtonBuilder()
                .setCustomId('room_unlock')
                .setLabel('Destrancar')
                .setEmoji('🔓')
                .setStyle(ButtonStyle.Success), // Fica verde chamando a atenção para destrancar
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
            .setAccentColor(0xED4245) // Cor Vermelha (Indicador visual de bloqueio)
            .addComponents(header, controlsRow);

        // Atualiza a mensagem no chat instantaneamente sem piscar a tela
        await interaction.update({ components: [panelContainer] });
    }
};