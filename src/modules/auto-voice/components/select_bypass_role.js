const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'select_bypass_role',

    async execute(interaction, client) {
        // 'interaction.values' já entrega um array prontinho com os IDs dos cargos selecionados
        const selectedRoleIds = interaction.values;
        const guildId = interaction.guild.id;

        try {
            // ==========================================
            // LÓGICA DE BANCO DE DADOS (MERGE DE ARRAYS)
            // ==========================================
            
            // 1. Puxa a config atual para não sobrescrever os cargos que já estavam lá
            const currentConfig = await prisma.autoVoiceConfig.findUnique({
                where: { guildId: guildId }
            });

            // 2. Junta os cargos antigos com os novos, e usa o Set() para remover duplicatas
            // Caso seja a primeira vez, usa um array vazio como base
            const existingRoles = currentConfig?.bypassRoles || [];
            const mergedRoles = [...new Set([...existingRoles, ...selectedRoleIds])];

            // 3. Salva o novo Array no PostgreSQL
            await prisma.autoVoiceConfig.upsert({
                where: { guildId: guildId },
                update: {
                    bypassRoles: mergedRoles,
                },
                create: {
                    guildId: guildId,
                    bypassRoles: mergedRoles,
                }
            });

            // ==========================================
            // FEEDBACK VISUAL (Tela de Sucesso)
            // ==========================================
            
            // Formatamos para o Discord renderizar as menções dos cargos bonitinhas
            const rolesFormatted = selectedRoleIds.map(id => `<@&${id}>`).join(', ');

            const successText = new TextDisplayBuilder()
                .setContent(`# ✅ Passe Livre Atualizado!\nOs seguintes cargos foram adicionados à lista de autoridade das salas dinâmicas:\n\n${rolesFormatted}`);
            
            const backButtonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('dashboard_select_module') // Botão para voltar ao início do /hype
                    .setLabel('◀ Voltar ao Dashboard')
                    .setStyle(ButtonStyle.Secondary)
            );

            const successContainer = new ContainerBuilder()
                .setAccentColor(0x57F287) // Verde
                .addComponents(successText, backButtonRow);

            // Substitui o menu pela tela de sucesso
            await interaction.update({ components: [successContainer] });

        } catch (error) {
            console.error('❌ Erro ao salvar Passe Livre:', error);
            
            const errorText = new TextDisplayBuilder()
                .setContent('# ❌ Falha na Sincronização\nOcorreu um erro ao tentar salvar estes cargos no banco de dados. Tente novamente.');
            
            const errorContainer = new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addComponents(errorText);

            await interaction.update({ components: [errorContainer] });
        }
    }
};