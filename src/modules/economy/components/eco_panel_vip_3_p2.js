const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_panel_vip_3_p2',

    async execute(interaction, client) {
        await interaction.deferUpdate();
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            const [userProfile, config] = await Promise.all([
                prisma.hypeUser.findUnique({ where: { id: userId } }),
                prisma.vipConfig.findUnique({ where: { guildId } })
            ]);
            
            const member = interaction.member;
            const isVip3 = (userProfile?.vipLevel >= 3) || (config?.roleVip3 && member.roles.cache.has(config.roleVip3));

            const panelColor = isVip3 ? 16766720 : 15548997; // Dourado ou Vermelho (bloqueado)

            const componentsArray = [
                {
                    "type": 17, 
                    "accent_color": panelColor,
                    "components": [
                        { "type": 10, "content": `# 🥇 Dono do Baile (Página 2/2)\nAs habilidades de controle de massas e punições:` },
                        { "type": 14, "divider": true, "spacing": 2 },
                        
                        // 6. Agiota (Herdado do VIP 2)
                        {
                            "type": 9, "accessory": { "type": 2, "style": 4, "label": "Pedágio", "emoji": { "name": "💸" }, "custom_id": "eco_vip_action_agiota" },
                            "components": [ 
                                { "type": 10, "content": "💸 Modo Agiota (Herdado)" }, 
                                { "type": 10, "content": "Roube 5% dos /daily de membros comuns.\n*⏳ Duração do Roubo: 15 Minutos diretos.*" } 
                            ]
                        },
                        
                        // 7. Ditador (Herdado do VIP 2)
                        {
                            "type": 9, "accessory": { "type": 2, "style": 4, "label": "Silenciar", "emoji": { "name": "🤫" }, "custom_id": "eco_vip_action_timeout" },
                            "components": [ 
                                { "type": 10, "content": "🤫 Mini-Ditador (Herdado)" }, 
                                { "type": 10, "content": "Mutar um membro comum no chat (60 segundos).\n*⏳ Cooldown: 1 vez a cada 12 horas.*" } 
                            ]
                        },

                        // 8. Apagão VIP (Exclusivo Nível 3)
                        {
                            "type": 9, "accessory": { "type": 2, "style": 4, "label": "Desligar Som", "emoji": { "name": "🛑" }, "custom_id": "eco_vip_action_blackout" },
                            "components": [ 
                                { "type": 10, "content": "🛑 Apagão VIP" }, 
                                { "type": 10, "content": "Tranque o chat atual para o servidor inteiro (Duração: 60s).\n*⏳ Cooldown: 1 vez a cada 12 horas.*" } 
                            ]
                        },

                        // 9. Chuva de Prata (Exclusivo Nível 3)
                        {
                            "type": 9, "accessory": { "type": 2, "style": 3, "label": "Fazer Chover", "emoji": { "name": "🌧️" }, "custom_id": "eco_vip_action_rain" },
                            "components": [ 
                                { "type": 10, "content": "🌧️ Chuva de Dinheiro" }, 
                                { "type": 10, "content": "Atire dinheiro do seu bolso para 5 membros apanharem.\n*⏳ Cooldown: 1 vez a cada 12 horas.*" } 
                            ]
                        },

                        // 10. Bônus Diário
                        {
                            "type": 9, "accessory": { "type": 2, "style": 2, "label": "Ativo", "disabled": true, "custom_id": "dummy_3" },
                            "components": [ 
                                { "type": 10, "content": "🎁 Bônus Diário Lendário" }, 
                                { "type": 10, "content": "Resgate máximo automático de 1000 HC no seu /daily." } 
                            ]
                        },

                        { "type": 14, "divider": true, "spacing": 2 },
                        {
                            "type": 1, 
                            "components": [
                                { "type": 2, "style": 1, "label": "Voltar à Página 1", "emoji": { "name": "⬅️" }, "custom_id": "eco_panel_vip_3" },
                                { "type": 2, "style": 2, "label": "Sair para Vitrine", "emoji": { "name": "↩️" }, "custom_id": "eco_user_config" }
                            ]
                        }
                    ]
                }
            ];

            await interaction.editReply({ components: componentsArray, flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });

        } catch (error) {
            console.error('❌ Erro no painel VIP 3 P2:', error);
            await interaction.followUp({ content: '❌ Erro interno ao carregar a página 2 do painel.', flags: [MessageFlags.Ephemeral] });
        }
    }
};