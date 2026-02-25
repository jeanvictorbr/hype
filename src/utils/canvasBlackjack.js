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

    // 1. FUNDO (Pano Verde)
    const gradient = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width);
    gradient.addColorStop(0, '#1d5e33'); gradient.addColorStop(1, '#0b2614');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);

    // ==========================================
    // 👉 NOVO: MARCA D'ÁGUA (LOGO HYPE)
    // ==========================================
    try {
        const logoPath = path.join(__dirname, 'logo.png');
        const logo = await loadImage(logoPath);
        const logoW = 300; // Tamanho grande para o centro
        const logoH = logoW * (logo.height / logo.width);
        const logoX = (width - logoW) / 2;
        const logoY = (height - logoH) / 2 + 30; // Ligeiramente abaixo do centro

        ctx.save();
        ctx.globalAlpha = 0.12; // Muito transparente (efeito fantasma)
        // Modo de mistura para parecer impresso no tecido
        ctx.globalCompositeOperation = 'overlay'; 
        ctx.drawImage(logo, logoX, logoY, logoW, logoH);
        ctx.restore();
    } catch (e) {
        // Se não achar a logo, segue o jogo sem ela
    }
    // ==========================================

    // Linha curva da mesa
    ctx.beginPath(); ctx.arc(width/2, height + 400, 700, Math.PI, 0);
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; ctx.stroke();

    // Texto na mesa
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.font = 'bold 30px "Arial Black"'; ctx.textAlign = 'center';
    ctx.fillText('BLACKJACK HYPE', width/2, height/2 + 20);
    ctx.font = 'italic 16px Arial'; ctx.fillText('O Agiota paga 3 para 2', width/2, height/2 + 50);

    // 2. MÃO DO DEALER
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'left';
    ctx.fillText('Agiota', 50, 40);
    dealerHand.forEach((card, index) => {
        drawCard(ctx, card, 50 + (index * 40), 60, !isGameOver && index === 1);
    });

    // 3. MÃO DO JOGADOR
    ctx.fillStyle = '#ffffff'; ctx.fillText('Você', 50, height - 150);
    playerHand.forEach((card, index) => {
        drawCard(ctx, card, 50 + (index * 40), height - 135, false);
    });

    // ==========================================
    // 👉 NOVO: MOLDURA PREMIUM (Dourada)
    // ==========================================
    ctx.save();
    // Gradiente metálico dourado para a borda
    const borderGrad = ctx.createLinearGradient(0, 0, width, height);
    borderGrad.addColorStop(0, '#bf953f');
    borderGrad.addColorStop(0.25, '#fcf6ba');
    borderGrad.addColorStop(0.5, '#b38728');
    borderGrad.addColorStop(0.75, '#fbf5b7');
    borderGrad.addColorStop(1, '#aa771c');
    
    // Borda externa grossa
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 12; 
    // Desenhamos 6px para dentro para não cortar a borda
    ctx.strokeRect(6, 6, width - 12, height - 12);

    // Linha fina interna para detalhe de luxo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(14, 14, width - 28, height - 28);
    ctx.restore();
    // ==========================================

    return canvas.toBuffer('image/png');
}

module.exports = { generateBlackjackTable };