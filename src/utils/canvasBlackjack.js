const { createCanvas, loadImage } = require('canvas');
const path = require('path');

// Função auxiliar para desenhar cantos arredondados
function drawRoundRect(ctx, x, y, w, h, radius) {
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius); ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
}

// ==========================================
// 👉 NOVA FUNÇÃO: CALCULAR PONTOS NA IMAGEM
// ==========================================
function getHandScore(hand, isHiddenDealer = false) {
    let score = 0; let aces = 0;
    // Se for o agiota e o jogo não acabou, só soma a 1ª carta (visível)
    const visibleHand = isHiddenDealer ? [hand[0]] : hand;

    for (let card of visibleHand) {
        if (['J', 'Q', 'K'].includes(card.value)) score += 10;
        else if (card.value === 'A') { score += 11; aces += 1; }
        else score += parseInt(card.value);
    }
    while (score > 21 && aces > 0) { score -= 10; aces -= 1; }
    return score;
}

/**
 * Desenha a Etiqueta Didática com os Pontos
 */
function drawScoreBadge(ctx, x, y, name, scoreStr) {
    ctx.save();
    // Texto do Nome
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(name, x, y);

    const nameW = ctx.measureText(name).width;
    
    // Etiqueta de Pontos
    ctx.font = 'bold 16px "Arial Black"';
    const text = ` ${scoreStr} PONTOS `;
    const textW = ctx.measureText(text).width;

    const bx = x + nameW + 15;
    const by = y - 18;
    const bw = textW + 10;
    const bh = 24;

    // Fundo da etiqueta escuro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    drawRoundRect(ctx, bx, by, bw, bh, 6);
    ctx.fill();

    // Borda Amarela
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Texto dos Pontos
    ctx.fillStyle = '#facc15';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + bw / 2, by + bh / 2);

    ctx.restore();
}

/**
 * Desenha uma única carta
 */
function drawCard(ctx, card, x, y, isHidden = false) {
    const cardW = 90; const cardH = 130;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
    ctx.fillStyle = isHidden ? '#8c1c13' : '#ffffff'; 
    drawRoundRect(ctx, x, y, cardW, cardH, 8); ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.lineWidth = 2;
    ctx.strokeStyle = isHidden ? '#590d08' : '#e0e0e0'; ctx.stroke();

    if (isHidden) {
        ctx.strokeStyle = '#a6241a'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x + 10, y + 10); ctx.lineTo(x + cardW - 10, y + cardH - 10);
        ctx.moveTo(x + cardW - 10, y + 10); ctx.lineTo(x + 10, y + cardH - 10); ctx.stroke();
        ctx.fillStyle = '#f2d49b'; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center';
        ctx.fillText('HYPE', x + cardW / 2, y + cardH / 2 + 8);
    } else {
        const isRed = card.suit === '♥' || card.suit === '♦';
        ctx.fillStyle = isRed ? '#d32f2f' : '#212121';
        ctx.font = 'bold 26px Arial'; ctx.textAlign = 'left'; ctx.fillText(card.value, x + 8, y + 28);
        ctx.font = '20px Arial'; ctx.fillText(card.suit, x + 10, y + 50);
        ctx.save(); ctx.translate(x + cardW - 8, y + cardH - 8); ctx.rotate(Math.PI);
        ctx.font = 'bold 26px Arial'; ctx.fillText(card.value, 0, 0);
        ctx.font = '20px Arial'; ctx.fillText(card.suit, -2, 22); ctx.restore();
        ctx.font = '60px Arial'; ctx.textAlign = 'center'; ctx.globalAlpha = 0.8;
        ctx.fillText(card.suit, x + cardW / 2, y + cardH / 2 + 20);
    }
    ctx.restore();
}

/**
 * Gera a mesa de Blackjack completa
 */
async function generateBlackjackTable(playerHand, dealerHand, isGameOver = false) {
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. FUNDO (Pano Verde de Cassino)
    const gradient = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width);
    gradient.addColorStop(0, '#1d5e33'); gradient.addColorStop(1, '#0b2614');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);

    // MARCA D'ÁGUA (LOGO HYPE)
    try {
        const logoPath = path.join(__dirname, 'logo.png');
        const logo = await loadImage(logoPath);
        const logoW = 300; 
        const logoH = logoW * (logo.height / logo.width);
        const logoX = (width - logoW) / 2;
        const logoY = (height - logoH) / 2 + 30; 

        ctx.save();
        ctx.globalAlpha = 0.12; 
        ctx.globalCompositeOperation = 'overlay'; 
        ctx.drawImage(logo, logoX, logoY, logoW, logoH);
        ctx.restore();
    } catch (e) {}

    // Linha curva da mesa
    ctx.beginPath(); ctx.arc(width/2, height + 400, 700, Math.PI, 0);
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.stroke();

    // Texto na mesa
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.font = 'bold 30px "Arial Black"'; ctx.textAlign = 'center';
    ctx.fillText('BLACKJACK HYPE', width/2, height/2 + 20);
    ctx.font = 'italic 16px Arial'; ctx.fillText('O Agiota bate aos 17', width/2, height/2 + 50);

    // ==========================================
    // 2. MÃO DO DEALER (AGIOTA)
    // ==========================================
    const isHiddenDealer = !isGameOver;
    const dealerScore = getHandScore(dealerHand, isHiddenDealer);
    let dScoreStr = dealerScore.toString();
    if (isHiddenDealer) dScoreStr += ' + ?'; // Suspense da carta escondida!

    drawScoreBadge(ctx, 50, 45, 'Mão do Agiota', dScoreStr);

    dealerHand.forEach((card, index) => {
        drawCard(ctx, card, 50 + (index * 40), 60, isHiddenDealer && index === 1);
    });

    // ==========================================
    // 3. MÃO DO JOGADOR
    // ==========================================
    const playerScore = getHandScore(playerHand, false);
    drawScoreBadge(ctx, 50, height - 150, 'Sua Mão', playerScore.toString());

    playerHand.forEach((card, index) => {
        drawCard(ctx, card, 50 + (index * 40), height - 135, false);
    });

    // ==========================================
    // 4. MOLDURA PREMIUM (Dourada)
    // ==========================================
    ctx.save();
    const borderGrad = ctx.createLinearGradient(0, 0, width, height);
    borderGrad.addColorStop(0, '#bf953f');
    borderGrad.addColorStop(0.25, '#fcf6ba');
    borderGrad.addColorStop(0.5, '#b38728');
    borderGrad.addColorStop(0.75, '#fbf5b7');
    borderGrad.addColorStop(1, '#aa771c');
    
    ctx.strokeStyle = borderGrad; ctx.lineWidth = 12; 
    ctx.strokeRect(6, 6, width - 12, height - 12);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.lineWidth = 1;
    ctx.strokeRect(14, 14, width - 28, height - 28);
    ctx.restore();

    return canvas.toBuffer('image/png');
}

module.exports = { generateBlackjackTable };