const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

module.exports = {
    customId: 'eco_cancel_buy',

    async execute(interaction, client) {
        await interaction.deferUpdate();

        const cancelText = new TextDisplayBuilder()
            .setContent(`## ✖️ Compra Cancelada\nVocê cancelou a transação. O seu saldo não foi alterado.`);
        
        const cancelContainer = new ContainerBuilder()
            .setAccentColor(0x2b2d31) // Cor Neutra
            .addTextDisplayComponents(cancelText);

        await interaction.editReply({ 
            components: [cancelContainer], 
            flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] 
        });
    }
};