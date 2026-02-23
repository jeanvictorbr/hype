const { ActionRowBuilder, RoleSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'eco_manage_vip_roles_',

    async execute(interaction, client) {
        // ✅ CORREÇÃO: Só dá defer se ainda não foi respondido/deferido
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferUpdate();
        }

        const customId = interaction.customId;
        const guildId = customId.split('_').pop();

        try {
            let config = await prisma.vipConfig.findUnique({ where: { guildId } });
            if (!config) {
                config = await prisma.vipConfig.create({ data: { guildId } });
            }

            const txtVip1 = config.roleVip1 ? `<@&${config.roleVip1}>` : '`Não configurado`';
            const txtVip2 = config.roleVip2 ? `<@&${config.roleVip2}>` : '`Não configurado`';
            const txtVip3 = config.roleVip3 ? `<@&${config.roleVip3}>` : '`Não configurado`';

            const componentsArray = [
                {
                    "type": 17,
                    "accent_color": 16766720,
                    "components": [
                        { "type": 10, "content": `# 👑 Mapeamento de Cargos VIP\nDefina abaixo os cargos para cada nível.\n\n**Status Atual:**\n> 🥉 **Nível 1:** ${txtVip1}\n> 🥈 **Nível 2:** ${txtVip2}\n> 🥇 **Nível 3:** ${txtVip3}` },
                        { "type": 14, "divider": true, "spacing": 2 }
                    ]
                }
            ];

            const row1 = new ActionRowBuilder().addComponents(
                new RoleSelectMenuBuilder()
                    .setCustomId(`eco_set_vip_role_1_${guildId}`)
                    .setPlaceholder('Nível 1 (Pista Premium)')
                    .setMinValues(0).setMaxValues(1)
            );

            const row2 = new ActionRowBuilder().addComponents(
                new RoleSelectMenuBuilder()
                    .setCustomId(`eco_set_vip_role_2_${guildId}`)
                    .setPlaceholder('Nível 2 (Camarote)')
                    .setMinValues(0).setMaxValues(1)
            );

            const row3 = new ActionRowBuilder().addComponents(
                new RoleSelectMenuBuilder()
                    .setCustomId(`eco_set_vip_role_3_${guildId}`)
                    .setPlaceholder('Nível 3 (Dono do Baile)')
                    .setMinValues(0).setMaxValues(1)
            );

            // 👇 A MÁGICA ESTÁ AQUI
            // Nós mandamos uma ação "dummy" (falsa) para o action handler.
            // Ele vai ignorar a ação porque 'dummy' não existe, mas no final
            // ele recarrega o painel completo da guilda!
            const rowBack = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`dev_vip_dummy_reload_${guildId}`) 
                    .setLabel('Voltar')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('↩️')
            );

            await interaction.editReply({ 
                components: [...componentsArray, row1, row2, row3, rowBack], 
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] 
            });

        } catch (error) {
            console.error('❌ Erro ao abrir config de cargos VIP:', error);
        }
    }
};