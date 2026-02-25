const { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateBlackjackTable } = require('../../../utils/canvasBlackjack');

function calculateScore(hand) {
    let score = 0; let aces = 0;
    for (let card of hand) {
        if (['J', 'Q', 'K'].includes(card.value)) score += 10;
        else if (card.value === 'A') { score += 11; aces += 1; }
        else score += parseInt(card.value);
    }
    while (score > 21 && aces > 0) { score -= 10; aces -= 1; }
    return score;
}

module.exports = {
    customIdPrefix: 'eco_bj_stand_',

    async execute(interaction, client) {
        const ownerId = interaction.customId.replace('eco_bj_stand_', '');

        if (interaction.user.id !== ownerId) return interaction.reply({ content: '❌ Esta mesa não é tua!', flags: [MessageFlags.Ephemeral] });

        const game = client.activeBlackjack?.get(ownerId);
        if (!game) return interaction.reply({ content: '❌ O jogo já terminou ou expirou.', flags: [MessageFlags.Ephemeral] });

        await interaction.deferUpdate();

        let dealerScore = calculateScore(game.dealerHand);
        const playerScore = calculateScore(game.playerHand);

        // O Agiota tem de comprar até chegar a 17 ou mais
        while (dealerScore < 17) {
            game.dealerHand.push(game.deck.pop());
            dealerScore = calculateScore(game.dealerHand);
        }

        client.activeBlackjack.delete(ownerId);

        let resultMsg = '';
        let color = '#2b2d31';
        let finalPrize = 0;

        if (dealerScore > 21) {
            resultMsg = `**O Agiota estourou com ${dealerScore} pontos!**\nVocê ganhou!`;
            color = '#57F287'; // Verde
            finalPrize = game.bet * 2; 
        } else if (playerScore > dealerScore) {
            resultMsg = `**Você (${playerScore}) venceu o Agiota (${dealerScore})!**`;
            color = '#57F287';
            finalPrize = game.bet * 2;
        } else if (playerScore === dealerScore) {
            resultMsg = `**Empate! Ambos fizeram ${playerScore} pontos.**\nO dinheiro foi devolvido.`;
            color = '#FEE75C'; // Amarelo
            finalPrize = game.bet; 
        } else {
            resultMsg = `**O Agiota (${dealerScore}) venceu você (${playerScore}).**`;
            color = '#ED4245'; // Vermelho
            finalPrize = 0;
        }

        if (finalPrize > 0) {
            await prisma.hypeUser.update({
                where: { id: ownerId },
                data: { hypeCash: { increment: finalPrize } }
            });
        }

        const imageBuffer = await generateBlackjackTable(game.playerHand, game.dealerHand, true);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'table.png' });

        let receiptText = `**Aposta:** ${game.bet} HC\n`;
        if (finalPrize > game.bet) receiptText += `**Lucro:** 💰 +${finalPrize - game.bet} HC`;
        else if (finalPrize === game.bet) receiptText += `**Devolvido:** ${game.bet} HC`;
        else receiptText += `**Perdeu:** 💸 -${game.bet} HC`;

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle('🃏 FIM DE JOGO')
            .setDescription(`<@${ownerId}>\n\n${resultMsg}\n\n${receiptText}`)
            .setImage('attachment://table.png');

        await interaction.editReply({ embeds: [embed], components: [], files: [attachment], attachments: [] });
    }
};