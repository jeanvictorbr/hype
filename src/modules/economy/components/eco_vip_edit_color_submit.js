const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_vip_edit_color_submit',
    async execute(interaction, client) {
        await interaction.deferUpdate();
        const newColor = interaction.values[0];

        try {
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: interaction.user.id } });
            const myRole = interaction.guild.roles.cache.get(userProfile?.customRoleId);

            if (!myRole) return interaction.followUp({ content: '❌ Cargo não encontrado.', flags: [MessageFlags.Ephemeral] });

            await myRole.edit({ color: newColor });

            // A âncora imbatível
            const anchorRole = interaction.guild.roles.cache.find(r => r.name === '==== CORES VIP ====');
            let targetPos = anchorRole ? anchorRole.position - 1 : interaction.guild.members.me.roles.highest.position - 1;
            if (targetPos < 1) targetPos = 1;
            if (myRole.position !== targetPos) await myRole.setPosition(targetPos).catch(() => {});

            const corInteira = parseInt(newColor.replace('#', ''), 16);
            const successComponents = [
                {
                    "type": 17, "accent_color": corInteira,
                    "components": [
                        { "type": 10, "content": `## ✅ Cor Atualizada!\nA cor do seu cargo mudou com sucesso para a hierarquia.` },
                        { "type": 14, "divider": true, "spacing": 2 },
                        { "type": 1, "components": [{ "type": 2, "style": 2, "label": "Voltar", "emoji": { "name": "↩️" }, "custom_id": "eco_vip_action_custom_role" }] }
                    ]
                }
            ];
            await interaction.editReply({ components: successComponents });

        } catch (error) {
            console.error(error);
        }
    }
};