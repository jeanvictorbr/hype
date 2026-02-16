const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ranking')
        .setDescription('🏆 Exibe o Top Staff de atendimento')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // Apenas staff/admin

    async execute(interaction, client) {
        // Simplesmente chama o painel que já criamos
        const panel = require('../components/ticket_ranking_panel');
        await panel.execute(interaction, client);
    }
};