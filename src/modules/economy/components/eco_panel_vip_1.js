const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_panel_vip_1',

    async execute(interaction, client) {
        await interaction.deferUpdate();

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            // Verificação Híbrida
            const [userProfile, config] = await Promise.all([
                prisma.hypeUser.findUnique({ where: { id: userId } }),
                prisma.vipConfig.findUnique({ where: { guildId } })
            ]);
            
            const userLevel = userProfile ? userProfile.vipLevel : 0;
            const member = interaction.member;

            const isVip1 = userLevel >= 1 || 
                           (config?.roleVip1 && member.roles.cache.has(config.roleVip1)) ||
                           (config?.roleVip2 && member.roles.cache.has(config.roleVip2)) ||
                           (config?.roleVip3 && member.roles.cache.has(config.roleVip3));

            const panelColor = isVip1 ? 13467442 : 15548997; // Bronze se tiver acesso, Vermelho se bloqueado

            const componentsArray = [
                {
                    "type": 17, 
                    "accent_color": panelColor,
                    "components": [
                        { "type": 10, "content": `# 🥉 Pista Premium\nBem-vindo à gestão do **Nível 1**.` },
                        { "type": 14, "divider": true, "spacing": 2 },
                        
                        // Função 1: Criar/Editar Cargo
                        {
                            "type": 9,
                            "accessory": { "type": 2, "style": 1, "label": "Configurar Cargo", "emoji": { "name": "🎨" }, "custom_id": "eco_vip_action_custom_role" },
                            "components": [
                                { "type": 10, "content": "🎨 Seu Cargo Exclusivo" },
                                { "type": 10, "content": "Crie um cargo com Nome, Emoji e Cor só seu." }
                            ]
                        },
                        { "type": 14, "divider": true, "spacing": 2 },

                        // Função 2: Gerenciar Amigos
                        {
                            "type": 9,
                            "accessory": { "type": 2, "style": 3, "label": "Gerenciar Membros", "emoji": { "name": "👥" }, "custom_id": "eco_vip_action_manage_role" },
                            "components": [
                                { "type": 10, "content": "👥 Membros do seu Cargo" },
                                { "type": 10, "content": "Dê ou remova o seu cargo exclusivo para os seus parceiros." }
                            ]
                        },
                        { "type": 14, "divider": true, "spacing": 2 },
                        
                        // Bónus Diário (Informativo)
                        {
                            "type": 9,
                            "accessory": { "type": 2, "style": 2, "label": "Automático", "disabled": true, "custom_id": "dummy_1" },
                            "components": [
                                { "type": 10, "content": "🎁 Bônus Diário VIP" },
                                { "type": 10, "content": "Você recebe automaticamente 250 HC sempre que usar o seu Daily." }
                            ]
                        },
                        { "type": 14, "divider": true, "spacing": 2 },
                        
                        // Botão de Voltar para a Vitrine
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