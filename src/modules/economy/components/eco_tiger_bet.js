const { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');

// A MESMA TABELA do Motor!
const BET_TIERS = [10, 50, 100, 200, 300, 500, 1000, 2000, 5000, 10000, 50000, 100000, 250000, 500000, 1000000];

function getNextBet(current) {
    let idx = BET_TIERS.findIndex(b => b > current);
    return idx === -1 ? BET_TIERS[BET_TIERS.length - 1] : BET_TIERS[idx];
}

function getPrevBet(current) {
    let arr = [...BET_TIERS].reverse();
    let idx = arr.findIndex(b => b < current);
    return idx === -1 ? BET_TIERS[0] : arr[idx];
}

module.exports = {
    customIdPrefix: 'eco_tiger_bet_',

    async execute(interaction) {
        const parts = interaction.customId.replace('eco_tiger_bet_', '').split('_');
        const newBet = parseInt(parts[0]);
        const ownerId = parts[1];

        if (interaction.user.id !== ownerId) return interaction.reply({ content: '❌ Não toques na máquina dos outros!', flags: [MessageFlags.Ephemeral] });

        // Avisa a API que o clique foi recebido (evita o "A pensar...")
        await interaction.deferUpdate();

        // Calcula os botões futuros
        const decreaseBet = getPrevBet(newBet);
        const increaseBet = getNextBet(newBet);

        // Prepara a nova linha de botões com os valores atualizados
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`eco_tiger_bet_${decreaseBet}_${ownerId}`).setLabel('-').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`eco_tiger_spin_${newBet}_${ownerId}`).setLabel('GIRAR').setStyle(ButtonStyle.Success).setEmoji('🎰'),
            new ButtonBuilder().setCustomId(`eco_tiger_bet_${increaseBet}_${ownerId}`).setLabel('+').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`eco_tiger_auto_${newBet}_${ownerId}`).setLabel('AUTO').setStyle(ButtonStyle.Primary).setEmoji('🔄')
        );

        // ==========================================
        // RECONSTRUÇÃO VISUAL (O Reset Limpo da Máquina)
        // ==========================================
        const header = new TextDisplayBuilder()
            .setContent(`# 🎰 TIGRINHO HYPE\n🎰 **[ MODO MANUAL ]**\n**Nova Aposta:** R$ ${newBet.toLocaleString('pt-BR')}\n<@${ownerId}>, máquina ajustada e pronta!`);

        const grid = new TextDisplayBuilder()
            .setContent(`> ⬜ ⬜ ⬜\n> ⬜ ⬜ ⬜\n> ⬜ ⬜ ⬜`);

        const container = new ContainerBuilder()
            .setAccentColor(0x3498db) // Cor Azul para indicar que a aposta foi atualizada
            .addTextDisplayComponents(header)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(grid);

        // Edita instantaneamente a mensagem atual
        await interaction.message.edit({ components: [container, row], flags: [MessageFlags.IsComponentsV2] }).catch(() => {});
    }
};