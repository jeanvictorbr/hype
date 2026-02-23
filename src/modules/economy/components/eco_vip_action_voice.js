const { MessageFlags, ChannelType, PermissionFlagsBits } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_vip_action_voice',

    async execute(interaction, client) {
        // Interrompe e prepara para dar uma mensagem de loading ou erro se demorar
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const userId = interaction.user.id;
        const guild = interaction.guild;
        const member = interaction.member;

        try {
            // 1. BUSCA CONFIGURAÇÕES E PERFIL (CORREÇÃO: Verificação Integrada)
            const [userProfile, config] = await Promise.all([
                prisma.hypeUser.findUnique({ where: { id: userId } }),
                prisma.vipConfig.findUnique({ where: { guildId: guild.id } })
            ]);

            const userLevel = userProfile ? userProfile.vipLevel : 0;
            
            // O gajo é VIP 3 se tiver o nível no banco OU o cargo configurado no /devpanel
            const isVip3 = userLevel >= 3 || (config?.roleVip3 && member.roles.cache.has(config.roleVip3));

            if (!isVip3) {
                return interaction.editReply({ 
                    content: '❌ **Acesso Negado:** Este privilégio de elite é exclusivo para o cargo configurado como **Dono do Baile (Nível 3)**. Adquira na Lojinha!',
                });
            }

            // 2. VERIFICA SE ELE JÁ TEM UMA CALL ABERTA
            const existingChannel = guild.channels.cache.find(c => 
                c.type === ChannelType.GuildVoice && 
                c.name === `🔊 | Call de ${member.user.username}`
            );

            if (existingChannel) {
                return interaction.editReply({ 
                    content: `⚠️ Você já possui uma Call Privada ativa: <#${existingChannel.id}>. Apague a atual antes de criar uma nova.`
                });
            }

            // 3. PROCURA OU CRIA A CATEGORIA "👑 CALLS VIP"
            let category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === "👑 CALLS VIP");
            
            if (!category) {
                category = await guild.channels.create({
                    name: "👑 CALLS VIP",
                    type: ChannelType.GuildCategory,
                });
            }

            // 4. A CRIAÇÃO DO CANAL DE VOZ COM PERMISSÕES DE DONO
            const voiceChannel = await guild.channels.create({
                name: `🔊 | Call de ${member.user.username}`,
                type: ChannelType.GuildVoice,
                parent: category.id,
                permissionOverwrites: [
                    {
                        // @everyone não pode entrar (apenas ver a ostentação)
                        id: guild.id,
                        deny: [PermissionFlagsBits.Connect],
                        allow: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        // O bot tem controlo total
                        id: client.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.Connect]
                    },
                    {
                        // O Criador (VIP 3) ganha controlo total na sala dele
                        id: userId,
                        allow: [
                            PermissionFlagsBits.ViewChannel, 
                            PermissionFlagsBits.Connect, 
                            PermissionFlagsBits.Speak, 
                            PermissionFlagsBits.MuteMembers, 
                            PermissionFlagsBits.DeafenMembers,
                            PermissionFlagsBits.MoveMembers,
                            PermissionFlagsBits.ManageChannels
                        ]
                    }
                ]
            });

            // 5. INTERFACE V2 DE SUCESSO (Nativa)
            const componentsArray = [
                {
                    "type": 17, 
                    "accent_color": 16766720, // Dourado
                    "components": [
                        { "type": 10, "content": `# 🗝️ Chave da Sala Entregue!\nO seu espaço privado foi criado com sucesso no servidor.` },
                        { "type": 14, "divider": true, "spacing": 2 },
                        {
                            "type": 9,
                            "accessory": { "type": 2, "style": 5, "label": "Entrar na Call", "url": `https://discord.com/channels/${guild.id}/${voiceChannel.id}` },
                            "components": [
                                { "type": 10, "content": `🔊 <#${voiceChannel.id}>` },
                                { "type": 10, "content": "Você possui permissões de Moderador dentro deste canal. Gerencie seus convidados!" }
                            ]
                        },
                        { "type": 14, "divider": true, "spacing": 2 },
                        {
                            "type": 1, 
                            "components": [
                                { "type": 2, "style": 2, "label": "Voltar para o Painel VIP", "emoji": { "name": "↩️" }, "custom_id": "eco_panel_vip_3" }
                            ]
                        }
                    ]
                }
            ];

            await interaction.editReply({ components: componentsArray, flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });

        } catch (error) {
            console.error('❌ Erro ao criar a call privada:', error);
            await interaction.editReply({ content: '❌ Ocorreu um erro técnico ao tentar gerar a sua Call. Verifique se o bot tem a permissão de "Gerenciar Canais".' });
        }
    }
};