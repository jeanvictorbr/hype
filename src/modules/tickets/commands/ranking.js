const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ranking')
        .setDescription('🏆 Exibe o Top Staff de atendimento')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction, client) {
        try {
            const panel = require('../components/ticket_ranking_panel');
            await panel.execute(interaction, client);
        } catch (error) {
            console.error("Erro no comando ranking:", error);
            
            // Evita crash se o painel falhar no meio
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ Erro ao carregar ranking.', ephemeral: true });
            } else {
                await interaction.followUp({ content: '❌ Erro ao processar ranking.', ephemeral: true });
            }
        }
    }
};