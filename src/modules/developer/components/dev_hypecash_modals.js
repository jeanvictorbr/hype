const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    // 👇 Mudou aqui
    customIdPrefix: 'eco_hypecash_',
    
    async execute(interaction, client) {
        // Exemplo de como chega agora: eco_hypecash_add_123456789
        const parts = interaction.customId.split('_');
        const action = parts[2]; // Pega o 'add' ou 'rem' corretamente
        const guildId = parts[3];

        const isAdd = action === 'add';

        // Cria a Janela Pop-up
        const modal = new ModalBuilder()
            .setCustomId(`modal_hypecash_${action}_${guildId}`)
            .setTitle(isAdd ? '➕ Adicionar HypeCash' : '➖ Remover HypeCash');

        // ... resto do código continua igual!
        const userIdInput = new TextInputBuilder()
            .setCustomId('input_user_id')
            .setLabel('ID do Usuário')
            .setPlaceholder('Cole o ID do Discord do membro aqui')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const amountInput = new TextInputBuilder()
            .setCustomId('input_amount')
            .setLabel('Quantidade de HypeCash')
            .setPlaceholder('Ex: 500')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(userIdInput),
            new ActionRowBuilder().addComponents(amountInput)
        );

        await interaction.showModal(modal);
    }
};