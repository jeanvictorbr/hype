const { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { generateBlackjackTable, getHandScore } = require('../../../utils/canvasBlackjack');

module.exports = {
    customIdPrefix: 'eco_bj_hit_',

    async execute(interaction, client) {
        const ownerId = interaction.customId.replace('eco_bj_hit_', '');

        if (interaction.user.id !== ownerId) return interaction.reply({ content: '❌ Esta mesa não é tua!', flags: [MessageFlags.Ephemeral] });

        const game = client.activeBlackjack?.get(ownerId);
        if (!game) return interaction.reply({ content: '❌ O jogo já terminou ou expirou.', flags: [MessageFlags.Ephemeral] });

        await interaction.deferUpdate();

        const newCard = game.deck.pop();
        game.playerHand.push(newCard);
        const playerScore = getHandScore(game.playerHand);

        const isBusted = playerScore > 21;
        let gameState = 'playing';

        if (isBusted) {
            gameState = 'busted';
            client.activeBlackjack.delete(ownerId);
        }

        const imageBuffer = await generateBlackjackTable(interaction.user, game.bet, game.playerHand, game.dealerHand, gameState, 0);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'blackjack.png' });

        if (isBusted) {
            return interaction.editReply({ content: `<@${ownerId}>`, embeds: [], components: [], files: [attachment], attachments: [] });
        }

        const is21 = playerScore === 21;
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`eco_bj_hit_${ownerId}`).setLabel('Pedir Carta').setStyle(ButtonStyle.Primary).setEmoji('🃏').setDisabled(is21),
            new ButtonBuilder().setCustomId(`eco_bj_stand_${ownerId}`).setLabel('Parar Mão').setStyle(ButtonStyle.Success).setEmoji('✋')
        );

        await interaction.editReply({ content: `<@${ownerId}>`, embeds: [], components: [row], files: [attachment], attachments: [] });
    }
};