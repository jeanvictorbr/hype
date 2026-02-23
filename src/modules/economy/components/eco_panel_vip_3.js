const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_panel_vip_3',

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
                        { "type": 10, "content": `# 🥇 Dono do Baile (Página 1/2)\nBem-vindo à gestão máxima do servidor. Suas ferramentas Administrativas:` },
                        { "type": 14, "divider": true, "spacing": 2 },
                        
                        // 1. Cargo
                        {
                            "type": 9, "accessory": { "type": 2, "style": 1, "label": "Configurar", "emoji": { "name": "🎨" }, "custom_id": "eco_vip_action_custom_role" },
                            "components": [ { "type": 10, "content": "🎨 Seu Cargo Exclusivo" }, { "type": 10, "content": "Crie e edite um cargo com Nome, Emoji e Cor." } ]
                        },
                        
                        // 2. Membros
                        {
                            "type": 9, "accessory": { "type": 2, "style": 3, "label": "Gerenciar", "emoji": { "name": "👥" }, "custom_id": "eco_vip_action_manage_role" },
                            "components": [ { "type": 10, "content": "👥 Membros do seu Cargo" }, { "type": 10, "content": "Dê ou remova o seu cargo dos seus parceiros." } ]
                        },

                        // 3. Anúncio Global
                        {
                            "type": 9, "accessory": { "type": 2, "style": 3, "label": "Anunciar", "emoji": { "name": "📢" }, "custom_id": "eco_vip_action_announce" },
                            "components": [ 
                                { "type": 10, "content": "📢 Anúncio Global (@everyone)" }, 
                                { "type": 10, "content": "Envie uma mensagem com Imagem para o servidor.\n*⏳ Cooldown: 1 vez a cada 24 horas.*" } 
                            ]
                        },
                        
                        // 4. Call Privada
                        {
                            "type": 9, "accessory": { "type": 2, "style": 4, "label": "Gerar Call", "emoji": { "name": "🔊" }, "custom_id": "eco_vip_action_voice" },
                            "components": [ 
                                { "type": 10, "content": "🔊 Call Privada Temporária" }, 
                                { "type": 10, "content": "Crie uma call exclusiva e seja o dono (Tranque, Mute, Expulse).\n*⏳ Duração: Permanece até ficar vazia.*" } 
                            ]
                        },
                        
                        // 5. Tribunal VIP
                        {
                            "type": 9, "accessory": { "type": 2, "style": 4, "label": "Tribunal", "emoji": { "name": "⚖️" }, "custom_id": "eco_vip_action_banreq" },
                            "components": [ 
                                { "type": 10, "content": "⚖️ Tribunal VIP (Solicitar Ban)" }, 
                                { "type": 10, "content": "Exija o banimento de um membro enviando provas para a Staff.\n*⚖️ Limite: 2 exigências por semana.*" } 
                            ]
                        },
                        
                        { "type": 14, "divider": true, "spacing": 2 },
                        {
                            "type": 1, 
                            "components": [
                                { "type": 2, "style": 1, "label": "Ir para Página 2", "emoji": { "name": "➡️" }, "custom_id": "eco_panel_vip_3_p2" },
                                { "type": 2, "style": 2, "label": "Voltar à Vitrine", "emoji": { "name": "↩️" }, "custom_id": "eco_user_config" }
                            ]
                        }
                    ]
                }
            ];

            await interaction.editReply({ components: componentsArray, flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });

        } catch (error) {
            console.error('❌ Erro no painel VIP 3:', error);
            await interaction.followUp({ content: '❌ Erro interno ao carregar o painel máximo.', flags: [MessageFlags.Ephemeral] });
        }
    }
};