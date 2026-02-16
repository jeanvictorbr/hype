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

// ==========================================
// 🎛️ PAINEL V2 - ESTILO LISTA (Settings Layout)
// ==========================================

// Cabeçalho Principal
const header = new TextDisplayBuilder()
    .setContent('# 🎧 Controle de Voz')
    .setWeight('Bold');

const subHeader = new TextDisplayBuilder()
    .setContent(`Gerencie a sala de <@${member.id}>`)
    .setColor('Subtext');

const divider = new SeparatorBuilder();

// --- SEÇÃO 1: PERSONALIZAÇÃO (Nome e Limite) ---
const labelPersonal = new TextDisplayBuilder().setContent('**🎨 Personalização**');
const rowPersonal = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('room_rename').setLabel('Renomear').setEmoji('✏️').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('room_limit').setLabel('Limite').setEmoji('👥').setStyle(ButtonStyle.Secondary)
);

// --- SEÇÃO 2: PRIVACIDADE (Trancar/Abrir) ---
const labelPrivacy = new TextDisplayBuilder().setContent('**🛡️ Segurança e Acesso**');
const rowPrivacy = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('room_lock').setLabel('Trancar').setEmoji('🔒').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('room_unlock').setLabel('Destrancar').setEmoji('🔓').setStyle(ButtonStyle.Success)
);

// --- SEÇÃO 3: MODERAÇÃO (Kick/Allow) ---
const labelMod = new TextDisplayBuilder().setContent('**👥 Gestão de Membros**');
const rowMod = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('room_allow').setLabel('Permitir User').setEmoji('✅').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('room_kick').setLabel('Desconectar').setEmoji('👢').setStyle(ButtonStyle.Danger)
);

// Montagem do Container em Camadas (Sanduíche)
const panelContainer = new ContainerBuilder()
    .setAccentColor(0x2b2d31) // Dark Mode Limpo
    // Topo
    .addTextDisplayComponents(header, subHeader)
    .addSeparatorComponents(divider)
    
    // Item 1
    .addTextDisplayComponents(labelPersonal)
    .addActionRowComponents(rowPersonal)
    .addSeparatorComponents(new SeparatorBuilder()) // Linha divisória igual ao exemplo
    
    // Item 2
    .addTextDisplayComponents(labelPrivacy)
    .addActionRowComponents(rowPrivacy)
    .addSeparatorComponents(new SeparatorBuilder()) // Linha divisória igual ao exemplo
    
    // Item 3
    .addTextDisplayComponents(labelMod)
    .addActionRowComponents(rowMod);

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