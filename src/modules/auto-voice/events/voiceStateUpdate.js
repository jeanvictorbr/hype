const { 
    ChannelType, 
    PermissionFlagsBits, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    ActionRowBuilder, 
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

                // ==========================================
                // 🎛️ PAINEL V2 (CORRIGIDO PARA V14.19+)
                // ==========================================
                const header = new TextDisplayBuilder()
                    .setContent(`# 🎛️ Central da Sala\nBem-vindo à sua sala temporária, <@${member.id}>. Use os controles abaixo para gerenciar o acesso.`);

                const controlsRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('room_lock').setLabel('Trancar').setEmoji('🔒').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('room_unlock').setLabel('Destrancar').setEmoji('🔓').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('room_rename').setLabel('Renomear').setEmoji('✏️').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('room_kick').setLabel('Expulsar').setEmoji('👢').setStyle(ButtonStyle.Danger)
                );

                // 🛠️ SINTAXE CORRETA DA V2: Separando métodos de texto e de botões
                const panelContainer = new ContainerBuilder()
                    .setAccentColor(0x2b2d31)
                    .addTextDisplayComponents(header)
                    .addActionRowComponents(controlsRow);

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