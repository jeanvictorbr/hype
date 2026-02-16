const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_save_visual',

    async execute(interaction, client) {
        // 🛡️ BLINDAGEM: Avisa o Discord IMEDIATAMENTE que recebemos o comando.
        // Isso evita o erro "Unknown Interaction" se o banco de dados demorar.
        await interaction.deferUpdate();

        // 1. Captura os dados do Modal
        const title = interaction.fields.getTextInputValue('input_title');
        const desc = interaction.fields.getTextInputValue('input_desc');
        const footer = interaction.fields.getTextInputValue('input_footer');

        // 2. Salva no Banco (Agora pode demorar o quanto quiser)
        await prisma.ticketConfig.update({
            where: { guildId: interaction.guild.id },
            data: {
                panelTitle: title,
                panelDescription: desc,
                panelFooter: footer
            }
        });

        // 3. Recarrega o Painel Principal (Hub)
        const ticketHub = require('./ticket_config_hub');
        await ticketHub.execute(interaction, client);
    }
};