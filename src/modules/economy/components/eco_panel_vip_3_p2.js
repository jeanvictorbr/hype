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
                        { "type": 10, "content": `# 👑 Dono do Baile (Pág 2/2)\nAcesso Exclusivo para: **VIP SUPREME**.` },
                        { "type": 14, "divider": true, "spacing": 2 },
                        
                        // Herdados do VIP 2
                        {
                            "type": 9, "accessory": { "type": 2, "style": 1, "label": "Forjar", "emoji": { "name": "💳" }, "custom_id": "btn_vip_cor", "disabled": !isVip3 },
                            "components": [ { "type": 10, "content": "💳 Forjar Cartão VIP (Herdado)" }, { "type": 10, "content": "Escolha cores exclusivas para o seu cartão." } ]
                        },

                        // Novos Poderes do VIP 3
                        {
                            "type": 9, "accessory": { "type": 2, "style": 4, "label": "Gerar Call", "emoji": { "name": "🔊" }, "custom_id": "eco_vip_action_voice", "disabled": !isVip3 },
                            "components": [ { "type": 10, "content": "🔊 Call Privada Temporária" }, { "type": 10, "content": "Crie uma call exclusiva e seja o dono absoluto." } ]
                        },
                        {
                            "type": 9, "accessory": { "type": 2, "style": 4, "label": "Tribunal", "emoji": { "name": "⚖️" }, "custom_id": "eco_vip_action_banreq", "disabled": !isVip3 },
                            "components": [ { "type": 10, "content": "⚖️ Tribunal VIP (Solicitar Ban)" }, { "type": 10, "content": "Exija o banimento de um membro à Staff." } ]
                        },
                        {
                            "type": 9, "accessory": { "type": 2, "style": 4, "label": "Desligar Som", "emoji": { "name": "🛑" }, "custom_id": "eco_vip_action_blackout", "disabled": !isVip3 },
                            "components": [ { "type": 10, "content": "🛑 Apagão VIP" }, { "type": 10, "content": "Tranque o chat atual para o servidor inteiro (60s)." } ]
                        },
                        {
                            "type": 9, "accessory": { "type": 2, "style": 3, "label": "Fazer Chover", "emoji": { "name": "🌧️" }, "custom_id": "eco_vip_action_rain", "disabled": !isVip3 },
                            "components": [ { "type": 10, "content": "🌧️ Chuva de Dinheiro" }, { "type": 10, "content": "Atire dinheiro do seu bolso para 5 membros." } ]
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
        }
    }
};