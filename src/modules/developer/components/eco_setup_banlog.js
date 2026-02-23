const { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType, MessageFlags } = require('discord.js');

module.exports = {
    customIdPrefix: 'eco_setup_banlog_',

    async execute(interaction, client) {
        const guildId = interaction.customId.split('_').pop();

        const menu = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId(`eco_submit_banlog_${guildId}`)
                .setPlaceholder('Selecione o canal para logs de ban...')
                .setChannelTypes(ChannelType.GuildText)
                .setMinValues(1).setMaxValues(1)
        );

        await interaction.reply({ 
            content: '⚖️ **Tribunal VIP:** Selecione abaixo em qual canal de texto os VIPs Nível 3 enviarão as solicitações de Banimento.',
            components: [menu], 
            flags: [MessageFlags.Ephemeral] 
        });
    }
};