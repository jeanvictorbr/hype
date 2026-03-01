const { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');

function getMultiplier(hits, total = 20, bombs = 3) {
    let m = 1.0;
    for (let i = 0; i < hits; i++) {
        m *= (total - i) / (total - bombs - i);
    }
    return m * 0.95; 
}

module.exports = {
    customIdPrefix: 'eco_mines_click_',

    async execute(interaction, client) {
        const parts = interaction.customId.replace('eco_mines_click_', '').split('_');
        const tileIndex = parseInt(parts[0]);
        const ownerId = parts[1];

        if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: '❌ Este campo minado não é teu!', flags: [MessageFlags.Ephemeral] });
        }

        const game = client.activeMines?.get(ownerId);
        if (!game) {
            return interaction.reply({ content: '❌ Este jogo já terminou ou expirou.', flags: [MessageFlags.Ephemeral] });
        }

        if (game.clicked.includes(tileIndex)) return interaction.deferUpdate();
        game.clicked.push(tileIndex);

        const isBomb = game.grid[tileIndex] === 'bomb';

        // 💥 SE FOR UMA BOMBA
        if (isBomb) {
            client.activeMines.delete(ownerId); 

            const loseHeader = new TextDisplayBuilder().setContent(`# 💥 BOOM!\n<@${ownerId}> pisou numa mina e perdeu **R$ ${game.bet.toLocaleString('pt-BR')}**!`);
            const finalContainer = new ContainerBuilder()
                .setAccentColor(0xED4245) 
                .addTextDisplayComponents(loseHeader);

            const rows = [];
            for (let r = 0; r < 4; r++) {
                const row = new ActionRowBuilder();
                for (let c = 0; c < 5; c++) {
                    const idx = r * 5 + c;
                    let style = ButtonStyle.Secondary;
                    let emoji = '💎'; 

                    if (game.grid[idx] === 'bomb') {
                        emoji = idx === tileIndex ? '💥' : '💣'; 
                        style = idx === tileIndex ? ButtonStyle.Danger : ButtonStyle.Secondary;
                    } else if (game.clicked.includes(idx)) {
                        style = ButtonStyle.Success; 
                    }

                    row.addComponents(new ButtonBuilder().setCustomId(`dead_${idx}`).setStyle(style).setEmoji(emoji).setDisabled(true));
                }
                rows.push(row);
            }

            return interaction.update({ components: [finalContainer, ...rows], flags: [MessageFlags.IsComponentsV2] });
        }

        // 💎 SE FOR UM DIAMANTE
        game.hits += 1;
        const currentMultiplier = getMultiplier(game.hits);
        const currentProfit = Math.floor(game.bet * currentMultiplier);

        const rows = interaction.message.components.slice(1, 5).map(oldRow => {
            const row = new ActionRowBuilder();
            oldRow.components.forEach(oldBtn => {
                const customId = oldBtn.customId || oldBtn.data?.custom_id;
                if (!customId) return;

                const idx = parseInt(customId.split('_')[3]);
                if (idx === tileIndex) {
                    row.addComponents(new ButtonBuilder().setCustomId(customId).setStyle(ButtonStyle.Success).setEmoji('💎').setDisabled(true));
                } else {
                    row.addComponents(ButtonBuilder.from(oldBtn)); 
                }
            });
            return row;
        });

        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`eco_mines_cashout_${ownerId}`)
                .setLabel(`💰 Sacar R$ ${currentProfit.toLocaleString('pt-BR')} (x${currentMultiplier.toFixed(2)})`)
                .setStyle(ButtonStyle.Success)
                .setDisabled(false) 
        );
        rows.push(actionRow);

        const stats = new TextDisplayBuilder().setContent(`**Aposta:** R$ ${game.bet.toLocaleString('pt-BR')}\n**Multiplicador:** ${currentMultiplier.toFixed(2)}x\n**Lucro Acumulado:** +R$ ${(currentProfit - game.bet).toLocaleString('pt-BR')}`);
        
        const container = new ContainerBuilder()
            .setAccentColor(0x57F287) 
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# 💣 MINES HYPE\nO campo minado de <@${ownerId}> está tenso!`))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(stats);

        await interaction.update({ components: [container, ...rows], flags: [MessageFlags.IsComponentsV2] });
    }
};