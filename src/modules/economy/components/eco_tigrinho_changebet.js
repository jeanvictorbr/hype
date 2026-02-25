const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');

module.exports = {
    customIdPrefix: 'eco_tigrinho_changebet_',

    async execute(interaction, client) {
        const ownerId = interaction.customId.replace('eco_tigrinho_changebet_', '');

        // Trava de Segurança para ninguém roubar a máquina
        if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: '❌ Máquina ocupada! Digite `/tigrinho` para jogar na sua.', flags: [MessageFlags.Ephemeral] });
        }

        // Cria a Janelinha para ele digitar o novo valor
        const modal = new ModalBuilder()
            .setCustomId(`eco_tigrinho_modal_${ownerId}`)
            .setTitle('💰 Alterar Valor da Aposta');

        const betInput = new TextInputBuilder()
            .setCustomId('new_bet_amount')
            .setLabel('Novo valor (Mínimo: 10 HC)')
            .setPlaceholder('Ex: 500')
            .setStyle(TextInputStyle.Short)
            .setMinLength(2)
            .setMaxLength(8)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(betInput));

        // Mostra a Janela ao Jogador
        await interaction.showModal(modal);
    }
};