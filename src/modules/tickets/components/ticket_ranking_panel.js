const { 
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_ranking_panel',

    async execute(interaction, client) {
        const guildId = interaction.guild.id;

        // 1. Busca Top 10 Staffs do Banco
        const rankings = await prisma.staffStats.findMany({
            where: { guildId },
            orderBy: { ticketsClosed: 'desc' },
            take: 10
        });

        // 2. Monta o texto do Ranking
        let rankingText = '';
        if (rankings.length === 0) {
            rankingText = '*Nenhum atendimento registado ainda.*';
        } else {
            rankingText = rankings.map((stat, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                return `${medal} **<@${stat.staffId}>**\n> 📥 Tickets: \`${stat.ticketsClosed}\` | ⭐ Média: \`${stat.averageRating}\`/5`;
            }).join('\n\n');
        }

        // 3. Constrói o Painel V2
        const header = new TextDisplayBuilder().setContent('# 🏆 Ranking de Atendimento\nOs melhores membros da nossa equipa de suporte.');
        const body = new TextDisplayBuilder().setContent(rankingText);
        
        // Botões de Ação
        const row = new ActionRowBuilder().addComponents(
            // Botão Voltar (Só faz sentido se viemos do painel principal)
            new ButtonBuilder()
                .setCustomId('ticket_config_hub')
                .setLabel('Voltar')
                .setStyle(ButtonStyle.Secondary),
            
            // Botão Perigoso (Aponta para o Pedido de Confirmação)
            new ButtonBuilder()
                .setCustomId('ticket_reset_ask')
                .setLabel('Resetar Ranking')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('💀')
        );

        const container = new ContainerBuilder()
            .setAccentColor(0xFFAC33) // Dourado
            .addTextDisplayComponents(header)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(body)
            .addActionRowComponents(row);

        // 4. Lógica Inteligente de Envio (AQUI ESTAVA O ERRO)
        // Se for botão, atualiza a mensagem. Se for comando /, responde de novo.
        if (interaction.isMessageComponent()) {
            await interaction.update({ 
                components: [container], 
                flags: [MessageFlags.IsComponentsV2] 
            });
        } else {
            // Se for comando /ranking
            await interaction.reply({ 
                components: [container], 
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] 
            });
        }
    }
};