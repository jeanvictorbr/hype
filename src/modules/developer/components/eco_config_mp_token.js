const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customIdPrefix: 'eco_config_mp_token_',

    async execute(interaction) {
        const guildId = interaction.customId.replace('eco_config_mp_token_', '');

        const modal = new ModalBuilder()
            .setCustomId(`eco_submit_mp_token_${guildId}`)
            .setTitle('🏦 Configurar Mercado Pago');

        const mpTokenInput = new TextInputBuilder()
            .setCustomId('mp_token')
            .setLabel('Access Token (APP_USR-...)')
            .setPlaceholder('Cole aqui o token de produção...')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(mpTokenInput));
        await interaction.showModal(modal);
    }
};