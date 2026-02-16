const { 
    ChannelType, 
    PermissionFlagsBits, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    ActionRowBuilder, 
    SeparatorBuilder,
    ButtonBuilder, 
    ButtonStyle,
    MessageFlags
} = require('discord.js');
const { prisma } = require('../../../core/database');

// 🛡️ SISTEMA DE COOLDOWN EM MEMÓRIA
const cooldownCache = new Map();
const COOLDOWN_TIME_MS = 15000;

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState, client) {
        const member = newState.member;
        if (member.user.bot) return;

        const guildId = newState.guild.id;

        // ==========================================
        // 🗑️ AÇÃO: LIMPEZA DE SALAS VAZIAS
        // ==========================================
        if (oldState.channelId && oldState.channelId !== newState.channelId) {
            const isTempRoom = await prisma.autoVoiceRoom.findUnique({
                where: { channelId: oldState.channelId }
            });

            if (isTempRoom) {
                const channel = oldState.channel;
                if (channel && channel.members.size === 0) {
                    try {
                        await prisma.autoVoiceRoom.delete({ where: { channelId: channel.id } });
                        await channel.delete();
                    } catch (error) {
                        console.error('❌ Erro ao deletar sala vazia:', error);
                    }
                }
            }
        }

        // ==========================================
        // 🚀 AÇÃO: CRIAÇÃO DE SALA DINÂMICA
        // ==========================================
        const config = await prisma.autoVoiceConfig.findUnique({
            where: { guildId: guildId }
        });

        if (!config || !config.triggerChannel) return;

        if (newState.channelId === config.triggerChannel) {
            
            // Validação Anti-Spam
            const userCooldown = cooldownCache.get(member.id);
            if (userCooldown && Date.now() < userCooldown) {
                await newState.disconnect('Proteção Anti-Spam').catch(() => {});
                return;
            }

            try {
                cooldownCache.set(member.id, Date.now() + COOLDOWN_TIME_MS);

                const permissionOverwrites = [
                    {
                        id: newState.guild.roles.everyone.id,
                        allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: member.id,
                        allow: [
                            PermissionFlagsBits.Connect, 
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.ManageRoles,
                            PermissionFlagsBits.MuteMembers,
                            PermissionFlagsBits.DeafenMembers,
                            PermissionFlagsBits.MoveMembers
                        ],
                    }
                ];

                if (config.bypassRoles && config.bypassRoles.length > 0) {
                    for (const roleId of config.bypassRoles) {
                        permissionOverwrites.push({
                            id: roleId,
                            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel],
                        });
                    }
                }

                const tempChannel = await newState.guild.channels.create({
                    name: `🔊 Sala de ${member.displayName}`,
                    type: ChannelType.GuildVoice,
                    parent: config.tempCategory || null,
                    permissionOverwrites: permissionOverwrites,
                });

                await newState.setChannel(tempChannel);

                await prisma.autoVoiceRoom.create({
                    data: { channelId: tempChannel.id, ownerId: member.id, guildId: guildId }
                });

// --- DESIGN PREMIUM NÍVEL APP V2 ---
const title = new TextDisplayBuilder()
    .setContent('# 🎧 Controle de Voz');

const subtitle = new TextDisplayBuilder()
    .setContent(`Gerencie sua sala com precisão.\n**Dono:** <@${member.id}>`);

const divider = new SeparatorBuilder();

// Linha 1: Estado da Sala
const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('room_lock').setLabel('Trancar').setEmoji('🔒').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('room_unlock').setLabel('Abrir').setEmoji('🔓').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('room_rename').setLabel('Nome').setEmoji('✏️').setStyle(ButtonStyle.Primary)
);

// Linha 2: Membros e Limite
const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('room_limit').setLabel('Limite').setEmoji('👥').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('room_allow').setLabel('Permitir').setEmoji('✅').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('room_kick').setLabel('Desconectar').setEmoji('👢').setStyle(ButtonStyle.Danger)
);

// Criando o Container com Media (Thumbnail)
const panelContainer = new ContainerBuilder()
    .setAccentColor(0x2b2d31)
    .setThumbnail('https://media.discordapp.net/attachments/1449063580728299570/1472328878117621862/3513613561351351346.jpg?ex=69937e1f&is=69922c9f&hm=ee4127e73ecd2db6a83f1ea62c09cf99ac5b2c66b5d0dea99d61801e5be0fae3&=&format=webp') // 🖼️ ADICIONE O LINK DA SUA LOGO AQUI
    .addTextDisplayComponents(title, subtitle)
    .addSeparatorComponents(divider)
    .addActionRowComponents(row1, row2);

await tempChannel.send({ 
    flags: [MessageFlags.IsComponentsV2], 
    components: [panelContainer] 
});

            } catch (error) {
                console.error('❌ Erro ao criar sala temporária:', error);
                await newState.disconnect().catch(() => {});
            }
        }
    }
};