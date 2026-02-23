const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: 'eco_vip_custom_color_select',

    async execute(interaction, client) {
        // Apanha a cor escolhida no menu e tira o '#' para podermos passar no ID
        const hexColor = interaction.values[0].replace('#', '');

        try {
            // O ID deste modal vai levar a cor escondida dentro dele! (Ex: eco_vip_role_submit_FF0000)
            const modal = new ModalBuilder()
                .setCustomId(`eco_vip_role_submit_${hexColor}`)
                .setTitle('🏷️ Nome do seu Cargo VIP');

            const nameInput = new TextInputBuilder()
                .setCustomId('role_name')
                .setLabel('Nome do Cargo (Pode incluir Emojis)')
                .setPlaceholder('Ex: 👑 Os Magnatas')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(50)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(nameInput));

            // Mostra a janela ao jogador
            await interaction.showModal(modal);

        } catch (error) {
            console.error('Erro ao abrir modal do nome do cargo:', error);
        }
    }
};