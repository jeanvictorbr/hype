const { 
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_ranking_panel', // Coloque este ID num botão no Hub Principal se quiser

    async execute(interaction, client) {
        const guildId = interaction.guild.id;

        // Busca Top 10 Staffs ordenados por tickets fechados
        const rankings = await prisma.staffStats.findMany({
            where: { guildId },
            orderBy: { ticketsClosed: 'desc' },
            take: 10
        });

        let rankingText = '';
        if (rankings.length === 0) {
            rankingText = '*Nenhum atendimento registado ainda.*';
        } else {
            rankingText = rankings.map((stat, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                return `${medal} **<@${stat.staffId}>**\n> 📥 Tickets: \`${stat.ticketsClosed}\` | ⭐ Média: \`${stat.averageRating}\`/5`;
            }).join('\n\n');
        }

        const header = new TextDisplayBuilder().setContent('# 🏆 Ranking de Atendimento\nOs melhores membros da nossa equipa de suporte.');
        const body = new TextDisplayBuilder().setContent(rankingText);
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_config_hub').setLabel('Voltar').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_rank_reset_confirm').setLabel('Resetar Ranking').setStyle(ButtonStyle.Danger).setEmoji('💀')
        );

        const container = new ContainerBuilder()
            .setAccentColor(0xFFAC33) // Dourado
            .addTextDisplayComponents(header)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(body)
            .addActionRowComponents(row);

        if (interaction.isButton()) await interaction.update({ components: [container], flags: [MessageFlags.IsComponentsV2] });
        else await interaction.reply({ components: [container], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
    }
};