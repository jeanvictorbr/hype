const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

// Tenta registar a fonte premium
try { registerFont(path.join(__dirname, 'Inter-Variable.ttf'), { family: 'InterCustom' }); } catch (e) {}

// Converte HEX para RGBA
function hexToRgba(hex, alpha) {
    hex = hex.replace('#', '');
    let r = 0, g = 0, b = 0;
    if (hex.length === 6) {
        r = parseInt(hex.substring(0,2), 16); g = parseInt(hex.substring(2,4), 16); b = parseInt(hex.substring(4,6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawRoundRect(ctx, x, y, w, h, radius) {
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius); ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
}

// DESENHA ÍCONES VETORIAIS
function drawVectorIcon(ctx, type, x, y, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.translate(x, y);

    if (type === 'hat') { // Ícone do Agiota
        ctx.beginPath(); ctx.moveTo(5, 18); ctx.lineTo(19, 18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(12, 18); ctx.lineTo(12, 12); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(12, 12); ctx.lineTo(7, 12); ctx.lineTo(7, 18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(12, 12); ctx.lineTo(17, 12); ctx.lineTo(17, 18); ctx.stroke();
        drawRoundRect(ctx, 8.5, 9, 7, 3, 2); ctx.fill(); 
    } else if (type === 'crown') { // Ícone de Vitória do Jogador
        ctx.beginPath(); ctx.moveTo(4, 18); ctx.lineTo(20, 18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, 18); ctx.lineTo(2, 6); ctx.lineTo(8, 12); ctx.lineTo(12, 4); ctx.lineTo(16, 12); ctx.lineTo(22, 6); ctx.lineTo(20, 18); ctx.stroke();
    } else if (type === 'user') { // Ícone Padrão do Jogador
        ctx.beginPath(); ctx.arc(12, 7, 5, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, 20); ctx.quadraticCurveTo(12, 12, 20, 20); ctx.stroke();
    } else if (type === 'moneybag') { // Ícone de Lucro
        ctx.beginPath(); ctx.moveTo(12, 4); ctx.lineTo(16, 8); ctx.lineTo(16, 16); ctx.quadraticCurveTo(12, 20, 8, 16); ctx.lineTo(8, 8); ctx.closePath(); ctx.stroke();
        ctx.fillStyle = color; ctx.font = '900 11px Arial'; ctx.textAlign = 'center'; ctx.fillText('$', 12.5, 15);
    } else if (type === 'info') { // Ícone de Informação (Tutorial)
        ctx.beginPath(); ctx.arc(12, 12, 10, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(12, 16); ctx.lineTo(12, 10); ctx.stroke();
        ctx.beginPath(); ctx.arc(12, 6, 1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
}

function getHandScore(hand, isHiddenDealer = false) {
    let score = 0; let aces = 0;
    const visibleHand = isHiddenDealer ? [hand[0]] : hand;

    for (let card of visibleHand) {
        if (['J', 'Q', 'K'].includes(card.value)) score += 10;
        else if (card.value === 'A') { score += 11; aces += 1; }
        else score += parseInt(card.value);
    }
    while (score > 21 && aces > 0) { score -= 10; aces -= 1; }
    return score;
}

function drawScoreBadge(ctx, x, y, iconType, name, scoreStr, themeColor) {
    ctx.save();
    
    drawVectorIcon(ctx, iconType, x, y - 20, themeColor);

    ctx.font = 'bold 22px "InterCustom", Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(name, x + 30, y);

    const nameW = ctx.measureText(name).width;
    
    ctx.font = '900 16px "Arial Black"';
    const text = ` ${scoreStr} PONTOS `;
    const textW = ctx.measureText(text).width;

    const bx = x + nameW + 15 + 30;
    const by = y - 18;
    const bw = textW + 10;
    const bh = 26;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    drawRoundRect(ctx, bx, by, bw, bh, 6);
    ctx.fill();

    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = themeColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + bw / 2, by + bh / 2);

    ctx.restore();
}

function drawCard(ctx, card, x, y, isHidden = false) {
    const cardW = 100; const cardH = 145; 
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 4;
    ctx.fillStyle = isHidden ? '#590d08' : '#ffffff'; 
    drawRoundRect(ctx, x, y, cardW, cardH, 10); ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.lineWidth = 1.5;
    ctx.strokeStyle = isHidden ? '#ef4444' : '#cccccc'; ctx.stroke();

    if (isHidden) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.1)'; 
        ctx.font = 'bold 100px Arial'; ctx.textAlign = 'center';
        ctx.fillText('?', x + cardW / 2, y + cardH / 2 + 35);

        ctx.fillStyle = '#ef4444';
        ctx.font = '900 18px "Arial Black", Arial'; ctx.textAlign = 'center';
        ctx.fillText('CARTA', x + cardW / 2, y + cardH / 2 - 10);
        ctx.fillText('OCULTA', x + cardW / 2, y + cardH / 2 + 15);
    } else {
        const isRed = card.suit === '♥' || card.suit === '♦';
        ctx.fillStyle = isRed ? '#ef4444' : '#111111';
        ctx.font = '900 28px Arial'; ctx.textAlign = 'left'; ctx.fillText(card.value, x + 10, y + 32);
        ctx.font = '22px Arial'; ctx.fillText(card.suit, x + 12, y + 56);
        
        ctx.save(); ctx.translate(x + cardW - 10, y + cardH - 10); ctx.rotate(Math.PI);
        ctx.font = '900 28px Arial'; ctx.fillText(card.value, 0, 0);
        ctx.font = '22px Arial'; ctx.fillText(card.suit, -2, 24); ctx.restore();
        
        ctx.font = '60px Arial'; ctx.textAlign = 'center'; ctx.globalAlpha = 0.8;
        ctx.fillText(card.suit, x + cardW / 2, y + cardH / 2 + 22);
    }
    ctx.restore();
}

async function generateBlackjackTable(userDiscord, bet, playerHand, dealerHand, gameState = 'playing', finalPrize = 0) {
    // 📏 ALTURA AUMENTADA PARA 800PX PARA CABER O TUTORIAL PERFEITAMENTE
    const width = 850; const height = 800; 
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // CORES E TEXTOS
    let themeColorHex = '#3b82f6'; // Azul = Jogando
    let statusText = 'SUA VEZ DE JOGAR';
    let subStatusText = 'Escolha uma ação abaixo: Pedir Carta ou Parar.';
    let prizeStatusText = '';

    if (gameState === 'busted') {
        themeColorHex = '#ef4444'; statusText = 'VOCÊ ESTOUROU!';
        subStatusText = 'A sua pontuação passou de 21. Você perdeu a aposta.';
        prizeStatusText = `- R$ ${bet.toLocaleString('pt-BR')}`;
    } else if (gameState === 'dealer_busted') {
        themeColorHex = '#57F287'; statusText = 'O AGIOTA ESTOUROU!';
        subStatusText = 'O Agiota comprou cartas demais e passou de 21. Você venceu!';
        prizeStatusText = `+ R$ ${(finalPrize - bet).toLocaleString('pt-BR')} (LUCRO)`;
    } else if (gameState === 'win') {
        themeColorHex = '#57F287'; statusText = 'VOCÊ VENCEU O AGIOTA!';
        subStatusText = 'A sua pontuação foi maior que a da banca.';
        prizeStatusText = `+ R$ ${(finalPrize - bet).toLocaleString('pt-BR')} (LUCRO)`;
    } else if (gameState === 'lose') {
        themeColorHex = '#ef4444'; statusText = 'O AGIOTA VENCEU!';
        subStatusText = 'A pontuação do Agiota foi maior que a sua. Você perdeu.';
        prizeStatusText = `- R$ ${bet.toLocaleString('pt-BR')}`;
    } else if (gameState === 'tie') {
        themeColorHex = '#facc15'; statusText = 'EMPATE!';
        subStatusText = 'Ambos fizeram a mesma pontuação. Dinheiro devolvido.';
        prizeStatusText = `R$ ${bet.toLocaleString('pt-BR')} DEVOLVIDOS`;
    }

    // ==========================================
    // FUNDO PREMIUM COM TEXTURA DE CASINO
    // ==========================================
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, width, height);

    const bgGradient = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width);
    bgGradient.addColorStop(0, '#0a2e18'); 
    bgGradient.addColorStop(1, '#020a05'); 
    ctx.fillStyle = bgGradient; ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/1.2);
    glow.addColorStop(0, hexToRgba(themeColorHex, 0.15)); 
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);

    try {
        const logo = await loadImage(path.join(__dirname, 'logo.png'));
        const logoW = 200; const logoH = logoW * (logo.height / logo.width);
        ctx.save(); ctx.globalAlpha = 0.04; ctx.globalCompositeOperation = 'overlay';
        ctx.drawImage(logo, (width - logoW) / 2, (height - logoH) / 2, logoW, logoH); ctx.restore();
    } catch (e) {}

    // Moldura
    ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = themeColorHex;
    ctx.shadowColor = themeColorHex; ctx.shadowBlur = 15;
    drawRoundRect(ctx, 15, 15, width - 30, height - 30, 20); ctx.stroke(); ctx.restore();

    // ==========================================
    // 1. CABEÇALHO DO JOGADOR
    // ==========================================
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    drawRoundRect(ctx, 30, 30, width - 60, 90, 15); ctx.fill();

    const avatarSize = 65; const avatarX = 50; const avatarY = 42;
    ctx.save(); ctx.beginPath(); ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.closePath(); ctx.clip();
    try {
        const avatarImg = await loadImage(userDiscord.displayAvatarURL({ extension: 'png', size: 128 }));
        ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
    } catch(e) {}
    ctx.restore();

    ctx.save(); ctx.beginPath(); ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.lineWidth = 2; ctx.strokeStyle = themeColorHex; ctx.stroke(); ctx.restore();

    const headerTextX = avatarX + avatarSize + 20;
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = '900 24px "InterCustom", Arial';
    let username = userDiscord.username.length > 20 ? userDiscord.username.substring(0, 20) + '...' : userDiscord.username;
    ctx.fillText(`@${username}`, headerTextX, avatarY + 18);

    ctx.fillStyle = '#aaaaaa'; ctx.font = '18px Arial';
    ctx.fillText(`Aposta na Mesa: R$ ${bet.toLocaleString('pt-BR')}`, headerTextX, avatarY + 48);

    // ==========================================
    // 1.5 EXPLICATIVA PARA LEIGOS (TUTORIAL) 💡
    // ==========================================
    const tutY = 135;
    ctx.fillStyle = hexToRgba(themeColorHex, 0.08); // Fundo sutil com a cor do jogo
    drawRoundRect(ctx, 30, tutY, width - 60, 45, 10); ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = hexToRgba(themeColorHex, 0.3); ctx.stroke();

    const tutText = 'OBJETIVO: Chegue o mais perto de 21 pontos para vencer o Agiota. Se ultrapassar 21, você perde!';
    ctx.font = 'bold 15px Arial';
    const tutW = ctx.measureText(tutText).width;
    const tutStartX = (width / 2) - (tutW / 2);

    drawVectorIcon(ctx, 'info', tutStartX - 30, tutY + 10, themeColorHex); // Ícone Info

    ctx.fillStyle = '#cccccc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tutText, width / 2 + 5, tutY + 22);

    // ==========================================
    // 2. ÁREA DO DEALER (AGIOTA)
    // ==========================================
    const isHiddenDealer = gameState === 'playing';
    const dealerScore = getHandScore(dealerHand, isHiddenDealer);
    let dScoreStr = isHiddenDealer ? `${dealerScore} + ?` : `${dealerScore}`;

    const agiotaY = 210; // Empurrado para baixo por causa do tutorial
    drawScoreBadge(ctx, 50, agiotaY, 'hat', 'Mão do Agiota', dScoreStr, '#ef4444');

    dealerHand.forEach((card, index) => {
        drawCard(ctx, card, 50 + (index * 115), agiotaY + 20, isHiddenDealer && index === 1);
    });

    // ==========================================
    // 3. ÁREA DO JOGADOR
    // ==========================================
    const playerScore = getHandScore(playerHand, false);
    
    const playerY = 440; // Empurrado para baixo
    const playerIcon = (gameState === 'win' || gameState === 'dealer_busted') ? 'crown' : 'user';
    drawScoreBadge(ctx, 50, playerY, playerIcon, 'Sua Mão', playerScore.toString(), themeColorHex);

    playerHand.forEach((card, index) => {
        drawCard(ctx, card, 50 + (index * 115), playerY + 20, false);
    });

    // ==========================================
    // 4. RODAPÉ (RESULTADO)
    // ==========================================
    const footerY = 650; // Empurrado para baixo
    ctx.fillStyle = hexToRgba(themeColorHex, 0.1);
    drawRoundRect(ctx, 30, footerY, width - 60, 120, 15); ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = themeColorHex; ctx.stroke();

    ctx.fillStyle = themeColorHex; ctx.textAlign = 'center';
    ctx.font = '900 28px "Arial Black", Arial';
    ctx.fillText(statusText, width / 2, footerY + 40);

    ctx.fillStyle = '#ffffff'; ctx.font = '18px Arial';
    ctx.fillText(subStatusText, width / 2, footerY + 70);

    if (prizeStatusText) {
        ctx.fillStyle = (gameState === 'win' || gameState === 'dealer_busted') ? '#57F287' : (gameState === 'lose' || gameState === 'busted' ? '#ef4444' : '#facc15');
        ctx.font = 'bold 24px Arial';
        ctx.fillText(prizeStatusText, width / 2, footerY + 105);
        drawVectorIcon(ctx, 'moneybag', (width/2) - (ctx.measureText(prizeStatusText).width/2) - 35, footerY + 86, ctx.fillStyle);
    }

    return canvas.toBuffer('image/png');
}

module.exports = { generateBlackjackTable, getHandScore };