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
const COOLDOWN_TIME_MS = 10000; // Reduzido para 10s para melhor UX

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState, client) {
        const member = newState.member;
        if (!member || member.user.bot) return;

        const guildId = newState.guild.id;

        // ==========================================
        // 🗑️ AÇÃO: LIMPEZA DE SALAS (BLINDADO API)
        // ==========================================
        if (oldState.channelId && oldState.channelId !== newState.channelId) {
            try {
                const room = await prisma.autoVoiceRoom.findUnique({
                    where: { channelId: oldState.channelId }
                });

                if (room) {
                    // 🔥 BLINDAGEM 1: Força o fetch real na API em vez de confiar no Cache
                    const channel = await oldState.guild.channels.fetch(oldState.channelId).catch(() => null);
                    
                    if (channel) {
                        if (channel.members.size === 0) {
                            // Tenta apagar no Discord primeiro
                            await channel.delete('Auto-Voice: Último membro saiu.').catch(() => {});
                            // Depois apaga do Banco de Dados
                            await prisma.autoVoiceRoom.delete({ where: { channelId: channel.id } }).catch(() => {});
                        }
                    } else {
                        // Se o canal já não existe no Discord (apagado à mão), limpa o "fantasma" do BD
                        await prisma.autoVoiceRoom.delete({ where: { channelId: oldState.channelId } }).catch(() => {});
                    }
                }
            } catch (err) {
                console.error('❌ Erro na limpeza da sala:', err);
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

                // Cria o Canal
                const tempChannel = await newState.guild.channels.create({
                    name: `🔊・Sala de ${member.displayName}`,
                    type: ChannelType.GuildVoice,
                    parent: config.tempCategory || null,
                    permissionOverwrites: permissionOverwrites,
                });

                // Salva no Banco de Dados
                await prisma.autoVoiceRoom.create({
                    data: { channelId: tempChannel.id, ownerId: member.id, guildId: guildId }
                });

                // Tenta puxar o membro para a nova sala
                const currentMemberState = await newState.guild.members.fetch(member.id).catch(() => null);
                if (currentMemberState && currentMemberState.voice.channelId === config.triggerChannel) {
                    await currentMemberState.voice.setChannel(tempChannel).catch(() => {});
                }

                // 🔥 BLINDAGEM 2: O ANTI-ZOMBIE
                // Espera 3 segundos. Se a sala estiver vazia (porque o dono fugiu a meio do processo), destrói a sala.
                setTimeout(async () => {
                    const checkChannel = await newState.guild.channels.fetch(tempChannel.id).catch(() => null);
                    if (checkChannel && checkChannel.members.size === 0) {
                        await checkChannel.delete('Auto-Voice: Prevenção de Canal Zombie.').catch(() => {});
                        await prisma.autoVoiceRoom.delete({ where: { channelId: tempChannel.id } }).catch(() => {});
                    }
                }, 3000);


                // ==========================================
                // 🎛️ PAINEL V2 - ESTILO LISTA (Settings Layout)
                // ==========================================
                const header = new TextDisplayBuilder().setContent('# 🎧 Controle de Voz');
                const subHeader = new TextDisplayBuilder().setContent(`Gerencie a sala de <@${member.id}>\n*Use os botões abaixo para configurar.*`);

                const divider = new SeparatorBuilder();

                const labelPersonal = new TextDisplayBuilder().setContent('**🎨 Personalização**');
                const rowPersonal = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('room_rename').setLabel('Renomear').setEmoji('✏️').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('room_limit').setLabel('Limite').setEmoji('👥').setStyle(ButtonStyle.Secondary)
                );

                const labelPrivacy = new TextDisplayBuilder().setContent('**🛡️ Segurança e Acesso**');
                const rowPrivacy = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('room_lock').setLabel('Trancar').setEmoji('🔒').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('room_unlock').setLabel('Destrancar').setEmoji('🔓').setStyle(ButtonStyle.Success)
                );

                const labelMod = new TextDisplayBuilder().setContent('**👥 Gestão de Membros**');
                const rowMod = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('room_allow').setLabel('Permitir User').setEmoji('✅').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('room_kick').setLabel('Desconectar').setEmoji('👢').setStyle(ButtonStyle.Danger)
                );

                const panelContainer = new ContainerBuilder()
                    .setAccentColor(0x2b2d31)
                    .addTextDisplayComponents(header)
                    .addTextDisplayComponents(subHeader)
                    .addSeparatorComponents(divider)
                    .addTextDisplayComponents(labelPersonal)
                    .addActionRowComponents(rowPersonal)
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(labelPrivacy)
                    .addActionRowComponents(rowPrivacy)
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(labelMod)
                    .addActionRowComponents(rowMod);

                await tempChannel.send({
                    flags: [MessageFlags.IsComponentsV2],
                    components: [panelContainer]
                });

            } catch (error) {
                console.error('❌ Erro crítico ao criar sala:', error);
                await newState.disconnect().catch(() => {});
            }
        }
    }
};