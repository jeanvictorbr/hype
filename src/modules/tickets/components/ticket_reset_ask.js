const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

module.exports = {
    customId: 'ticket_reset_ask',

    async execute(interaction, client) {
        // Validação Extra de Admin
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '🚫 Apenas Administradores podem resetar o ranking.', flags: [MessageFlags.Ephemeral] });
        }

        const header = new TextDisplayBuilder()
            .setContent('# ⚠️ Atenção!\nTem a certeza que deseja **Zerar todo o Ranking** de atendimento?\n\n*Esta ação é irreversível e todas as estatísticas da staff serão apagadas.*');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_ranking_panel').setLabel('Cancelar').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_rank_reset_confirm').setLabel('Sim, Resetar').setStyle(ButtonStyle.Danger)
        );

        const container = new ContainerBuilder()
            .setAccentColor(0xED4245)
            .addTextDisplayComponents(header)
            .addActionRowComponents(row);

        // Atualiza o painel atual para o aviso
        await interaction.update({ components: [container], flags: [MessageFlags.IsComponentsV2] });
    }
};