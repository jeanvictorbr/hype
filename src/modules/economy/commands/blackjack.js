const { SlashCommandBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateBlackjackTable } = require('../../../utils/canvasBlackjack');

function createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];
    for (let s of suits) {
        for (let v of values) { deck.push({ suit: s, value: v }); }
    }
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

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
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('🃏 Jogue 21 contra o Agiota do servidor!')
        .addIntegerOption(option => 
            option.setName('aposta')
                .setDescription('Quantas HypeCoins quer apostar?')
                .setRequired(true)
                .setMinValue(10)
        ),

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const betAmount = interaction.options.getInteger('aposta');

        try {
            const dbGuild = await prisma.guild.findUnique({ where: { id: guildId } });
            if (!dbGuild || !dbGuild.features.includes('CASSINO')) return interaction.editReply('❌ Cassino desativado.');

            const userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            if (!userProfile || userProfile.hypeCash < betAmount) return interaction.editReply('❌ Saldo insuficiente.');

            await prisma.hypeUser.update({
                where: { id: userId },
                data: { hypeCash: { decrement: betAmount } }
            });

            let deck = createDeck();
            let playerHand = [deck.pop(), deck.pop()];
            let dealerHand = [deck.pop(), deck.pop()];

            if (!client.activeBlackjack) client.activeBlackjack = new Map();
            client.activeBlackjack.set(userId, { bet: betAmount, deck, playerHand, dealerHand });

            const playerScore = calculateScore(playerHand);

            // 🎨 GERA A IMAGEM EM CANVAS
            const imageBuffer = await generateBlackjackTable(playerHand, dealerHand, false);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'table.png' });

            // CRIA O EMBED NO MESMO ESTILO DO CARTÃO VIP
            const embed = new EmbedBuilder()
                .setColor('#2b2d31') // Fundo Invisível Dark
                .setTitle('🃏 BLACKJACK HYPE')
                .setDescription(`**Jogador:** <@${userId}>\n**Aposta:** R$ ${betAmount}\n**Seus Pontos:** ${playerScore}`)
                .setImage('attachment://table.png');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`eco_bj_hit_${userId}`).setLabel('Pedir Carta').setStyle(ButtonStyle.Primary).setEmoji('🃏'),
                new ButtonBuilder().setCustomId(`eco_bj_stand_${userId}`).setLabel('Parar Mão').setStyle(ButtonStyle.Success).setEmoji('✋')
            );

            // Envia para o público sem a flag problemática da V2
            await interaction.channel.send({ embeds: [embed], components: [row], files: [attachment] });
            await interaction.deleteReply();

        } catch (error) {
            console.error('Erro Blackjack:', error);
            await interaction.editReply('❌ Ocorreu um erro.');
        }
    }
};

module.exports.calculateScore = calculateScore;