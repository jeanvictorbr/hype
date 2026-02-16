const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'room_unlock',
    async execute(interaction, client) {
        // 1. Validação de Dono
        const room = await prisma.autoVoiceRoom.findUnique({ 
            where: { channelId: interaction.channel.id } 
        });

        if (!room || interaction.user.id !== room.ownerId) {
            return interaction.reply({ 
                content: '🚫 Ação não autorizada.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // 2. Executa a abertura da sala (Remove a restrição de Connect)
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, { Connect: null });

        // 3. Reconstrução do Painel Premium (Duas Linhas + Separador)
        const title = new TextDisplayBuilder().setContent('# 🔓 Sala Aberta');
        const subtitle = new TextDisplayBuilder().setContent('A sala agora está pública. Qualquer membro pode entrar livremente.');
        const divider = new SeparatorBuilder();

        // Linha 1: Configurações de Estado
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('room_lock').setLabel('Trancar').setEmoji('🔒').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('room_unlock').setLabel('Abrir').setEmoji('🔓').setStyle(ButtonStyle.Success).setDisabled(true), // Verde e desativado pois já está aberta
            new ButtonBuilder().setCustomId('room_rename').setLabel('Nome').setEmoji('✏️').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('room_limit').setLabel('Limite').setEmoji('👥').setStyle(ButtonStyle.Primary)
        );

        // Linha 2: Gestão de Membros
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('room_allow').setLabel('Permitir').setEmoji('✅').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('room_kick').setLabel('Desconectar').setEmoji('👢').setStyle(ButtonStyle.Danger)
        );

        const panelContainer = new ContainerBuilder()
            .setAccentColor(0x57F287) // Verde Sucesso
            .addTextDisplayComponents(title, subtitle)
            .addSeparatorComponents(divider)
            .addActionRowComponents(row1, row2); // ✅ Enviando as duas linhas para manter o painel completo

        // 4. Atualização Crítica
        await interaction.update({ 
            flags: [MessageFlags.IsComponentsV2], 
            components: [panelContainer] 
        });
    }
};