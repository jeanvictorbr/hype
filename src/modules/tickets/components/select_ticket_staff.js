const { 
    ContainerBuilder, TextDisplayBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, MessageFlags
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'select_ticket_staff',

    async execute(interaction, client) {
        const selectedRoleIds = interaction.values;
        const guildId = interaction.guild.id;

        try {
            await prisma.ticketConfig.upsert({
                where: { guildId: guildId },
                update: { staffRoles: selectedRoleIds },
                create: { guildId: guildId, staffRoles: selectedRoleIds }
            });

            const rolesFormatted = selectedRoleIds.map(id => `<@&${id}>`).join(', ');
            const successText = new TextDisplayBuilder()
                .setContent(`# ✅ Equipa Definida com Sucesso!\nOs seguintes cargos têm agora autorização para gerir os tickets:\n\n${rolesFormatted}`);
            
            const backButtonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('dashboard_select_module').setLabel('◀ Voltar ao Dashboard').setStyle(ButtonStyle.Secondary)
            );

            const successContainer = new ContainerBuilder()
                .setAccentColor(0x57F287)
                .addTextDisplayComponents(successText)
                .addActionRowComponents(backButtonRow);

            await interaction.update({ components: [successContainer], flags: [MessageFlags.IsComponentsV2] });

        } catch (error) {
            console.error('❌ Erro ao guardar Staff:', error);
            const errorText = new TextDisplayBuilder().setContent('# ❌ Falha na Base de Dados');
            const errorContainer = new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(errorText);
            await interaction.update({ components: [errorContainer], flags: [MessageFlags.IsComponentsV2] });
        }
    }
};