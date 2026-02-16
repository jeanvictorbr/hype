const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_save_visual',

    async execute(interaction, client) {
        const title = interaction.fields.getTextInputValue('input_title');
        const desc = interaction.fields.getTextInputValue('input_desc');
        const footer = interaction.fields.getTextInputValue('input_footer');

        await prisma.ticketConfig.update({
            where: { guildId: interaction.guild.id },
            data: {
                panelTitle: title,
                panelDescription: desc,
                panelFooter: footer
            }
        });

        // Simula reload do Hub
        interaction.deferUpdate(); // Evita erro de modal não respondido
        const ticketHub = require('./ticket_config_hub');
        await ticketHub.execute(interaction, client);
    }
};