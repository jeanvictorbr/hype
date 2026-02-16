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
        const room = await prisma.autoVoiceRoom.findUnique({ where: { channelId: interaction.channel.id } });
        if (!room || interaction.user.id !== room.ownerId) {
            return interaction.reply({ content: '🚫 Ação não autorizada.', flags: [MessageFlags.Ephemeral] });
        }

        // 2. Executa a lógica (Abrir a sala)
        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, { Connect: null });

        // ==========================================
        // 🎛️ PAINEL V2 - ESTILO LISTA (Atualizado)
        // ==========================================

        // Cabeçalho de Estado (Verde/Aberto)
        const header = new TextDisplayBuilder()
            .setContent('# 🔓 Sala Aberta');

        const subHeader = new TextDisplayBuilder()
            .setContent('*A sala agora está pública. Qualquer membro pode entrar livremente.*');

        const divider = new SeparatorBuilder();

        // --- SEÇÃO 1: PERSONALIZAÇÃO ---
        const labelPersonal = new TextDisplayBuilder().setContent('**🎨 Personalização**');
        const rowPersonal = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('room_rename').setLabel('Renomear').setEmoji('✏️').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('room_limit').setLabel('Limite').setEmoji('👥').setStyle(ButtonStyle.Secondary)
        );

        // --- SEÇÃO 2: PRIVACIDADE (Estado Aberto) ---
        const labelPrivacy = new TextDisplayBuilder().setContent('**🛡️ Segurança e Acesso**');
        const rowPrivacy = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('room_lock').setLabel('Trancar').setEmoji('🔒').setStyle(ButtonStyle.Danger),
            // Botão "Abrir" desativado pois já está aberto
            new ButtonBuilder().setCustomId('room_unlock').setLabel('Destrancar').setEmoji('🔓').setStyle(ButtonStyle.Secondary).setDisabled(true)
        );

        // --- SEÇÃO 3: MODERAÇÃO ---
        const labelMod = new TextDisplayBuilder().setContent('**👥 Gestão de Membros**');
        const rowMod = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('room_allow').setLabel('Permitir User').setEmoji('✅').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('room_kick').setLabel('Desconectar').setEmoji('👢').setStyle(ButtonStyle.Danger)
        );

        // Montagem do Sanduíche
        const panelContainer = new ContainerBuilder()
            .setAccentColor(0x57F287) // Verde (Indicando livre acesso)
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