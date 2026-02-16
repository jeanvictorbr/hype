const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

module.exports = {
    customId: 'select_room_allow',
    async execute(interaction, client) {
        const targetId = interaction.values[0];

        await interaction.channel.permissionOverwrites.edit(targetId, {
            Connect: true,
            ViewChannel: true
        });

        // 🛠️ CORREÇÃO: No V2, texto de sucesso DEVE ser um TextDisplay, nunca 'content'
        const successText = new TextDisplayBuilder()
            .setContent(`# ✅ Acesso Concedido\nO membro <@${targetId}> agora tem permissão para entrar na sala.`);

        const container = new ContainerBuilder()
            .setAccentColor(0x57F287)
            .addTextDisplayComponents(successText);

        await interaction.update({ 
            flags: [MessageFlags.IsComponentsV2],
            components: [container] 
        });
    }
};