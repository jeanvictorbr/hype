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
            console.error(error);
            await interaction.reply({ content: '❌ Erro ao carregar ranking.', ephemeral: true });
        }
    }
};