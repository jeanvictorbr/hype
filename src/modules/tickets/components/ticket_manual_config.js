const { prisma } = require('../../../core/database');

module.exports = {
    // Captura ambos os menus manuais
    customIdPrefix: 'ticket_manual_', 

    async execute(interaction, client) {
        const value = interaction.values[0];
        const type = interaction.customId === 'ticket_manual_cat' ? 'cat' : 'logs';

        if (type === 'cat') {
            await prisma.ticketConfig.upsert({
                where: { guildId: interaction.guild.id },
                create: { guildId: interaction.guild.id, ticketCategory: value, staffRoles: [] },
                update: { ticketCategory: value }
            });
        } else {
            await prisma.ticketConfig.upsert({
                where: { guildId: interaction.guild.id },
                create: { guildId: interaction.guild.id, logChannel: value, staffRoles: [] },
                update: { logChannel: value }
            });
        }

        // Recarrega o HUB
        const ticketHub = require('./ticket_config_hub');
        await ticketHub.execute(interaction, client);
    }
};