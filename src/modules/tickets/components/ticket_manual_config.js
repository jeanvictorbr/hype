const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'ticket_manual_', 

    async execute(interaction, client) {
        const value = interaction.values[0];
        const isCat = interaction.customId === 'ticket_manual_cat';

        await prisma.ticketConfig.upsert({
            where: { guildId: interaction.guild.id },
            create: { 
                guildId: interaction.guild.id, 
                ticketCategory: isCat ? value : null, 
                logChannel: !isCat ? value : null,
                staffRoles: [] 
            },
            update: { 
                ticketCategory: isCat ? value : undefined,
                logChannel: !isCat ? value : undefined
            }
        });

        const ticketHub = require('./ticket_config_hub');
        await ticketHub.execute(interaction, client);
    }
};