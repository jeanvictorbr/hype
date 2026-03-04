const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_user_config',

    async execute(interaction, client) {
        // 👇 A MÁGICA AQUI: Abre um pop-up novo (invisível) em vez de tentar editar/apagar o Cartão VIP
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        
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
                ? `✅ Seu acesso VIP está **Ativo**. Aproveite seus poderes!`
                : `⚠️ Você é um **Membro Comum**. As funções abaixo estão bloqueadas para uso.`;

            const componentsArray = [
                {
                    "type": 17,
                    "accent_color": statusColor,
                    "components": [
                        { "type": 10, "content": `# 👑 Central de poderes VIP\nGerencie suas vantagens exclusivas de forma integrada.` },
                        { "type": 14, "divider": true, "spacing": 2 },
                        {
                            "type": 9,
                            "accessory": { "type": 2, "style": 2, "label": "Abrir", "emoji": { "name": "🥉" }, "custom_id": "eco_panel_vip_1" },
                            "components": [
                                { "type": 10, "content": "🥉╺╸VIP 1: BOOSTER, PRIME" },
                                { "type": 10, "content": "Cores de Nick e multiplicadores básicos." }
                            ]
                        },
                        { "type": 14, "divider": true, "spacing": 2 },
                        {
                            "type": 9,
                            "accessory": { "type": 2, "style": 2, "label": "Abrir", "emoji": { "name": "🥈" }, "custom_id": "eco_panel_vip_2" },
                            "components": [
                                { "type": 10, "content": "🥈╺╸VIP 2: ELITE, EXCLUSIVE" },
                                { "type": 10, "content": "Anúncios Globais e bônus intermediário." }
                            ]
                        },
                        { "type": 14, "divider": true, "spacing": 2 },
                        {
                            "type": 9,
                            "accessory": { "type": 2, "style": 2, "label": "Abrir", "emoji": { "name": "🥇" }, "custom_id": "eco_panel_vip_3" },
                            "components": [
                                { "type": 10, "content": "🥇╺╸VIP 3: SUPREME" },
                                { "type": 10, "content": "Calls Privadas e poderes máximos." }
                            ]
                        },
                        { "type": 14, "divider": true, "spacing": 2 },
                        { "type": 10, "content": statusMsg }
                        // Botão de "Voltar para o Cartão" foi removido porque agora é um Pop-up!
                    ]
                }
            ];

            // Apenas envia a UI V2 limpa, sem conflitos com Embeds antigos!
            await interaction.editReply({ 
                components: componentsArray, 
                flags: [MessageFlags.IsComponentsV2] 
            });
        } catch (error) {
            console.error('Erro ao carregar painel VIP:', error);
            await interaction.editReply({ content: '❌ Erro ao carregar o painel de poderes VIP.', flags: [] });
        }
    }
};