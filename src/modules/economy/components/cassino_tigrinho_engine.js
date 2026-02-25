const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

const SYMBOLS = ['🍊', '🍉', '🍇', '🔔', '💎', '🐅']; 

const PAYTABLE = {
    '🍊': 1.5,
    '🍉': 2.0,
    '🍇': 3.0,
    '🔔': 5.0,
    '💎': 10.0,
    '🐅': 50.0  // Bónus Supremo
};

function generateLine(forceWin = false) {
    if (forceWin) {
        // Mais probabilidade de calhar fruta, o Tigre é super raro
        const winSymbols = ['🍊', '🍊', '🍊', '🍊', '🍉', '🍉', '🍉', '🍇', '🍇', '🔔', '💎', '🐅'];
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
    async run(interaction, client, betAmount, newBalance) {
        const channel = interaction.channel;
        const user = interaction.user;

        // ==========================================
        // 1. ECRÃ INICIAL DA MÁQUINA (V2)
        // ==========================================
        const initialHeader = new TextDisplayBuilder()
            .setContent(`# 🎰 TIGRINHO HYPE\nAposta: **${betAmount} HC**\n<@${user.id}> está a girar...`);

        const initialGrid = new TextDisplayBuilder()
            .setContent(`> ⬜ ⬜ ⬜\n> ⬜ ⬜ ⬜\n> ⬜ ⬜ ⬜`);

        const container = new ContainerBuilder()
            .setAccentColor(0xFEE75C) // Amarelo Dourado
            .addTextDisplayComponents(initialHeader)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(initialGrid);

        const gameMessage = await channel.send({ 
            components: [container], 
            flags: [MessageFlags.IsComponentsV2] 
        });

        // ==========================================
        // 2. SISTEMA DE SORTE E SPIN ANIMADO
        // ==========================================
        const isLucky = Math.random() < 0.35; // 35% Win Rate
        const luckyRowIndex = Math.floor(Math.random() * 3); 

        let finalGrid = [];
        for (let i = 0; i < 4; i++) {
            await new Promise(r => setTimeout(r, 650)); 
            
            finalGrid = [
                generateLine(i === 3 && isLucky && luckyRowIndex === 0),
                generateLine(i === 3 && isLucky && luckyRowIndex === 1),
                generateLine(i === 3 && isLucky && luckyRowIndex === 2)
            ];
            
            // Formata o grid visualmente limpo com espaçamentos (sem barras coladas)
            const spinDisplay = finalGrid.map(row => `> ${row[0]}   ${row[1]}   ${row[2]}`).join('\n');
            
            const spinContainer = new ContainerBuilder()
                .setAccentColor(0xFEE75C)
                .addTextDisplayComponents(initialHeader)
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(spinDisplay));

            await gameMessage.edit({ components: [spinContainer], flags: [MessageFlags.IsComponentsV2] }).catch(() => {});
        }

        // ==========================================
        // 3. CÁLCULO DE PAGAMENTOS
        // ==========================================
        let totalMultiplier = 0;
        let winningLines = [];
        let hitTigerBonus = false;

        finalGrid.forEach((row, index) => {
            if (row[0] === row[1] && row[1] === row[2]) {
                const symbol = row[0];
                totalMultiplier += PAYTABLE[symbol];
                
                if (symbol === '🐅') hitTigerBonus = true;

                winningLines.push(`**Linha ${index + 1}**: ${symbol} (x${PAYTABLE[symbol]})`);
            }
        });

        // ==========================================
        // 4. ECRÃ DE RESULTADO FINAL (V2)
        // ==========================================
        const wonAmount = Math.floor(betAmount * totalMultiplier);
        let headerContent = '';
        let color = 0x2b2d31; 

        if (totalMultiplier > 0) {
            // Pagamento!
            await prisma.hypeUser.update({
                where: { id: user.id },
                data: { hypeCash: { increment: wonAmount } }
            });
            newBalance += wonAmount;

            if (hitTigerBonus) {
                // EFEITO ESPECIAL: CARTA DO TIGRE
                color = 0xFFD700; // Dourado Puro
                headerContent = `# 🐅 CARTA DOURADA!\nO Tigre lançou a carta da sorte para <@${user.id}>!\n\n**Prémio Máximo (x50) Atingido!**`;
            } else {
                // VITÓRIA NORMAL
                color = 0x57F287; // Verde Dinheiro
                let megaWinText = totalMultiplier >= 10 ? '🔥 **MEGA GANHO!** 🔥\n' : '';
                headerContent = `# 🎉 GRANDE VITÓRIA\n${megaWinText}<@${user.id}> acertou e lucrou!`;
            }
        } else {
            // DERROTA
            color = 0xED4245; // Vermelho Sangue
            headerContent = `# 💀 NÃO DEU...\nO Tigre engoliu as moedas de <@${user.id}>.`;
        }

        const finalHeader = new TextDisplayBuilder().setContent(headerContent);
        
        // Grid Formatado
        const finalDisplay = finalGrid.map(row => `> ${row[0]}   ${row[1]}   ${row[2]}`).join('\n');
        const gridText = new TextDisplayBuilder().setContent(finalDisplay);

        // Recibo de Transação
        let receiptText = '';
        if (totalMultiplier > 0) {
            receiptText = `## 💸 Recibo de Pagamento\n${winningLines.join('\n')}\n**Aposta:** ${betAmount} HC\n**Ganhou:** 💰 +${wonAmount} HC`;
        } else {
            receiptText = `## 💸 Recibo de Perda\n**Aposta:** ${betAmount} HC\n**Perdeu:** 💸 -${betAmount} HC`;
        }
        
        const receiptDisplay = new TextDisplayBuilder().setContent(`${receiptText}\n*Saldo Atual: ${newBalance} HC*`);

        // Constrói a Caixa Final
        const finalContainer = new ContainerBuilder()
            .setAccentColor(color)
            .addTextDisplayComponents(finalHeader)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(gridText)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(receiptDisplay);

        // Botões
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`eco_tigrinho_replay_${betAmount}_${user.id}`)
                .setLabel('Girar Novamente')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🔄'),
            new ButtonBuilder()
                .setCustomId(`eco_tigrinho_changebet_${user.id}`)
                .setLabel('Mudar Valor')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('💰')
        );

        await gameMessage.edit({ 
            components: [finalContainer, row], 
            flags: [MessageFlags.IsComponentsV2] 
        }).catch(() => {});
    }
};