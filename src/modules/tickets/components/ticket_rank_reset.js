const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_rank_reset_confirm',

    async execute(interaction, client) {
        // Validação simples de admin
        if (!interaction.member.permissions.has('Administrator')) return;

        await prisma.staffStats.deleteMany({
            where: { guildId: interaction.guild.id }
        });

        // Recarrega o painel
        const panel = require('./ticket_ranking_panel');
        await panel.execute(interaction, client);
    }
};