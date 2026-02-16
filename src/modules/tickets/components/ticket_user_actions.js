const { 
    PermissionFlagsBits, ContainerBuilder, TextDisplayBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags 
} = require('discord.js');

module.exports = {
    // Captura ticket_user_add E ticket_user_remove
    customIdPrefix: 'ticket_user_', 

    async execute(interaction, client) {
        await interaction.deferUpdate();

        const isAdd = interaction.customId === 'ticket_user_add';
        const targetIds = interaction.values;
        const channel = interaction.channel;

        const updatedUsers = [];

        for (const userId of targetIds) {
            try {
                // 1. Atualiza Permissões
                await channel.permissionOverwrites.edit(userId, {
                    ViewChannel: isAdd ? true : false,
                    SendMessages: isAdd ? true : false,
                    ReadMessageHistory: isAdd ? true : false
                });

                // 2. Notificação DM (Apenas se for adicionar)
                if (isAdd) {
                    const user = await client.users.fetch(userId);
                    const dmContainer = new ContainerBuilder()
                        .setAccentColor(0x57F287)
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# 🎫 Acesso Concedido\nVocê foi adicionado ao ticket **${channel.name}** no servidor **${interaction.guild.name}**.`))
                        .addActionRowComponents(
                            new ActionRowBuilder().addComponents(
                                new ButtonBuilder().setLabel('Acessar Ticket').setStyle(ButtonStyle.Link).setURL(channel.url)
                            )
                        );
                    
                    await user.send({ components: [dmContainer], flags: [MessageFlags.IsComponentsV2] }).catch(() => {});
                }

                updatedUsers.push(`<@${userId}>`);
            } catch (err) {
                console.error(`Erro ao gerir user ${userId}:`, err);
            }
        }

        // 3. Notificação no Chat do Ticket
        const actionText = isAdd ? 'adicionado(s) ao' : 'removido(s) do';
        const emoji = isAdd ? '✅' : '🚫';
        
        const feedbackContainer = new ContainerBuilder()
            .setAccentColor(isAdd ? 0x57F287 : 0xED4245)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${emoji} **Atualização de Acesso**\nOs seguintes membros foram ${actionText} ticket:\n${updatedUsers.join(', ')}`));

        await channel.send({ components: [feedbackContainer], flags: [MessageFlags.IsComponentsV2] });
    }
};