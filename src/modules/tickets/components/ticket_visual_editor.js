const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_visual_editor',

    async execute(interaction, client) {
        const config = await prisma.ticketConfig.findUnique({
            where: { guildId: interaction.guild.id }
        });

        const modal = new ModalBuilder()
            .setCustomId('ticket_save_visual')
            .setTitle('🎨 Personalizar Vitrine');

        const inputTitle = new TextInputBuilder()
            .setCustomId('input_title')
            .setLabel('Título do Painel')
            .setStyle(TextInputStyle.Short)
            .setValue(config?.panelTitle || '📩 Central de Atendimento')
            .setMaxLength(50)
            .setRequired(true);

        const inputDesc = new TextInputBuilder()
            .setCustomId('input_desc')
            .setLabel('Descrição (Mensagem Principal)')
            .setStyle(TextInputStyle.Paragraph)
            .setValue(config?.panelDescription || 'Clique abaixo para abrir um ticket.')
            .setMaxLength(300)
            .setRequired(true);

        const inputFooter = new TextInputBuilder()
            .setCustomId('input_footer')
            .setLabel('Rodapé (Opcional)')
            .setStyle(TextInputStyle.Short)
            .setValue(config?.panelFooter || '')
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(inputTitle),
            new ActionRowBuilder().addComponents(inputDesc),
            new ActionRowBuilder().addComponents(inputFooter)
        );

        await interaction.showModal(modal);
    }
};