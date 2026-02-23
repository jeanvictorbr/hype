const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'eco_vip_role_submit_',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const roleName = interaction.fields.getTextInputValue('role_name').trim();
        const hexColor = `#${interaction.customId.replace('eco_vip_role_submit_', '')}`;

        const member = interaction.member;
        const guild = interaction.guild;

        try {
            let userProfile = await prisma.hypeUser.findUnique({ where: { id: member.id } });

            const anchorRole = guild.roles.cache.find(r => r.name === '==== CORES VIP ====');
            let targetPosition = anchorRole ? anchorRole.position - 1 : guild.members.me.roles.highest.position - 1;
            if (targetPosition < 1) targetPosition = 1;

            let myRole = userProfile?.customRoleId ? guild.roles.cache.get(userProfile.customRoleId) : null;

            if (myRole) {
                await myRole.edit({ name: roleName, color: hexColor });
                if (myRole.position !== targetPosition) await myRole.setPosition(targetPosition).catch(() => {});
            } else {
                myRole = await guild.roles.create({
                    name: roleName,
                    color: hexColor,
                    position: targetPosition,
                    permissions: [], 
                    reason: `Cargo VIP Personalizado de ${member.user.tag}`
                });

                await prisma.hypeUser.update({
                    where: { id: member.id },
                    data: { customRoleId: myRole.id }
                });
            }

            if (!member.roles.cache.has(myRole.id)) await member.roles.add(myRole);

            const corInteira = parseInt(hexColor.replace('#', ''), 16);
            
            // 👇 JSON NATIVO COM O BOTÃO DE VOLTAR INCLUÍDO 👇
            const successComponents = [
                {
                    "type": 17, 
                    "accent_color": corInteira,
                    "components": [
                        { "type": 10, "content": `## 🎨 Cargo Configurado!\nO cargo <@&${myRole.id}> foi criado/atualizado com sucesso.\n\nAgora você pode ir na vitrine principal e clicar em **Gerenciar Membros** para dar a tag aos seus aliados no servidor.` },
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
            console.error('Erro ao gerir cargo:', error);
            await interaction.editReply({ content: '❌ Ocorreu um erro. Verifique se o Bot tem permissão e se o cargo do Bot está no topo da lista.' });
        }
    }
};