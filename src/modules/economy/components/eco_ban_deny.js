const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customIdPrefix: 'eco_ban_deny_',

    async execute(interaction, client) {
        const targetVipId = interaction.customId.split('_').pop();

        // O ID deste modal vai levar o ID do VIP para a próxima etapa
        const modal = new ModalBuilder()
            .setCustomId(`eco_ban_deny_sub_${targetVipId}`)
            .setTitle('❌ Motivo da Rejeição');

        const reasonInput = new TextInputBuilder()
            .setCustomId('deny_reason')
            .setLabel('Por que o banimento foi negado?')
            .setPlaceholder('Ex: Provas insuficientes, não viola as regras...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
        await interaction.showModal(modal);
    }
};