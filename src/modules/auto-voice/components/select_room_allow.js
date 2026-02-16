const { PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    customId: 'select_room_allow',
    async execute(interaction, client) {
        const targetId = interaction.values[0];

        await interaction.channel.permissionOverwrites.edit(targetId, {
            Connect: true,
            ViewChannel: true
        });

        await interaction.update({ 
            content: `✅ Acesso concedido a <@${targetId}>!`, 
            components: [] 
        });
    }
};