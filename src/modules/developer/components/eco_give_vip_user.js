const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customIdPrefix: 'eco_give_vip_user_',

    async execute(interaction, client) {
        const guildId = interaction.customId.replace('eco_give_vip_user_', '');
        
        const modal = new ModalBuilder()
            .setCustomId(`eco_give_vip_submit_${guildId}`)
            .setTitle('🎁 Entregar VIP Temporário');

        const userInput = new TextInputBuilder()
            .setCustomId('vip_user_id')
            .setLabel('ID do Jogador no Discord')
            .setPlaceholder('Ex: 123456789012345678')
            .setStyle(TextInputStyle.Short)
            .setMinLength(15).setMaxLength(20)
            .setRequired(true);

        const levelInput = new TextInputBuilder()
            .setCustomId('vip_level')
            .setLabel('Nível do VIP (1, 2 ou 3)')
            .setPlaceholder('Ex: 3 (Para Dono do Baile)')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(1)
            .setRequired(true);

        const daysInput = new TextInputBuilder()
            .setCustomId('vip_days')
            .setLabel('Duração em Dias')
            .setPlaceholder('Ex: 30')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(4)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(userInput),
            new ActionRowBuilder().addComponents(levelInput),
            new ActionRowBuilder().addComponents(daysInput)
        );

        await interaction.showModal(modal);
    }
};