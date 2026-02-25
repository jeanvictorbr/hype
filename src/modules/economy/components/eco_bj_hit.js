const { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, EmbedBuilder } = require('discord.js');
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
    customIdPrefix: 'eco_bj_hit_',

    async execute(interaction, client) {
        const ownerId = interaction.customId.replace('eco_bj_hit_', '');

        if (interaction.user.id !== ownerId) return interaction.reply({ content: '❌ Esta mesa não é tua!', flags: [MessageFlags.Ephemeral] });

        const game = client.activeBlackjack?.get(ownerId);
        if (!game) return interaction.reply({ content: '❌ O jogo já terminou ou expirou.', flags: [MessageFlags.Ephemeral] });

        await interaction.deferUpdate();

        const newCard = game.deck.pop();
        game.playerHand.push(newCard);
        const playerScore = calculateScore(game.playerHand);

        const isBusted = playerScore > 21;
        if (isBusted) client.activeBlackjack.delete(ownerId);

        const imageBuffer = await generateBlackjackTable(game.playerHand, game.dealerHand, isBusted);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'table.png' });

        // ==========================================
        // 💥 BUSTED (ESTOUROU)
        // ==========================================
        if (isBusted) {
            const embed = new EmbedBuilder()
                .setColor('#ED4245')
                .setTitle('💥 BUSTED! (ESTOUROU)')
                .setDescription(`**Jogador:** <@${ownerId}>\n**Perdeu:** 💸 -${game.bet} HC\n\nVocê passou de 21 e a banca engoliu as moedas!`)
                .setImage('attachment://table.png');

            // Attachments: [] limpa as fotos da rodada anterior para o Discord não acumular ficheiros
            return interaction.editReply({ embeds: [embed], components: [], files: [attachment], attachments: [] });
        }

        // ==========================================
        // 🃏 AINDA VIVO
        // ==========================================
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('🃏 BLACKJACK HYPE')
            .setDescription(`**Jogador:** <@${ownerId}>\n**Aposta:** ${game.bet} HC\n**Seus Pontos:** ${playerScore}`)
            .setImage('attachment://table.png');

        const is21 = playerScore === 21;
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`eco_bj_hit_${ownerId}`).setLabel('Pedir Carta').setStyle(ButtonStyle.Primary).setEmoji('🃏').setDisabled(is21),
            new ButtonBuilder().setCustomId(`eco_bj_stand_${ownerId}`).setLabel('Parar Mão').setStyle(ButtonStyle.Success).setEmoji('✋')
        );

        await interaction.editReply({ embeds: [embed], components: [row], files: [attachment], attachments: [] });
    }
};