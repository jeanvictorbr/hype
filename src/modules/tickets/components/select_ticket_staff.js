const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'select_ticket_staff',

    async execute(interaction, client) {
        // Os IDs dos cargos selecionados vêm prontos num array
        const selectedRoleIds = interaction.values;
        const guildId = interaction.guild.id;

        try {
            // ==========================================
            // GRAVAÇÃO SEGURA NA BASE DE DADOS
            // ==========================================
            
            // Usamos o upsert para garantir que, se ele não tiver feito o "Setup Rápido"
            // antes, a base de dados não crasha e cria a linha na mesma.
            await prisma.ticketConfig.upsert({
                where: { guildId: guildId },
                update: {
                    staffRoles: selectedRoleIds, // Substitui a equipa antiga pela nova seleção
                },
                create: {
                    guildId: guildId,
                    staffRoles: selectedRoleIds,
                }
            });

            // ==========================================
            // FEEDBACK VISUAL DE SUCESSO
            // ==========================================
            
            // Formatamos para que o Discord mostre as menções corretas (@Cargo)
            const rolesFormatted = selectedRoleIds.map(id => `<@&${id}>`).join(', ');

            const successText = new TextDisplayBuilder()
                .setContent(`# ✅ Equipa Definida com Sucesso!\nOs seguintes cargos têm agora autorização para gerir os tickets deste servidor:\n\n${rolesFormatted}`);
            
            const backButtonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('dashboard_select_module')
                    .setLabel('◀ Voltar ao Dashboard')
                    .setStyle(ButtonStyle.Secondary)
            );

            const successContainer = new ContainerBuilder()
                .setAccentColor(0x57F287) // Verde
                .addComponents(successText, backButtonRow);

            // Substitui o menu pela mensagem de sucesso sem poluir o chat
            await interaction.update({ components: [successContainer] });

        } catch (error) {
            console.error('❌ Erro ao guardar Staff de Tickets:', error);
            
            const errorText = new TextDisplayBuilder()
                .setContent('# ❌ Falha na Base de Dados\nOcorreu um erro ao tentar guardar as permissões da equipa. Por favor, tente novamente.');
            
            const errorContainer = new ContainerBuilder()
                .setAccentColor(0xED4245) // Vermelho
                .addComponents(errorText);

            await interaction.update({ components: [errorContainer] });
        }
    }
};