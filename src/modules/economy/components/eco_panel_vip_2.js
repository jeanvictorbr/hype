const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_panel_vip_2',

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

            // 🛡️ TRAVA: EXCLUSIVE (3) ou superior
            const isVip2 = userLevel >= 3 || 
                           (config?.roleVip2 && member.roles.cache.has(config.roleVip2)) ||
                           (config?.roleVip3 && member.roles.cache.has(config.roleVip3));

            const panelColor = isVip2 ? 12632256 : 15548997; // Prata ou Vermelho

            const componentsArray = [
                {
                    "type": 17, 
                    "accent_color": panelColor,
                    "components": [
                        { "type": 10, "content": `# 🥈 Camarote (Nível 2)\nAcesso Liberado para: **VIP EXCLUSIVE** e **VIP ELITE**.` },
                        { "type": 14, "divider": true, "spacing": 2 },
                        
                        // Herdados do VIP 1
                        {
                            "type": 9, "accessory": { "type": 2, "style": 1, "label": "Configurar", "emoji": { "name": "🎨" }, "custom_id": "eco_vip_action_custom_role", "disabled": !isVip2 },
                            "components": [ { "type": 10, "content": "🎨 Seu Cargo Exclusivo (Herdado)" }, { "type": 10, "content": "Crie um cargo com Nome, Emoji e Cor." } ]
                        },
                        {
                            "type": 9, "accessory": { "type": 2, "style": 3, "label": "Gerenciar", "emoji": { "name": "👥" }, "custom_id": "eco_vip_action_manage_role", "disabled": !isVip2 },
                            "components": [ { "type": 10, "content": "👥 Membros do seu Cargo (Herdado)" }, { "type": 10, "content": "Dê ou remova o seu cargo para os seus amigos." } ]
                        },
                        
                        // Novos do VIP 2
                        {
                            "type": 9, "accessory": { "type": 2, "style": 3, "label": "Anunciar", "emoji": { "name": "📢" }, "custom_id": "eco_vip_action_announce", "disabled": !isVip2 },
                            "components": [ { "type": 10, "content": "📢 Anúncio Global (@everyone)" }, { "type": 10, "content": "Envie uma mensagem global com Imagem." } ]
                        },
                        {
                            "type": 9, "accessory": { "type": 2, "style": 4, "label": "Pedágio", "emoji": { "name": "💸" }, "custom_id": "eco_vip_action_agiota", "disabled": !isVip2 },
                            "components": [ { "type": 10, "content": "💸 Modo Agiota (Pedágio)" }, { "type": 10, "content": "Roube 5% dos /daily no servidor (Dura 15 min)." } ]
                        },
                        {
                            "type": 9, "accessory": { "type": 2, "style": 4, "label": "Silenciar", "emoji": { "name": "🤫" }, "custom_id": "eco_vip_action_timeout", "disabled": !isVip2 },
                            "components": [ { "type": 10, "content": "🤫 Cala a Boca (Mini-Ditador)" }, { "type": 10, "content": "Mutar um membro comum no chat (60s)." } ]
                        },
                        {
                            "type": 9, "accessory": { "type": 2, "style": 1, "label": "Forjar", "emoji": { "name": "💳" }, "custom_id": "btn_vip_cor", "disabled": !isVip2 },
                            "components": [ { "type": 10, "content": "💳 Forjar Cartão VIP" }, { "type": 10, "content": "Escolha cores exclusivas para o seu cartão Hype." } ]
                        },

                        { "type": 14, "divider": true, "spacing": 2 },
                        {
                            "type": 1, 
                            "components": [{ "type": 2, "style": 2, "label": "Voltar à Vitrine VIP", "emoji": { "name": "↩️" }, "custom_id": "eco_user_config" }]
                        }
                    ]
                }
            ];

            await interaction.editReply({ components: componentsArray, flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });
        } catch (error) {
            console.error('❌ Erro no painel VIP 2:', error);
        }
    }
};