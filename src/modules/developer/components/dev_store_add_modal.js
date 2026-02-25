const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    // Escuta o botão com customId "dev_store_add_ID_DA_GUILDA"
  customIdPrefix: 'eco_store_add_',

    async execute(interaction, client) {
        // Extrai o ID do servidor do customId do botão
        const guildId = interaction.customId.split('_').pop();

        // 1. Cria a Janela Pop-up (Modal)
        const modal = new ModalBuilder()
            .setCustomId(`modal_store_submit_${guildId}`)
            .setTitle('📦 Criar Item na Lojinha');

        // 2. Campo: Nome do Item
        const nameInput = new TextInputBuilder()
            .setCustomId('item_name')
            .setLabel('Nome do Item')
            .setPlaceholder('Ex: 🚗 Viatura VIP, 👑 Cargo Patrão')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(50)
            .setRequired(true);

        // 3. Campo: Preço
        const priceInput = new TextInputBuilder()
            .setCustomId('item_price')
            .setLabel('Preço (em HypeCoins)')
            .setPlaceholder('Ex: 1500')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        // 4. Campo: Descrição
        const descInput = new TextInputBuilder()
            .setCustomId('item_desc')
            .setLabel('Descrição Curta')
            .setPlaceholder('Ex: Libera acesso imediato a um carro exclusivo no servidor de Roblox.')
            .setStyle(TextInputStyle.Paragraph)
            .setMaxLength(100)
            .setRequired(false); // Opcional

        // 5. Campo: Entrega (Roblox vs Discord)
        const roleInput = new TextInputBuilder()
            .setCustomId('item_role')
            .setLabel('ID do Cargo Discord (Vazio = Item de Jogo)')
            .setPlaceholder('Cole o ID do cargo aqui se for item de Discord')
            .setStyle(TextInputStyle.Short)
            .setRequired(false); // Opcional

        // Adiciona tudo ao Modal (Regra da API do Discord: 1 ActionRow por Input)
        modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput),
            new ActionRowBuilder().addComponents(priceInput),
            new ActionRowBuilder().addComponents(descInput),
            new ActionRowBuilder().addComponents(roleInput)
        );

        // Mostra o pop-up na tela
        await interaction.showModal(modal);
    }
};