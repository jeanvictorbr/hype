const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_vip_edit_name_submit',
    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        const newName = interaction.fields.getTextInputValue('new_name').trim();

        try {
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: interaction.user.id } });
            const myRole = interaction.guild.roles.cache.get(userProfile?.customRoleId);

            if (!myRole) return interaction.editReply({ content: '❌ Cargo não encontrado.' });

            await myRole.edit({ name: newName });

            // A âncora imbatível sempre presente!
            const anchorRole = interaction.guild.roles.cache.find(r => r.name === '==== CORES VIP ====');
            let targetPos = anchorRole ? anchorRole.position - 1 : interaction.guild.members.me.roles.highest.position - 1;
            if (targetPos < 1) targetPos = 1;
            if (myRole.position !== targetPos) await myRole.setPosition(targetPos).catch(() => {});

            const successComponents = [
                {
                    "type": 17, "accent_color": myRole.color,
                    "components": [
                        { "type": 10, "content": `## ✅ Nome Atualizado!\nO seu cargo agora chama-se **${newName}**.` },
                        { "type": 14, "divider": true, "spacing": 2 },
                        { "type": 1, "components": [{ "type": 2, "style": 2, "label": "Voltar", "emoji": { "name": "↩️" }, "custom_id": "eco_vip_action_custom_role" }] }
                    ]
                }
            ];
            await interaction.editReply({ components: successComponents });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Erro ao atualizar o nome.' });
        }
    }
};