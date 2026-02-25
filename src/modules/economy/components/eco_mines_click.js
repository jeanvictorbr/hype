const { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');

// Fórmula Matemática de Cassino para calcular o Multiplicador (com 5% de taxa da casa)
function getMultiplier(hits, total = 20, bombs = 3) {
    let m = 1.0;
    for (let i = 0; i < hits; i++) {
        m *= (total - i) / (total - bombs - i);
    }
    return m * 0.95; // 0.95 garante que a banca tenha ligeira vantagem a longo prazo
}

module.exports = {
    customIdPrefix: 'eco_mines_click_',

    async execute(interaction, client) {
        const parts = interaction.customId.replace('eco_mines_click_', '').split('_');
        const tileIndex = parseInt(parts[0]);
        const ownerId = parts[1];

        // Trava anti-roubo
        if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: '❌ Este campo minado não é teu!', flags: [MessageFlags.Ephemeral] });
        }

        // Verifica se o jogo ainda existe na memória
        const game = client.activeMines?.get(ownerId);
        if (!game) {
            return interaction.reply({ content: '❌ Este jogo já terminou ou expirou.', flags: [MessageFlags.Ephemeral] });
        }

        // Evita duplo clique rápido no mesmo botão
        if (game.clicked.includes(tileIndex)) return interaction.deferUpdate();
        game.clicked.push(tileIndex);

        const isBomb = game.grid[tileIndex] === 'bomb';

        // ==========================================
        // 💥 SE FOR UMA BOMBA (PERDEU TUDO)
        // ==========================================
        if (isBomb) {
            client.activeMines.delete(ownerId); // Apaga o jogo da memória

            const loseHeader = new TextDisplayBuilder().setContent(`# 💥 BOOM!\n<@${ownerId}> pisou numa mina e perdeu **${game.bet} HC**!`);
            const finalContainer = new ContainerBuilder()
                .setAccentColor(0xED4245) // Vermelho Explosão
                .addTextDisplayComponents(loseHeader);

            // Reconstrói a grelha revelando TUDO
            const rows = [];
            for (let r = 0; r < 4; r++) {
                const row = new ActionRowBuilder();
                for (let c = 0; c < 5; c++) {
                    const idx = r * 5 + c;
                    let style = ButtonStyle.Secondary;
                    let emoji = '💎'; // Mostra onde estavam os diamantes que ele perdeu

                    if (game.grid[idx] === 'bomb') {
                        emoji = idx === tileIndex ? '💥' : '💣'; // Mostra a bomba que o matou (💥) e as outras (💣)
                        style = idx === tileIndex ? ButtonStyle.Danger : ButtonStyle.Secondary;
                    } else if (game.clicked.includes(idx)) {
                        style = ButtonStyle.Success; // Os que ele já tinha acertado antes
                    }

                    row.addComponents(new ButtonBuilder().setCustomId(`dead_${idx}`).setStyle(style).setEmoji(emoji).setDisabled(true));
                }
                rows.push(row);
            }

            return interaction.update({ components: [finalContainer, ...rows], flags: [MessageFlags.IsComponentsV2] });
        }

        // ==========================================
        // 💎 SE FOR UM DIAMANTE (CONTINUA)
        // ==========================================
        game.hits += 1;
        const currentMultiplier = getMultiplier(game.hits);
        const currentProfit = Math.floor(game.bet * currentMultiplier);

        // 👇 A CORREÇÃO ESTÁ AQUI: slice(1, 5) para pular o Container e pegar só os botões!
        const rows = interaction.message.components.slice(1, 5).map(oldRow => {
            const row = new ActionRowBuilder();
            oldRow.components.forEach(oldBtn => {
                // Trava de segurança para garantir que lê o ID corretamente
                const customId = oldBtn.customId || oldBtn.data?.custom_id;
                if (!customId) return;

                const idx = parseInt(customId.split('_')[3]);
                if (idx === tileIndex) {
                    // O botão que ele clicou agora fica verde com diamante!
                    row.addComponents(new ButtonBuilder().setCustomId(customId).setStyle(ButtonStyle.Success).setEmoji('💎').setDisabled(true));
                } else {
                    row.addComponents(ButtonBuilder.from(oldBtn)); // Mantém os outros iguais
                }
            });
            return row;
        });

        // Atualiza a Linha de Baixo (Botão de Sacar)
        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`eco_mines_cashout_${ownerId}`)
                .setLabel(`💰 Sacar ${currentProfit} HC (x${currentMultiplier.toFixed(2)})`)
                .setStyle(ButtonStyle.Success)
                .setDisabled(false) // Ativa o botão porque ele já acertou uma!
        );
        rows.push(actionRow);

        const stats = new TextDisplayBuilder().setContent(`**Aposta:** ${game.bet} HC\n**Multiplicador:** ${currentMultiplier.toFixed(2)}x\n**Lucro Acumulado:** +${currentProfit - game.bet} HC`);
        
        const container = new ContainerBuilder()
            .setAccentColor(0x57F287) // Fica verde avisando que ele tá a lucrar
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# 💣 MINES HYPE\nO campo minado de <@${ownerId}> está tenso!`))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(stats);

        await interaction.update({ components: [container, ...rows], flags: [MessageFlags.IsComponentsV2] });
    }
};