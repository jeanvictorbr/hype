const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customIdPrefix: 'eco_config_vip_finance_',

    async execute(interaction, client) {
        const guildId = interaction.customId.replace('eco_config_vip_finance_', '');

        const modal = new ModalBuilder()
            .setCustomId(`eco_submit_vip_finance_${guildId}`)
            .setTitle('💵 Configurar Preços VIP');

        // As 5 Caixas exatas permitidas pelo Discord
        const p1 = new TextInputBuilder().setCustomId('p1').setLabel('Preço VIP BOOSTER (Ex: 10.00)').setPlaceholder('10.00').setStyle(TextInputStyle.Short).setRequired(true);
        const p2 = new TextInputBuilder().setCustomId('p2').setLabel('Preço VIP PRIME (Ex: 25.00)').setPlaceholder('25.00').setStyle(TextInputStyle.Short).setRequired(true);
        const p3 = new TextInputBuilder().setCustomId('p3').setLabel('Preço VIP EXCLUSIVE (Ex: 40.00)').setPlaceholder('40.00').setStyle(TextInputStyle.Short).setRequired(true);
        const p4 = new TextInputBuilder().setCustomId('p4').setLabel('Preço VIP ELITE (Ex: 60.00)').setPlaceholder('60.00').setStyle(TextInputStyle.Short).setRequired(true);
        const p5 = new TextInputBuilder().setCustomId('p5').setLabel('Preço VIP SUPREME (Ex: 100.00)').setPlaceholder('100.00').setStyle(TextInputStyle.Short).setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(p1),
            new ActionRowBuilder().addComponents(p2),
            new ActionRowBuilder().addComponents(p3),
            new ActionRowBuilder().addComponents(p4),
            new ActionRowBuilder().addComponents(p5)
        );

        await interaction.showModal(modal);
    }
};