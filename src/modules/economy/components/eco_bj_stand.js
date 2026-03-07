const { MessageFlags, AttachmentBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateBlackjackTable, getHandScore } = require('../../../utils/canvasBlackjack');

module.exports = {
    customIdPrefix: 'eco_bj_stand_',

    async execute(interaction, client) {
        const ownerId = interaction.customId.replace('eco_bj_stand_', '');

        if (interaction.user.id !== ownerId) return interaction.reply({ content: '❌ Esta mesa não é tua!', flags: [MessageFlags.Ephemeral] });

        const game = client.activeBlackjack?.get(ownerId);
        if (!game) return interaction.reply({ content: '❌ O jogo já terminou ou expirou.', flags: [MessageFlags.Ephemeral] });

        await interaction.deferUpdate();

        let dealerScore = getHandScore(game.dealerHand);
        const playerScore = getHandScore(game.playerHand);

        // O Agiota compra cartas automáticas até ter 17 ou mais
        while (dealerScore < 17) {
            game.dealerHand.push(game.deck.pop());
            dealerScore = getHandScore(game.dealerHand);
        }

        client.activeBlackjack.delete(ownerId);

        let gameState = '';
        let finalPrize = 0;

        if (dealerScore > 21) {
            gameState = 'dealer_busted';
            finalPrize = game.bet * 2; 
        } else if (playerScore > dealerScore) {
            gameState = 'win';
            finalPrize = game.bet * 2;
        } else if (playerScore === dealerScore) {
            gameState = 'tie';
            finalPrize = game.bet; 
        } else {
            gameState = 'lose';
            finalPrize = 0;
        }

        // Paga apenas na CARTEIRA (sem sistema de extrato)
        if (finalPrize > 0) {
            await prisma.hypeUser.update({
                where: { id: ownerId },
                data: { carteira: { increment: finalPrize } }
            });
        }

        // Gera a imagem final quadrada
        const imageBuffer = await generateBlackjackTable(interaction.user, game.bet, game.playerHand, game.dealerHand, gameState, finalPrize);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'blackjack.png' });

        await interaction.editReply({ content: `<@${ownerId}>`, embeds: [], components: [], files: [attachment], attachments: [] });
    }
};