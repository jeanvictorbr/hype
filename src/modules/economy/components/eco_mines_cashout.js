const { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');

// Mesma fórmula do outro ficheiro
function getMultiplier(hits, total = 20, bombs = 3) {
    let m = 1.0;
    for (let i = 0; i < hits; i++) m *= (total - i) / (total - bombs - i);
    return m * 0.95;
}

module.exports = {
    customIdPrefix: 'eco_mines_cashout_',

    async execute(interaction, client) {
        const ownerId = interaction.customId.replace('eco_mines_cashout_', '');

        if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: '❌ Não podes sacar o lucro de outra pessoa!', flags: [MessageFlags.Ephemeral] });
        }

        const game = client.activeMines?.get(ownerId);
        if (!game) return interaction.reply({ content: '❌ Jogo expirado.', flags: [MessageFlags.Ephemeral] });

        // Calcula Prémio
        const finalMultiplier = getMultiplier(game.hits);
        const finalPrize = Math.floor(game.bet * finalMultiplier);

        // Paga o Jogador
        await prisma.hypeUser.update({
            where: { id: ownerId },
            data: { hypeCash: { increment: finalPrize } }
        });

        // Apaga o jogo
        client.activeMines.delete(ownerId);

        // Constrói o Ecrã de Vitória
        const winHeader = new TextDisplayBuilder().setContent(`# 🎉 RETIRADA SEGURA!\n<@${ownerId}> parou a tempo e garantiu o lucro!`);
        const receipt = new TextDisplayBuilder().setContent(`## 💸 Recibo do Mines\n**Aposta:** ${game.bet} HC\n**Multiplicador Final:** ${finalMultiplier.toFixed(2)}x\n**Ganho Total:** 💰 +${finalPrize} HC`);
        
        const finalContainer = new ContainerBuilder()
            .setAccentColor(0xFEE75C) // Amarelo Ouro
            .addTextDisplayComponents(winHeader)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(receipt);

        // Revela as bombas que ele conseguiu desviar
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
                } else if (game.grid[idx] === 'bomb') {
                    style = ButtonStyle.Danger; // Mostra onde estavam as bombas!
                    emoji = '💣';
                } else {
                    emoji = '💎'; // Mostra os diamantes que ele não clicou
                    style = ButtonStyle.Secondary;
                }

                row.addComponents(new ButtonBuilder().setCustomId(`over_${idx}`).setStyle(style).setEmoji(emoji).setDisabled(true));
            }
            rows.push(row);
        }

        await interaction.update({ components: [finalContainer, ...rows], flags: [MessageFlags.IsComponentsV2] });
    }
};