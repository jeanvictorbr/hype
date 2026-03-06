const { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');

// Função de cálculo de multiplicador para manter o status atualizado
function getMultiplier(hits, total = 20, bombs = 3) {
    let m = 1.0;
    for (let i = 0; i < hits; i++) m *= (total - i) / (total - bombs - i);
    return m * 0.95;
}

module.exports = {
    customIdPrefix: 'eco_mines_lanterna_',

    async execute(interaction, client) {
        const userId = interaction.customId.replace('eco_mines_lanterna_', '');
        if (interaction.user.id !== userId) {
            return interaction.reply({ content: '❌ Esta lanterna não é sua!', flags: [MessageFlags.Ephemeral] });
        }

        const game = client.activeMines?.get(userId);
        if (!game) return interaction.reply({ content: '❌ Jogo expirado.', flags: [MessageFlags.Ephemeral] });

        if (game.scanned && game.scanned.length > 0) {
            return interaction.reply({ content: '❌ Você já usou a lanterna nesta rodada!', flags: [MessageFlags.Ephemeral] });
        }

        const userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
        if (!userProfile || userProfile.invLanternas <= 0) {
            return interaction.reply({ content: '❌ Você não tem Lanternas Táticas na mochila!', flags: [MessageFlags.Ephemeral] });
        }

        // --- LÓGICA DA VARREDURA ---
        // Pega as casas que AINDA NÃO FORAM clicadas
        let indicesDisponiveis = [];
        for(let i=0; i<20; i++){
            if(!game.clicked.includes(i)) indicesDisponiveis.push(i);
        }
        
        let reveal = [];
        for (let i = 0; i < 3 && indicesDisponiveis.length > 0; i++) {
            const rand = Math.floor(Math.random() * indicesDisponiveis.length);
            reveal.push(indicesDisponiveis.splice(rand, 1)[0]);
        }

        game.scanned = reveal; // Guarda os 3 índices revelados
        client.activeMines.set(userId, game);

        // Consome 1 item da mochila
        await prisma.hypeUser.update({
            where: { id: userId },
            data: { invLanternas: { decrement: 1 } }
        });

        // ========================================================
        // RECONSTRUÇÃO VISUAL COMPLETA (MANTÉM O GAME INTACTO)
        // ========================================================
        
        const currentMultiplier = getMultiplier(game.hits);
        const currentProfit = game.hits === 0 ? 0 : Math.floor(game.bet * currentMultiplier);

        // 1. Recria a parte de cima (Textos e Stats)
        const header = new TextDisplayBuilder().setContent(`# 💣 MINES HYPE\nO campo minado de <@${userId}> continua!`);
        const stats = new TextDisplayBuilder().setContent(`**Aposta:** R$ ${game.bet.toLocaleString('pt-BR')}\n**Multiplicador:** ${currentMultiplier.toFixed(2)}x\n**Lucro Atual:** R$ ${currentProfit.toLocaleString('pt-BR')}`);

        const container = new ContainerBuilder()
            .setAccentColor(0x2b2d31)
            .addTextDisplayComponents(header)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(stats);

        // 2. Recria os quadrados com as cores da lanterna
        const rows = [];
        for (let r = 0; r < 4; r++) {
            const row = new ActionRowBuilder();
            for (let c = 0; c < 5; c++) {
                const idx = r * 5 + c;
                let style = ButtonStyle.Secondary;
                let emoji = '🔲';

                if (game.clicked.includes(idx)) {
                    style = ButtonStyle.Success;
                    emoji = '💎';
                } else if (reveal.includes(idx)) {
                    style = ButtonStyle.Primary;
                    emoji = game.grid[idx] === 'bomb' ? '⚠️' : '💎'; // Avisa o que tem lá dentro
                }

                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`eco_mines_click_${idx}_${userId}`)
                        .setStyle(style)
                        .setEmoji(emoji)
                        .setDisabled(game.clicked.includes(idx)) // Só desativa os que já foram clicados
                );
            }
            rows.push(row);
        }

        // 3. Recria a linha de botões de controle
        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`eco_mines_cashout_${userId}`)
                .setLabel(`💰 Retirar Lucro (R$ ${currentProfit.toLocaleString('pt-BR')})`)
                .setStyle(ButtonStyle.Success)
                .setDisabled(game.hits === 0),
            new ButtonBuilder()
                .setCustomId(`eco_mines_lanterna_done`)
                .setLabel('VARREDURA FEITA')
                .setEmoji('🔦')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true)
        );
        rows.push(actionRow);

        // Atualiza a mensagem com a flag V2 para não quebrar a interface!
        await interaction.update({ components: [container, ...rows], flags: [MessageFlags.IsComponentsV2] });
        await interaction.followUp({ content: '🔦╺╸**VARREDURA CONCLUÍDA!** Verifique os ícones em azul no campo de minas.', flags: [MessageFlags.Ephemeral] });
    }
};