const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_vip_manage_role_submit',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: interaction.user.id } });
            if (!userProfile || !userProfile.customRoleId) return interaction.editReply({ content: '❌ Cargo não encontrado no sistema.' });

            const roleId = userProfile.customRoleId;
            const myRole = interaction.guild.roles.cache.get(roleId);
            if (!myRole) return interaction.editReply({ content: '❌ O seu cargo foi deletado do servidor. Crie um novo.' });

            const selectedUsersIds = interaction.values;
            let added = [];
            let removed = [];

            for (const targetId of selectedUsersIds) {
                const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);
                if (targetMember) {
                    if (targetMember.roles.cache.has(roleId)) {
                        await targetMember.roles.remove(roleId);
                        removed.push(`<@${targetId}>`);
                    } else {
                        await targetMember.roles.add(roleId);
                        added.push(`<@${targetId}>`);
                    }
                }
            }

            let msg = `### ✅ Gestão do Cargo concluída!\n`;
            if (added.length > 0) msg += `**Adicionado para:** ${added.join(', ')}\n`;
            if (removed.length > 0) msg += `**Removido de:** ${removed.join(', ')}\n`;

            // 👇 JSON NATIVO COM O BOTÃO DE VOLTAR INCLUÍDO 👇
            const successComponents = [
                {
                    "type": 17, 
                    "accent_color": 5763719,
                    "components": [
                        { "type": 10, "content": msg },
                        { "type": 14, "divider": true, "spacing": 2 },
                        {
                            "type": 1, 
                            "components": [
                                { "type": 2, "style": 2, "label": "Voltar à Vitrine VIP", "emoji": { "name": "↩️" }, "custom_id": "eco_user_config" }
                            ]
                        }
                    ]
                }
            ];

            await interaction.editReply({ components: successComponents, flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Ocorreu um erro ao aplicar os cargos.' });
        }
    }
};