const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_panel_vip_1',

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

            // 🛡️ TRAVA: BOOSTER (1) ou superior
            const isVip1 = userLevel >= 1 || 
                           (config?.roleVip1 && member.roles.cache.has(config.roleVip1)) ||
                           (config?.roleVip2 && member.roles.cache.has(config.roleVip2)) ||
                           (config?.roleVip3 && member.roles.cache.has(config.roleVip3));

            const panelColor = isVip1 ? 13467442 : 15548997; // Bronze ou Vermelho

            const componentsArray = [
                {
                    "type": 17, 
                    "accent_color": panelColor,
                    "components": [
                        { "type": 10, "content": `# 🥉 Pista Premium (Nível 1)\nAcesso Liberado para: **VIP BOOSTER** e **VIP PRIME**.` },
                        { "type": 14, "divider": true, "spacing": 2 },
                        
                        {
                            "type": 9,
                            "accessory": { "type": 2, "style": 1, "label": "Configurar Cargo", "emoji": { "name": "🎨" }, "custom_id": "eco_vip_action_custom_role", "disabled": !isVip1 },
                            "components": [
                                { "type": 10, "content": "🎨 Seu Cargo Exclusivo" },
                                { "type": 10, "content": "Crie um cargo com Nome, Emoji e Cor só seu." }
                            ]
                        },
                        {
                            "type": 9,
                            "accessory": { "type": 2, "style": 3, "label": "Gerenciar Membros", "emoji": { "name": "👥" }, "custom_id": "eco_vip_action_manage_role", "disabled": !isVip1 },
                            "components": [
                                { "type": 10, "content": "👥 Membros do seu Cargo" },
                                { "type": 10, "content": "Dê ou remova o seu cargo para os seus parceiros." }
                            ]
                        },
                        { "type": 14, "divider": true, "spacing": 2 },
                        {
                            "type": 9,
                            "accessory": { "type": 2, "style": 2, "label": "Automático", "disabled": true, "custom_id": "dummy_1" },
                            "components": [
                                { "type": 10, "content": "🎁 Bônus VIP" },
                                { "type": 10, "content": "Multiplique suas recompensas em 1x a cada nivel vip possuido." }
                            ]
                        },
                        { "type": 14, "divider": true, "spacing": 2 },
                        {
                            "type": 1, 
                            "components": [
                                { "type": 2, "style": 2, "label": "Voltar para Vitrine VIP", "emoji": { "name": "↩️" }, "custom_id": "eco_user_config" }
                            ]
                        }
                    ]
                }
            ];

            await interaction.editReply({ components: componentsArray, flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });
        } catch (error) {
            console.error('❌ Erro no painel VIP 1:', error);
        }
    }
};