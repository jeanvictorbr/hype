const { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');

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

        // --- LÓGICA DO DETECTOR DE BOMBAS ---
        // 1. Encontra todas as bombas que ainda NÃO foram clicadas
        let unclickedBombs = [];
        for(let i = 0; i < 20; i++){
            if(!game.clicked.includes(i) && game.grid[i] === 'bomb') {
                unclickedBombs.push(i);
            }
        }
        
        // 2. Define quantas bombas revelar (1 garantida. 25% de chance de revelar 2 se houverem)
        let numToReveal = 1;
        if (unclickedBombs.length >= 2 && Math.random() < 0.25) {
            numToReveal = 2;
        }

        // 3. Sorteia as bombas
        unclickedBombs = unclickedBombs.sort(() => Math.random() - 0.5);
        let reveal = unclickedBombs.slice(0, numToReveal);

        game.scanned = reveal; // Guarda os índices das bombas reveladas
        client.activeMines.set(userId, game);

        // Consome 1 item da mochila
        await prisma.hypeUser.update({
            where: { id: userId },
            data: { invLanternas: { decrement: 1 } }
        });

        // ========================================================
        // RECONSTRUÇÃO VISUAL DO TABULEIRO
        // ========================================================
        
        const currentMultiplier = getMultiplier(game.hits);
        const currentProfit = game.hits === 0 ? 0 : Math.floor(game.bet * currentMultiplier);

        const header = new TextDisplayBuilder().setContent(`# 💣 MINES HYPE\nO campo minado de <@${userId}> continua!`);
        const stats = new TextDisplayBuilder().setContent(`**Aposta:** R$ ${game.bet.toLocaleString('pt-BR')}\n**Multiplicador:** ${currentMultiplier.toFixed(2)}x\n**Lucro Atual:** R$ ${currentProfit.toLocaleString('pt-BR')}`);

        const container = new ContainerBuilder()
            .setAccentColor(0x2b2d31)
            .addTextDisplayComponents(header)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(stats);

        const rows = [];
        for (let r = 0; r < 4; r++) {
            const row = new ActionRowBuilder();
            for (let c = 0; c < 5; c++) {
                const idx = r * 5 + c;
                let style = ButtonStyle.Secondary;
                let emoji = '🔲';
                let isDisabled = false;

                if (game.clicked.includes(idx)) {
                    style = ButtonStyle.Success;
                    emoji = '💎';
                    isDisabled = true;
                } else if (reveal.includes(idx)) {
                    style = ButtonStyle.Danger; // Fica VERMELHO para alertar o perigo máximo
                    emoji = '⚠️'; 
                    isDisabled = true; // Bloqueia o clique, pois é morte na certa
                }

                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`eco_mines_click_${idx}_${userId}`)
                        .setStyle(style)
                        .setEmoji(emoji)
                        .setDisabled(isDisabled)
                );
            }
            rows.push(row);
        }

        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`eco_mines_cashout_${userId}`)
                .setLabel(`💰 Retirar Lucro (R$ ${currentProfit.toLocaleString('pt-BR')})`)
                .setStyle(ButtonStyle.Success)
                .setDisabled(game.hits === 0), 
            new ButtonBuilder()
                .setCustomId(`eco_mines_lanterna_done`)
                .setLabel('RASTREAMENTO FEITO')
                .setEmoji('🔦')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true)
        );
        rows.push(actionRow);

        await interaction.update({ components: [container, ...rows], flags: [MessageFlags.IsComponentsV2] });
        
        // --- TEXTO DINÂMICO PARA EXPLICAR O RESULTADO ---
        let feedbackMessage = numToReveal === 2 
            ? '🔦╺╸**SORTE GRANDE!** A sua Lanterna rastreou **2 BOMBAS**! Elas foram marcadas em vermelho com `⚠️`. Desvie delas e clique nas seguras!'
            : '🔦╺╸**RASTREAMENTO CONCLUÍDO!** A sua Lanterna detectou **1 BOMBA**! Ela foi marcada em vermelho com `⚠️`. Desvie dela com cuidado!';

        await interaction.followUp({ content: feedbackMessage, flags: [MessageFlags.Ephemeral] });
    }
};