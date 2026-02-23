const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    // 👇 Mudamos para eco_ para fugir do dev_action_handler
    customIdPrefix: 'eco_config_vip_finance_',

    async execute(interaction, client) {
        const guildId = interaction.customId.replace('eco_config_vip_finance_', '');

        const modal = new ModalBuilder()
            .setCustomId(`eco_submit_vip_finance_${guildId}`) // 👇 Submit também mudou para eco_
            .setTitle('💸 Configurar Vendas VIP');

        // Input 1: O Token do Mercado Pago do dono daquele servidor
        const mpTokenInput = new TextInputBuilder()
            .setCustomId('mp_token')
            .setLabel('Mercado Pago Access Token (APP_USR-...)')
            .setPlaceholder('Ex: APP_USR-123456789...')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        // Input 2: Preço do Nível 1
        const priceVip1Input = new TextInputBuilder()
            .setCustomId('price_vip1')
            .setLabel('Preço VIP 1 (Pista) - Ex: 15.00')
            .setPlaceholder('15.00')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        // Input 3: Preço do Nível 2
        const priceVip2Input = new TextInputBuilder()
            .setCustomId('price_vip2')
            .setLabel('Preço VIP 2 (Camarote) - Ex: 30.00')
            .setPlaceholder('30.00')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        // Input 4: Preço do Nível 3
        const priceVip3Input = new TextInputBuilder()
            .setCustomId('price_vip3')
            .setLabel('Preço VIP 3 (Dono do Baile) - Ex: 50.00')
            .setPlaceholder('50.00')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(mpTokenInput),
            new ActionRowBuilder().addComponents(priceVip1Input),
            new ActionRowBuilder().addComponents(priceVip2Input),
            new ActionRowBuilder().addComponents(priceVip3Input)
        );

        await interaction.showModal(modal);
    }
};