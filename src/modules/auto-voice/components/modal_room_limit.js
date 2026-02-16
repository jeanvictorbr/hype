const { MessageFlags } = require('discord.js');

module.exports = {
    customId: 'modal_room_limit',
    async execute(interaction, client) {
        const limit = parseInt(interaction.fields.getTextInputValue('input_room_limit'));
        
        if (isNaN(limit) || limit < 0 || limit > 99) {
            return interaction.reply({ content: '❌ Por favor, insere um número entre 0 e 99.', flags: [MessageFlags.Ephemeral] });
        }

        await interaction.channel.setUserLimit(limit);
        
        await interaction.reply({ 
            content: `✅ Limite da sala alterado para **${limit === 0 ? 'Ilimitado' : limit}** membros.`, 
            flags: [MessageFlags.Ephemeral] 
        });
    }
};