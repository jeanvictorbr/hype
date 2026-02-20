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

// 🛡️ SISTEMAS DE PROTEÇÃO (MEMÓRIA RAM)
const cooldownCache = new Map();
const activeCreators = new Set(); // Trava de concorrência (Mutex)
const COOLDOWN_TIME_MS = 5000; // 5 Segundos de proteção da API

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState, client) {
        const member = newState.member;
        if (!member || member.user.bot) return;

        const guildId = newState.guild.id;

        // ==========================================
        // 🗑️ AÇÃO: LIMPEZA DE SALAS (Totalmente Assíncrona)
        // ==========================================
        if (oldState.channelId && oldState.channelId !== newState.channelId) {
            // Usamos .then() para a limpeza rodar em background e não travar outros usuários
            prisma.autoVoiceRoom.findUnique({
                where: { channelId: oldState.channelId }
            }).then(async (room) => {
                if (room) {
                    const channel = await oldState.guild.channels.fetch(oldState.channelId).catch(() => null);
                    if (channel) {
                        if (channel.members.size === 0) {
                            await channel.delete('Auto-Voice: Sala Vazia.').catch(() => {});
                            await prisma.autoVoiceRoom.delete({ where: { channelId: room.channelId } }).catch(() => {});
                        }
                    } else {
                        // Limpa o fantasma se o canal foi apagado à mão
                        await prisma.autoVoiceRoom.delete({ where: { channelId: room.channelId } }).catch(() => {});
                    }
                }
            }).catch(err => console.error('Erro na limpeza:', err));
        }

        // ==========================================
        // 🚀 AÇÃO: CRIAÇÃO DE SALA DINÂMICA
        // ==========================================
        if (!newState.channelId) return;

        const config = await prisma.autoVoiceConfig.findUnique({
            where: { guildId: guildId }
        });

        if (!config || !config.triggerChannel) return;

        if (newState.channelId === config.triggerChannel) {
            
            // 🔒 TRAVA 1: Impede clonagem de processos simultâneos
            if (activeCreators.has(member.id)) return;
            
            // 🔒 TRAVA 2: Cooldown da API
            const userCooldown = cooldownCache.get(member.id);
            if (userCooldown && Date.now() < userCooldown) {
                await newState.disconnect('Proteção Anti-Spam').catch(() => {});
                // Feedback visual para não parecer bug!
                await member.send(`⏳ **Proteção Ativada:** Estás a criar salas muito rápido. Para evitar travamentos, aguarda 5 segundos antes de tentar criar outra.`).catch(() => {});
                return;
            }

            // Aplica as travas
            activeCreators.add(member.id);
            cooldownCache.set(member.id, Date.now() + COOLDOWN_TIME_MS);

            try {
                const permissionOverwrites = [
                    { id: newState.guild.roles.everyone.id, allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel] },
                    { id: member.id, allow: [
                            PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles,
                            PermissionFlagsBits.MuteMembers, PermissionFlagsBits.DeafenMembers, 
                            PermissionFlagsBits.MoveMembers
                    ]}
                ];

                if (config.bypassRoles && config.bypassRoles.length > 0) {
                    for (const roleId of config.bypassRoles) {
                        permissionOverwrites.push({ id: roleId, allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel] });
                    }
                }

                // Cria o Canal na API (Ponto de maior lentidão do Discord)
                const tempChannel = await newState.guild.channels.create({
                    name: `🔊・Sala de ${member.displayName}`,
                    type: ChannelType.GuildVoice,
                    parent: config.tempCategory || null,
                    permissionOverwrites: permissionOverwrites,
                });

                // 🔥 A MÁGICA AQUI: Verifica se o troll fugiu ANTES de salvar no BD
                const currentMemberState = await newState.guild.members.fetch(member.id).catch(() => null);
                if (!currentMemberState || !currentMemberState.voice || currentMemberState.voice.channelId !== config.triggerChannel) {
                    // Destrói o canal recém nascido e aborta operação sem gravar no banco
                    await tempChannel.delete('Auto-Voice: Usuário saiu durante a criação.').catch(() => {});
                    activeCreators.delete(member.id); 
                    return; 
                }

                // Move o membro
                await currentMemberState.voice.setChannel(tempChannel).catch(() => {});

                // Salva no Banco de Dados com Segurança Máxima
                await prisma.autoVoiceRoom.create({
                    data: { channelId: tempChannel.id, ownerId: member.id, guildId: guildId }
                });

                // ==========================================
                // 🎛️ PAINEL V2 - ESTILO LISTA
                // ==========================================
                const header = new TextDisplayBuilder().setContent('# 🎧 Controle de Voz');
                const subHeader = new TextDisplayBuilder().setContent(`Gerencie a sala de <@${member.id}>\n*Use os botões abaixo para configurar.*`);
                
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
                    .addTextDisplayComponents(header).addTextDisplayComponents(subHeader).addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(labelPersonal).addActionRowComponents(rowPersonal).addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(labelPrivacy).addActionRowComponents(rowPrivacy).addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(labelMod).addActionRowComponents(rowMod);

                await tempChannel.send({ flags: [MessageFlags.IsComponentsV2], components: [panelContainer] }).catch(()=>{});

            } catch (error) {
                console.error('❌ Erro crítico ao criar sala:', error);
                await newState.disconnect().catch(() => {});
            } finally {
                // Libera a trava de concorrência, independente de sucesso ou falha total
                activeCreators.delete(member.id);
            }
        }
    }
};