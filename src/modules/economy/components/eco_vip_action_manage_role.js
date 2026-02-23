const { ActionRowBuilder, UserSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ContainerBuilder, TextDisplayBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_vip_action_manage_role',

    async execute(interaction, client) {
        await interaction.deferUpdate();

        try {
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: interaction.user.id } });

            // Botão de Voltar padrão
            const rowBack = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('eco_user_config').setLabel('Voltar à Vitrine VIP').setStyle(ButtonStyle.Secondary).setEmoji('↩️')
            );

            if (!userProfile || !userProfile.customRoleId || !interaction.guild.roles.cache.has(userProfile.customRoleId)) {
                return interaction.followUp({ content: '❌ Você ainda não criou o seu cargo! Use a opção "Configurar Cargo" primeiro.', flags: [MessageFlags.Ephemeral] });
            }

            const myRole = interaction.guild.roles.cache.get(userProfile.customRoleId);

            const container = new ContainerBuilder()
                .setAccentColor(myRole.color || 0x5865F2)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 👥 Gerenciamento: ${myRole.name}\n\nSelecione um ou mais amigos no menu abaixo. O bot irá **adicionar** o cargo a quem não tiver, e **remover** de quem já tiver (Efeito Toggle).`));

            const userMenu = new ActionRowBuilder().addComponents(
                new UserSelectMenuBuilder()
                    .setCustomId('eco_vip_manage_role_submit')
                    .setPlaceholder('Selecione seus parceiros...')
                    .setMinValues(1)
                    .setMaxValues(10)
            );

            // Interface atualizada com o botão de voltar
            await interaction.editReply({ 
                components: [container, userMenu, rowBack], 
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] 
            });

        } catch (error) {
            console.error(error);
        }
    }
};