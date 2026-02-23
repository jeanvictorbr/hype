const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_user_config',

    async execute(interaction, client) {
        await interaction.deferUpdate();
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            // Busca perfil do usuário e configurações de cargo da guilda
            const [userProfile, config] = await Promise.all([
                prisma.hypeUser.findUnique({ where: { id: userId } }),
                prisma.vipConfig.findUnique({ where: { guildId } })
            ]);

            const userLevel = userProfile ? userProfile.vipLevel : 0;
            const member = interaction.member;

            // Lógica de verificação dupla (Banco OU Cargo)
            const isVip1 = userLevel >= 1 || (config?.roleVip1 && member.roles.cache.has(config.roleVip1));
            const isVip2 = userLevel >= 2 || (config?.roleVip2 && member.roles.cache.has(config.roleVip2));
            const isVip3 = userLevel >= 3 || (config?.roleVip3 && member.roles.cache.has(config.roleVip3));

            const hasAnyVip = isVip1 || isVip2 || isVip3;
            const statusColor = hasAnyVip ? 42751 : 2829617; // Dourado/Azul ou Cinza

            const statusMsg = hasAnyVip 
                ? `✅ Seu acesso VIP está **Ativo**. Aproveite seus benefícios!`
                : `⚠️ Você é um **Membro Comum**. As funções abaixo estão bloqueadas para uso.`;

            const componentsArray = [
                {
                    "type": 17,
                    "accent_color": statusColor,
                    "components": [
                        { "type": 10, "content": `# 👑 Central de Benefícios VIP\nGerencie suas vantagens exclusivas de forma integrada.` },
                        { "type": 14, "divider": true, "spacing": 2 },
                        {
                            "type": 9,
                            "accessory": { "type": 2, "style": 2, "label": "Abrir", "emoji": { "name": "🥉" }, "custom_id": "eco_panel_vip_1" },
                            "components": [
                                { "type": 10, "content": "🥉 VIP Nível 1: Pista Premium" },
                                { "type": 10, "content": "Cores de Nick e multiplicadores básicos." }
                            ]
                        },
                        { "type": 14, "divider": true, "spacing": 2 },
                        {
                            "type": 9,
                            "accessory": { "type": 2, "style": 2, "label": "Abrir", "emoji": { "name": "🥈" }, "custom_id": "eco_panel_vip_2" },
                            "components": [
                                { "type": 10, "content": "🥈 VIP Nível 2: Camarote" },
                                { "type": 10, "content": "Anúncios Globais e bônus intermediário." }
                            ]
                        },
                        { "type": 14, "divider": true, "spacing": 2 },
                        {
                            "type": 9,
                            "accessory": { "type": 2, "style": 2, "label": "Abrir", "emoji": { "name": "🥇" }, "custom_id": "eco_panel_vip_3" },
                            "components": [
                                { "type": 10, "content": "🥇 VIP Nível 3: Dono do Baile" },
                                { "type": 10, "content": "Calls Privadas e benefícios máximos." }
                            ]
                        },
                        { "type": 14, "divider": true, "spacing": 2 },
                        { "type": 10, "content": statusMsg },
                        { "type": 14, "divider": true, "spacing": 2 },
                        {
                            "type": 1, 
                            "components": [
                                { "type": 2, "style": 2, "label": "Voltar para o Cartão", "emoji": { "name": "↩️" }, "custom_id": "eco_return_main" }
                            ]
                        }
                    ]
                }
            ];

            await interaction.editReply({ components: componentsArray, flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });
        } catch (error) {
            console.error('Erro ao carregar painel VIP:', error);
        }
    }
};