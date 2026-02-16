const { 
    ContainerBuilder, TextDisplayBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'select_bypass_role',

    async execute(interaction, client) {
        const selectedRoleIds = interaction.values;
        const guildId = interaction.guild.id;

        try {
            // Lógica de Banco de Dados
            const currentConfig = await prisma.autoVoiceConfig.findUnique({ where: { guildId: guildId } });
            const existingRoles = currentConfig?.bypassRoles || [];
            const mergedRoles = [...new Set([...existingRoles, ...selectedRoleIds])];

            await prisma.autoVoiceConfig.upsert({
                where: { guildId: guildId },
                update: { bypassRoles: mergedRoles },
                create: { guildId: guildId, bypassRoles: mergedRoles }
            });

            // UI de Sucesso
            const rolesFormatted = selectedRoleIds.map(id => `<@&${id}>`).join(', ');
            const successText = new TextDisplayBuilder()
                .setContent(`# ✅ Passe Livre Atualizado!\nOs seguintes cargos foram adicionados à lista de autoridade das salas dinâmicas:\n\n${rolesFormatted}`);
            
            const backButtonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('dashboard_select_module').setLabel('◀ Voltar ao Dashboard').setStyle(ButtonStyle.Secondary)
            );

            const successContainer = new ContainerBuilder()
                .setAccentColor(0x57F287)
                .addTextDisplayComponents(successText) // ✅ V2
                .addActionRowComponents(backButtonRow); // ✅ V2

            await interaction.update({ components: [successContainer], flags: [MessageFlags.IsComponentsV2] });

        } catch (error) {
            console.error('❌ Erro ao salvar Passe Livre:', error);
            
            const errorText = new TextDisplayBuilder().setContent('# ❌ Falha na Sincronização\nOcorreu um erro ao tentar salvar estes cargos.');
            const errorContainer = new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(errorText); // ✅ V2

            await interaction.update({ components: [errorContainer], flags: [MessageFlags.IsComponentsV2] });
        }
    }
};