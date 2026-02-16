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

// 🛡️ SISTEMA DE COOLDOWN EM MEMÓRIA (Anti-Spam)
const cooldownCache = new Map();
const COOLDOWN_TIME_MS = 15000; // 15 segundos de espera entre criações de sala

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState, client) {
        const member = newState.member;
        if (member.user.bot) return; // Ignora bots para não dar loop

        const guildId = newState.guild.id;

        // ==========================================
        // 🗑️ AÇÃO: USUÁRIO SAIU DE UM CANAL
        // ==========================================
        // Fazemos a verificação de saída PRIMEIRO para limpar a sujeira antes de criar algo novo
        if (oldState.channelId && oldState.channelId !== newState.channelId) {
            
            // Verifica se o canal que ele saiu está registrado no nosso banco como temporário
            const isTempRoom = await prisma.autoVoiceRoom.findUnique({
                where: { channelId: oldState.channelId }
            });

            if (isTempRoom) {
                const channel = oldState.channel;
                
                // Se o canal ainda existir e estiver vazio
                if (channel && channel.members.size === 0) {
                    try {
                        // 1. Apaga do banco de dados primeiro
                        await prisma.autoVoiceRoom.delete({
                            where: { channelId: channel.id }
                        });
                        
                        // 2. Apaga do Discord
                        await channel.delete();
                    } catch (error) {
                        console.error('❌ Erro ao deletar sala vazia:', error);
                    }
                }
            }
        }

        // ==========================================
        // 🚀 AÇÃO: USUÁRIO ENTROU NO CANAL GATILHO
        // ==========================================
        
        // Busca a configuração da guilda no PostgreSQL
        const config = await prisma.autoVoiceConfig.findUnique({
            where: { guildId: guildId }
        });

        // Se não tiver config ou canal gatilho definido, não faz nada
        if (!config || !config.triggerChannel) return;

        if (newState.channelId === config.triggerChannel) {
            
            // 🛡️ VALIDAÇÃO DO COOLDOWN ANTI-SPAM
            const userCooldown = cooldownCache.get(member.id);
            if (userCooldown && Date.now() < userCooldown) {
                // Desconecta o usuário imediatamente para evitar o spam
                await newState.disconnect('Proteção Anti-Spam (Rate Limit)');
                
                const timeLeft = Math.ceil((userCooldown - Date.now()) / 1000);
                
                // Tenta avisar na DM de forma silenciosa
                try {
                    await member.send(`⏳ **Aguarde!** Espere mais ${timeLeft} segundos para criar uma nova sala no servidor **${newState.guild.name}**.`);
                } catch (e) {
                    // Ignora se a DM do cara for fechada
                }
                return; // Para a execução do código aqui
            }

            try {
                // Aplica o cooldown no usuário (bloqueia pelos próximos 15 segundos)
                cooldownCache.set(member.id, Date.now() + COOLDOWN_TIME_MS);

                // Prepara as permissões base (O Dono manda na sala)
                const permissionOverwrites = [
                    {
                        id: newState.guild.roles.everyone.id,
                        allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: member.id, // O Dono da sala
                        allow: [
                            PermissionFlagsBits.Connect, 
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.ManageChannels, // Pode renomear
                            PermissionFlagsBits.ManageRoles,    // Pode trancar a call
                            PermissionFlagsBits.MuteMembers,
                            PermissionFlagsBits.DeafenMembers,
                            PermissionFlagsBits.MoveMembers
                        ],
                    }
                ];

                // 🎟️ INJETANDO O PASSE LIVRE (Staff)
                if (config.bypassRoles && config.bypassRoles.length > 0) {
                    for (const roleId of config.bypassRoles) {
                        permissionOverwrites.push({
                            id: roleId,
                            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel],
                        });
                    }
                }

                // Cria o canal temporário no Discord
                const tempChannel = await newState.guild.channels.create({
                    name: `🔊 Sala de ${member.displayName}`,
                    type: ChannelType.GuildVoice,
                    parent: config.tempCategory || null, // Coloca na categoria certa
                    permissionOverwrites: permissionOverwrites,
                });

                // Move o jogador do canal gatilho para a nova sala
                await newState.setChannel(tempChannel);

                // Salva a sala no PostgreSQL
                await prisma.autoVoiceRoom.create({
                    data: {
                        channelId: tempChannel.id,
                        ownerId: member.id,
                        guildId: guildId
                    }
                });

                // ==========================================
                // 🎛️ ENVIANDO O PAINEL V2 NO CHAT DA SALA
                // ==========================================
                const header = new TextDisplayBuilder()
                    .setContent(`# 🎛️ Central da Sala\nBem-vindo à sua sala temporária, <@${member.id}>. Use os controles abaixo para gerenciar o acesso.`);

                const controlsRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('room_lock')
                        .setLabel('Trancar')
                        .setEmoji('🔒')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('room_unlock')
                        .setLabel('Destrancar')
                        .setEmoji('🔓')
                        .setStyle(ButtonStyle.Secondary),
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
                    .setAccentColor(0x2b2d31)
                    .addComponents(header, controlsRow);

                // Envia no chat de texto atrelado ao canal de voz
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