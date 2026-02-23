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
            
            const member = interaction.member;
            const isVip2 = (userProfile?.vipLevel >= 2) || 
                           (config?.roleVip2 && member.roles.cache.has(config.roleVip2)) ||
                           (config?.roleVip3 && member.roles.cache.has(config.roleVip3));

            const panelColor = isVip2 ? 12632256 : 15548997; // Prata ou Vermelho (bloqueado)

            const componentsArray = [
                {
                    "type": 17, 
                    "accent_color": panelColor,
                    "components": [
                        { "type": 10, "content": `# 🥈 Camarote (VIP 2)\nBem-vindo ao sub-painel Prata. Como Camarote, você tem poderes sobre o chat e privilégios estendidos.` },
                        { "type": 14, "divider": true, "spacing": 2 },
                        
                        // 1. Cargo Exclusivo
                        {
                            "type": 9, "accessory": { "type": 2, "style": 1, "label": "Configurar", "emoji": { "name": "🎨" }, "custom_id": "eco_vip_action_custom_role" },
                            "components": [
                                { "type": 10, "content": "🎨 Seu Cargo Exclusivo (Herdado)" },
                                { "type": 10, "content": "Crie e personalize um cargo próprio com Nome, Cor e Emoji." }
                            ]
                        },
                        
                        // 2. Membros do Cargo
                        {
                            "type": 9, "accessory": { "type": 2, "style": 3, "label": "Gerenciar", "emoji": { "name": "👥" }, "custom_id": "eco_vip_action_manage_role" },
                            "components": [
                                { "type": 10, "content": "👥 Membros do seu Cargo (Herdado)" },
                                { "type": 10, "content": "Dê ou remova o seu cargo exclusivo para os seus parceiros." }
                            ]
                        },

                        // 3. Anúncio Global
                        {
                            "type": 9, "accessory": { "type": 2, "style": 3, "label": "Anunciar", "emoji": { "name": "📢" }, "custom_id": "eco_vip_action_announce" },
                            "components": [
                                { "type": 10, "content": "📢 Anúncio Global (@everyone)" },
                                { "type": 10, "content": "Envie uma mensagem global com Imagem destacada.\n*⏳ Cooldown: 1 vez a cada 24 horas.*" }
                            ]
                        },
                        
                        // 4. O Agiota
                        {
                            "type": 9, "accessory": { "type": 2, "style": 4, "label": "Pedágio", "emoji": { "name": "💸" }, "custom_id": "eco_vip_action_agiota" },
                            "components": [
                                { "type": 10, "content": "💸 Modo Agiota (Pedágio)" },
                                { "type": 10, "content": "Roube 5% de todos os /daily de membros comuns no servidor.\n*⏳ Duração do Roubo: 15 Minutos diretos.*" }
                            ]
                        },
                        
                        // 5. Mini-Ditador
                        {
                            "type": 9, "accessory": { "type": 2, "style": 4, "label": "Silenciar", "emoji": { "name": "🤫" }, "custom_id": "eco_vip_action_timeout" },
                            "components": [
                                { "type": 10, "content": "🤫 Cala a Boca (Mini-Ditador)" },
                                { "type": 10, "content": "Mutar um membro comum no chat (60 segundos).\n*⏳ Cooldown: 1 vez a cada 12 horas.*" }
                            ]
                        },

                        // Bônus Diário
                        {
                            "type": 9, "accessory": { "type": 2, "style": 2, "label": "Ativo", "disabled": true, "custom_id": "dummy_2" },
                            "components": [
                                { "type": 10, "content": "🎁 Bônus Diário Camarote" },
                                { "type": 10, "content": "Resgate máximo automático de 500 HC no seu /daily." }
                            ]
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
            await interaction.followUp({ content: '❌ Erro ao carregar o painel Camarote.', flags: [MessageFlags.Ephemeral] });
        }
    }
};