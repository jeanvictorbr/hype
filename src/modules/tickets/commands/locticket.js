const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('locticket')
        .setDescription('🔍 Localizar um ticket antigo pelo protocolo')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const modal = new ModalBuilder()
            .setCustomId('ticket_loc_handler')
            .setTitle('🔍 Localizar Atendimento');

        const protocolInput = new TextInputBuilder()
            .setCustomId('input_protocol')
            .setLabel('Número do Protocolo')
            .setPlaceholder('Ex: TKT-A1B2C3')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(protocolInput));
        await interaction.showModal(modal);
    }
};