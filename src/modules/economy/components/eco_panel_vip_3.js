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
            
            const userLevel = userProfile ? userProfile.vipLevel : 0;
            const member = interaction.member;

            // 🛡️ TRAVA: Apenas SUPREME (5)
            const isVip3 = userLevel >= 5 || (config?.roleVip3 && member.roles.cache.has(config.roleVip3));

            const panelColor = isVip3 ? 16766720 : 15548997; // Dourado ou Vermelho

            const componentsArray = [
                {
                    "type": 17, 
                    "accent_color": panelColor,
                    "components": [
                        { "type": 10, "content": `# 👑 Dono do Baile (Pág 1/2)\nAcesso Exclusivo para: **VIP SUPREME**.` },
                        { "type": 14, "divider": true, "spacing": 2 },
                        
                        // Herdados Nível 1
                        {
                            "type": 9, "accessory": { "type": 2, "style": 1, "label": "Configurar", "emoji": { "name": "🎨" }, "custom_id": "eco_vip_action_custom_role", "disabled": !isVip3 },
                            "components": [ { "type": 10, "content": "🎨 Seu Cargo Exclusivo (Herdado)" }, { "type": 10, "content": "Crie um cargo com Nome, Emoji e Cor." } ]
                        },
                        {
                            "type": 9, "accessory": { "type": 2, "style": 3, "label": "Gerenciar", "emoji": { "name": "👥" }, "custom_id": "eco_vip_action_manage_role", "disabled": !isVip3 },
                            "components": [ { "type": 10, "content": "👥 Membros do seu Cargo (Herdado)" }, { "type": 10, "content": "Gerencie a quem você deu o cargo." } ]
                        },

                        // Herdados Nível 2
                        {
                            "type": 9, "accessory": { "type": 2, "style": 3, "label": "Anunciar", "emoji": { "name": "📢" }, "custom_id": "eco_vip_action_announce", "disabled": !isVip3 },
                            "components": [ { "type": 10, "content": "📢 Anúncio Global (Herdado)" }, { "type": 10, "content": "Envie uma mensagem para o servidor." } ]
                        },
                        {
                            "type": 9, "accessory": { "type": 2, "style": 4, "label": "Pedágio", "emoji": { "name": "💸" }, "custom_id": "eco_vip_action_agiota", "disabled": !isVip3 },
                            "components": [ { "type": 10, "content": "💸 Modo Agiota (Herdado)" }, { "type": 10, "content": "Roube 5% dos comandos /daily (15 min)." } ]
                        },
                        {
                            "type": 9, "accessory": { "type": 2, "style": 4, "label": "Silenciar", "emoji": { "name": "🤫" }, "custom_id": "eco_vip_action_timeout", "disabled": !isVip3 },
                            "components": [ { "type": 10, "content": "🤫 Mini-Ditador (Herdado)" }, { "type": 10, "content": "Mutar um membro comum no chat (60s)." } ]
                        },
                        
                        { "type": 14, "divider": true, "spacing": 2 },
                        {
                            "type": 1, 
                            "components": [
                                // Botão de avançar página NUNCA bloqueia para ele poder ver o resto do painel
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
        }
    }
};