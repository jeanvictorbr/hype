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
    customId: 'room_lock',
    async execute(interaction, client) {
        // 1. Validação de Dono
        const room = await prisma.autoVoiceRoom.findUnique({ where: { channelId: interaction.channel.id } });
        if (!room || interaction.user.id !== room.ownerId) {
            return interaction.reply({ content: '🚫 Ação não autorizada.', flags: [MessageFlags.Ephemeral] });
        }

        // 2. Executa a lógica (Trancar a sala)
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, { Connect: false });

        // ==========================================
        // 🎛️ PAINEL V2 - ESTILO LISTA (Atualizado)
        // ==========================================

        // Cabeçalho de Estado (Vermelho/Trancado)
        const header = new TextDisplayBuilder()
            .setContent('# 🔒 Sala Restrita');

        const subHeader = new TextDisplayBuilder()
            .setContent('*A porta foi trancada. Apenas membros permitidos podem entrar.*');

        const divider = new SeparatorBuilder();

        // --- SEÇÃO 1: PERSONALIZAÇÃO ---
        const labelPersonal = new TextDisplayBuilder().setContent('**🎨 Personalização**');
        const rowPersonal = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('room_rename').setLabel('Renomear').setEmoji('✏️').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('room_limit').setLabel('Limite').setEmoji('👥').setStyle(ButtonStyle.Secondary)
        );

        // --- SEÇÃO 2: PRIVACIDADE (Estado Trancado) ---
        const labelPrivacy = new TextDisplayBuilder().setContent('**🛡️ Segurança e Acesso**');
        const rowPrivacy = new ActionRowBuilder().addComponents(
            // Botão "Trancar" fica desativado pois já está trancado
            new ButtonBuilder().setCustomId('room_lock').setLabel('Trancar').setEmoji('🔒').setStyle(ButtonStyle.Secondary).setDisabled(true),
            new ButtonBuilder().setCustomId('room_unlock').setLabel('Destrancar').setEmoji('🔓').setStyle(ButtonStyle.Success)
        );

        // --- SEÇÃO 3: MODERAÇÃO ---
        const labelMod = new TextDisplayBuilder().setContent('**👥 Gestão de Membros**');
        const rowMod = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('room_allow').setLabel('Permitir User').setEmoji('✅').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('room_kick').setLabel('Desconectar').setEmoji('👢').setStyle(ButtonStyle.Danger)
        );

        // Montagem do Sanduíche
        const panelContainer = new ContainerBuilder()
            .setAccentColor(0xED4245) // Vermelho (Indicando bloqueio)
            // Topo
            .addTextDisplayComponents(header)
            .addTextDisplayComponents(subHeader)
            .addSeparatorComponents(divider)
            
            // Item 1
            .addTextDisplayComponents(labelPersonal)
            .addActionRowComponents(rowPersonal)
            .addSeparatorComponents(new SeparatorBuilder())
            
            // Item 2
            .addTextDisplayComponents(labelPrivacy)
            .addActionRowComponents(rowPrivacy)
            .addSeparatorComponents(new SeparatorBuilder())
            
            // Item 3
            .addTextDisplayComponents(labelMod)
            .addActionRowComponents(rowMod);

        // Atualiza a mensagem existente
        await interaction.update({ 
            flags: [MessageFlags.IsComponentsV2], 
            components: [panelContainer] 
        });
    }
};