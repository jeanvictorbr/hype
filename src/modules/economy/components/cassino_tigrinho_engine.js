const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');
const { trackContract } = require('../../../utils/contratosTracker');

const SYMBOLS = ['🪙', '💰', '🍀', '🧧', '🏮', '🐯']; 

const PAYTABLE = {
    '🪙': 1.5,
    '💰': 2.0,
    '🍀': 3.0,
    '🧧': 4.0,
    '🏮': 5.0,
    '🐯': 10.0  // Limitado a 10x
};

// 📈 TABELA PADRÃO DE APOSTAS (O máximo já era 1kk aqui)
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

function generateLine(forceWin = false) {
    if (forceWin) {
        // 👇 DIFICULDADE AUMENTADA: Mais moedas comuns, tornando o prêmio máximo raro
        const winSymbols = ['🪙', '🪙', '🪙', '🪙', '💰', '💰', '💰', '🍀', '🍀', '🧧', '🏮', '🐯'];
        const chosenSymbol = winSymbols[Math.floor(Math.random() * winSymbols.length)];
        return [chosenSymbol, chosenSymbol, chosenSymbol];
    }
    return [
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
    ];
}

module.exports = {
    async run(channel, user, client, betAmount, isAuto = false, gameMessage = null) {
        
        let userProfile = await prisma.hypeUser.findUnique({ where: { id: user.id } });
        let newBalance = userProfile.carteira;

        let modeText = isAuto ? '🔄 **[ MODO AUTO-SPIN ]**' : '🎰 **[ MODO MANUAL ]**';
        
        const initialHeader = new TextDisplayBuilder()
            .setContent(`# 🎰 TIGRINHO HYPE\n${modeText}\n**Aposta:** R$ ${betAmount.toLocaleString('pt-BR')}\n<@${user.id}> está a girar...`);

        const disabledRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('dummy1').setLabel('-').setStyle(ButtonStyle.Secondary).setDisabled(true),
            new ButtonBuilder().setCustomId('dummy2').setLabel('GIRAR').setStyle(ButtonStyle.Success).setDisabled(true),
            new ButtonBuilder().setCustomId('dummy3').setLabel('+').setStyle(ButtonStyle.Secondary).setDisabled(true),
            new ButtonBuilder().setCustomId('dummy4').setLabel('AUTO').setStyle(ButtonStyle.Primary).setDisabled(true)
        );

        if (!gameMessage) {
            const initGrid = new TextDisplayBuilder().setContent(`> ⬜ ⬜ ⬜\n> ⬜ ⬜ ⬜\n> ⬜ ⬜ ⬜`);
            const initContainer = new ContainerBuilder()
                .setAccentColor(0xFEE75C)
                .addTextDisplayComponents(initialHeader)
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(initGrid);
            
            gameMessage = await channel.send({ components: [initContainer, disabledRow], flags: [MessageFlags.IsComponentsV2] });
        }

        // 👇 DIFICULDADE AUMENTADA: Taxa de vitória forçada caiu de 35% para 18%
        const isLucky = Math.random() < 0.18; 
        const luckyRowIndex = Math.floor(Math.random() * 3); 

        let finalGrid = [];
        for (let i = 0; i < 3; i++) { 
            await new Promise(r => setTimeout(r, 600)); 
            
            finalGrid = [
                generateLine(i === 2 && isLucky && luckyRowIndex === 0),
                generateLine(i === 2 && isLucky && luckyRowIndex === 1),
                generateLine(i === 2 && isLucky && luckyRowIndex === 2)
            ];
            
            const spinDisplay = finalGrid.map(row => `> ${row[0]}   ${row[1]}   ${row[2]}`).join('\n');
            
            const spinContainer = new ContainerBuilder()
                .setAccentColor(0xFEE75C)
                .addTextDisplayComponents(initialHeader)
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(spinDisplay));

            await gameMessage.edit({ components: [spinContainer, disabledRow], flags: [MessageFlags.IsComponentsV2] }).catch(() => {});
        }

        let totalMultiplier = 0;
        let hitTigerBonus = false;

        finalGrid.forEach((row) => {
            if (row[0] === row[1] && row[1] === row[2]) {
                const symbol = row[0];
                totalMultiplier += PAYTABLE[symbol];
                if (symbol === '🐯') hitTigerBonus = true;
            }
        });

        const wonAmount = Math.floor(betAmount * totalMultiplier);
        let headerContent = '';
        let color = 0x2b2d31; 

        if (totalMultiplier > 0) {
            await prisma.hypeUser.update({
                where: { id: user.id },
                data: { carteira: { increment: wonAmount } }
            });
            await trackContract(autor.id, 'win_tiger', 1);
            newBalance += wonAmount;

            if (hitTigerBonus) {
                color = 0xFFD700;
                headerContent = `# 🐯 GRANDE TIGRE!\nLançou a carta máxima para <@${user.id}>!`;
            } else {
                color = 0x57F287;
                headerContent = `# 🎉 VITÓRIA\n<@${user.id}> acertou a linha!`;
            }
        } else {
            color = 0xED4245;
            headerContent = `# 💀 PERDEU...\nO Tigre engoliu as moedas.`;
        }

        const finalHeader = new TextDisplayBuilder().setContent(`${headerContent}\n${modeText}`);
        const finalDisplay = finalGrid.map(row => `> ${row[0]}   ${row[1]}   ${row[2]}`).join('\n');
        
        let receiptText = totalMultiplier > 0 
            ? `## 💸 Recibo\n**Aposta:** R$ ${betAmount.toLocaleString('pt-BR')}\n**Multiplicador:** x${totalMultiplier}\n**Ganhou:** 💰 +R$ ${wonAmount.toLocaleString('pt-BR')}`
            : `## 💸 Recibo\n**Aposta:** R$ ${betAmount.toLocaleString('pt-BR')}\n**Perdeu:** 💸 -R$ ${betAmount.toLocaleString('pt-BR')}`;
            
        const receiptDisplay = new TextDisplayBuilder().setContent(`${receiptText}\n*Carteira Atual: R$ ${newBalance.toLocaleString('pt-BR')}*`);

        const finalContainer = new ContainerBuilder()
            .setAccentColor(color)
            .addTextDisplayComponents(finalHeader)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(finalDisplay))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(receiptDisplay);

        const decreaseBet = getPrevBet(betAmount); 
        const increaseBet = getNextBet(betAmount);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`eco_tiger_bet_${decreaseBet}_${user.id}`)
                .setLabel('-')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(isAuto),
            new ButtonBuilder()
                .setCustomId(`eco_tiger_spin_${betAmount}_${user.id}`)
                .setLabel('GIRAR')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🎰')
                .setDisabled(isAuto),
            new ButtonBuilder()
                .setCustomId(`eco_tiger_bet_${increaseBet}_${user.id}`)
                .setLabel('+')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(isAuto),
            new ButtonBuilder()
                .setCustomId(`eco_tiger_auto_${betAmount}_${user.id}`)
                .setLabel(isAuto ? 'PARAR AUTO' : 'AUTO')
                .setStyle(isAuto ? ButtonStyle.Danger : ButtonStyle.Primary)
                .setEmoji('🔄')
        );

        await gameMessage.edit({ components: [finalContainer, row], flags: [MessageFlags.IsComponentsV2] }).catch(() => {});

        if (isAuto) {
            const checkUser = await prisma.hypeUser.findUnique({ where: { id: user.id } });
            const botMemoryAuto = client.activeTigers?.get(user.id);
            
            if (!checkUser || checkUser.carteira < betAmount || botMemoryAuto !== 'auto') {
                const stopContainer = new ContainerBuilder()
                    .setAccentColor(0xED4245)
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# 🛑 AUTO-SPIN PARADO\nO modo automático foi cancelado ou a carteira esvaziou!`));
                
                return gameMessage.edit({ components: [stopContainer, row], flags: [MessageFlags.IsComponentsV2] }).catch(() => {});
            }

            await prisma.hypeUser.update({
                where: { id: user.id },
                data: { carteira: { decrement: betAmount } }
            });

            await new Promise(r => setTimeout(r, 2000));
            return this.run(channel, user, client, betAmount, true, gameMessage);
        }
    }
};