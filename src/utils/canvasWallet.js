const { createCanvas, loadImage } = require('canvas');
const path = require('path');

function drawRoundRectPath(ctx, x, y, w, h, radius) {
    ctx.beginPath(); 
    ctx.moveTo(x + radius, y); 
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius); 
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); 
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius); 
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); 
    ctx.closePath();
}

async function generateWalletImage(userDiscord, userData) {
    const width = 450;
    const height = 750;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. FUNDO ULTRA-CLEAN 
    ctx.fillStyle = '#09090b'; 
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'screen';
    const topGlow = ctx.createRadialGradient(width, 0, 0, width, 0, 450);
    topGlow.addColorStop(0, 'rgba(56, 189, 248, 0.12)'); // Azul
    topGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = topGlow; ctx.fillRect(0, 0, width, height);

    const bottomGlow = ctx.createRadialGradient(0, height, 0, 0, height, 500);
    bottomGlow.addColorStop(0, 'rgba(87, 242, 135, 0.10)'); // Verde
    bottomGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = bottomGlow; ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';

    // 2. LOGO HYPE (Topo - Elegante)
    try {
        const logoImg = await loadImage(path.join(__dirname, 'logo.png'));
        const logoW = 100; // Tamanho ideal para o topo
        const logoH = logoW * (logoImg.height / logoImg.width);
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.drawImage(logoImg, (width - logoW) / 2, 40, logoW, logoH);
        ctx.restore();
    } catch(e) {}

    // 3. AVATAR COM MOLDURA AZUL
    const avatarSize = 120; 
    const avatarX = (width - avatarSize) / 2; 
    const avatarY = 120; // Descido para dar espaço à logo

    // Sombra do avatar
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'; ctx.shadowBlur = 15; ctx.shadowOffsetY = 10;
    ctx.beginPath(); ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.fillStyle = '#18181b'; ctx.fill();
    ctx.restore();

    try {
        const avatarImg = await loadImage(userDiscord.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.save();
        ctx.beginPath(); ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.closePath(); ctx.clip();
        ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
    } catch(e) {}

    // 🔥 A MOLDURA AZUL
    ctx.save();
    ctx.beginPath(); ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#0000FF'; // Azul Néon
    ctx.shadowColor = '#0000FF'; 
    ctx.shadowBlur = 15; // Brilho em volta da foto
    ctx.stroke();
    ctx.restore();

    // 4. NOME DO UTILIZADOR
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'top';
    ctx.font = 'bold 30px "Arial", sans-serif';
    let displayName = userDiscord.username;
    if (displayName.length > 15) displayName = displayName.substring(0, 15) + '...';
    ctx.fillText(displayName, width / 2, 260);

    // 5. O CARTÃO DE VIDRO
    const cardW = 380;
    const cardH = 340;
    const cardX = (width - cardW) / 2;
    const cardY = 320;

    ctx.save();
    ctx.fillStyle = 'rgba(30, 30, 36, 0.5)';
    drawRoundRectPath(ctx, cardX, cardY, cardW, cardH, 24);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10;
    ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; 

    const cardBorder = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    cardBorder.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    cardBorder.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
    ctx.strokeStyle = cardBorder; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();

    // A. CARTEIRA
    ctx.textAlign = 'left';
    ctx.fillStyle = '#a1a1aa'; 
    ctx.font = '600 16px "Arial", sans-serif';
    ctx.fillText('CARTEIRA (NA MÃO)', cardX + 30, cardY + 35);

    const carteiraValor = (userData.carteira || 0).toLocaleString('pt-BR');
    ctx.fillStyle = '#ffffff';
    if (carteiraValor.length > 10) ctx.font = 'bold 36px "Arial", sans-serif';
    else if (carteiraValor.length > 7) ctx.font = 'bold 44px "Arial", sans-serif';
    else ctx.font = 'bold 50px "Arial", sans-serif';
    ctx.fillText(`R$ ${carteiraValor}`, cardX + 28, cardY + 65);

    drawRoundRectPath(ctx, cardX + cardW - 100, cardY + 32, 70, 24, 6);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'; ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ef4444'; ctx.font = 'bold 12px Arial';
    ctx.fillText('RISCO', cardX + cardW - 65, cardY + 44);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cardX + 30, cardY + 160); ctx.lineTo(cardX + cardW - 30, cardY + 160); ctx.stroke();

    // B. BANCO
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#a1a1aa'; ctx.font = '600 16px "Arial", sans-serif';
    ctx.fillText('BANCO HYPE', cardX + 30, cardY + 200);

    const bancoValor = (userData.hypeCash || 0).toLocaleString('pt-BR');
    ctx.fillStyle = '#ffffff';
    if (bancoValor.length > 10) ctx.font = 'bold 28px "Arial", sans-serif';
    else ctx.font = 'bold 38px "Arial", sans-serif';
    ctx.fillText(`R$ ${bancoValor}`, cardX + 28, cardY + 230);

    drawRoundRectPath(ctx, cardX + cardW - 100, cardY + 197, 70, 24, 6);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)'; ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0000FF'; ctx.font = 'bold 12px Arial';
    ctx.fillText('SEGURO', cardX + cardW - 65, cardY + 209);

    // 6. RODAPÉ
    ctx.textAlign = 'center'; ctx.fillStyle = '#52525b'; ctx.font = '600 12px "Arial", sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('USE ZDEPOSITAR PARA GUARDAR', width / 2, height - 40);

    return canvas.toBuffer('image/png');
}

module.exports = { generateWalletImage };