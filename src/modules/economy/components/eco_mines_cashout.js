const { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');
const { trackContract } = require('../../../utils/contratosTracker'); // Importa o rastreador central

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

        const finalMultiplier = getMultiplier(game.hits);
        const finalPrize = Math.floor(game.bet * finalMultiplier);

        // Paga o Jogador na CARTEIRA
        await prisma.hypeUser.update({
            where: { id: ownerId },
            data: { carteira: { increment: finalPrize } }
        });

        // 👇 RASTREADOR DO SINDICATO (Usando a função centralizada) 👇
        await trackContract(ownerId, 'win_mines', 1);

        // Limpa o jogo da memória
        client.activeMines.delete(ownerId);

        const winHeader = new TextDisplayBuilder().setContent(`# 🎉 RETIRADA SEGURA!\n<@${ownerId}> parou a tempo e garantiu o lucro!`);
        const receipt = new TextDisplayBuilder().setContent(`## 💸 Recibo do Mines\n**Aposta:** R$ ${game.bet.toLocaleString('pt-BR')}\n**Multiplicador Final:** ${finalMultiplier.toFixed(2)}x\n**Ganho Total:** 💰 +R$ ${finalPrize.toLocaleString('pt-BR')}`);
        
        const finalContainer = new ContainerBuilder()
            .setAccentColor(0x0059ff) // Azul Hype no recibo de vitória
            .addTextDisplayComponents(winHeader)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(receipt);

        const rows = [];
        for (let r = 0; r < 4; r++) {
            const row = new ActionRowBuilder();
            for (let c = 0; c < 5; c++) {
                const idx = r * 5 + c;
                let style = ButtonStyle.Secondary;
                let emoji = '🔲';

                // Se o jogador clicou e era diamante
                if (game.clicked.includes(idx)) {
                    style = ButtonStyle.Success;
                    emoji = '💎';
                } 
                // Se era uma bomba (revelada no final)
                else if (game.grid[idx] === 'bomb') {
                    style = ButtonStyle.Danger; 
                    emoji = '💣';
                } 
                // Se foi uma casa escaneada pela lanterna mas não clicada
                else if (game.scanned && game.scanned.includes(idx)) {
                    style = ButtonStyle.Primary; // Azul para indicar que a lanterna passou ali
                    emoji = game.grid[idx] === 'bomb' ? '⚠️' : '💎';
                }
                else {
                    emoji = '💎'; 
                    style = ButtonStyle.Secondary;
                }

                row.addComponents(new ButtonBuilder().setCustomId(`over_${idx}`).setStyle(style).setEmoji(emoji).setDisabled(true));
            }
            rows.push(row);
        }

        await interaction.update({ components: [finalContainer, ...rows], flags: [MessageFlags.IsComponentsV2] });
    }
};