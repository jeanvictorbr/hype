const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customIdPrefix: 'eco_remove_vip_user_', // 👇 Correção de Roteamento AQUI
    async execute(interaction) {
        const guildId = interaction.customId.replace('eco_remove_vip_user_', '');
        
        const modal = new ModalBuilder()
            .setCustomId(`eco_rem_vip_submit_${guildId}`)
            .setTitle('🛑 Remover VIP de Jogador');

        const userIdInput = new TextInputBuilder()
            .setCustomId('userId')
            .setLabel('ID do Jogador no Discord')
            .setPlaceholder('Ex: 123456789012345678')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(userIdInput));
        await interaction.showModal(modal);
    }
};