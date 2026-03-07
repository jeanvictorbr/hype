const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

// Tenta registar uma fonte mais imponente
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

// Desenha cantos arredondados
function drawRoundRectPath(ctx, x, y, w, h, radius) {
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius); ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
}

async function generateRewardImage(userDiscord, rewardName, rewardAmount, vipMultiplier, themeColorHex) {
    const width = 900; const height = 400; 
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // ==========================================
    // 1. FUNDO PREMIUM HYPE
    // ==========================================
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Efeito Néon Cibernético
    const glow = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/1.1);
    glow.addColorStop(0, hexToRgba(themeColorHex, 0.15)); 
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Grid Leve
    ctx.lineWidth = 1;
    for(let i = 0; i < height; i += 30) {
        ctx.strokeStyle = `rgba(255, 255, 255, 0.01)`; 
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    // ==========================================
    // 2. MOLDURA PRINCIPAL (Filéti Neon)
    // ==========================================
    const containerX = 20; const containerY = 20;
    const containerW = width - 40; const containerH = height - 40;
    
    ctx.fillStyle = '#0a0a0c'; 
    drawRoundRectPath(ctx, containerX, containerY, containerW, containerH, 20);
    ctx.fill();

    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = hexToRgba(themeColorHex, 0.8);
    ctx.shadowColor = themeColorHex;
    ctx.shadowBlur = 10;
    drawRoundRectPath(ctx, containerX, containerY, containerW, containerH, 20);
    ctx.stroke();
    ctx.restore();

    // ==========================================
    // 3. CABEÇALHO DO BANCO HYPE
    // ==========================================
    const headerY = containerY + 35;
    const paddingX = containerX + 40;

    try {
        const logo = await loadImage(path.join(__dirname, 'logo.png'));
        const logoW = 60;
        const logoH = logoW * (logo.height / logo.width);
        
        ctx.drawImage(logo, paddingX, headerY - (logoH/2), logoW, logoH);
        
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.font = 'bold 22px "InterCustom", sans-serif';
        ctx.fillText('BANCO HYPE', paddingX + logoW + 15, headerY);

        ctx.fillStyle = '#aaaaaa'; ctx.font = '16px "InterCustom", sans-serif';
        ctx.fillText('Comprovante de Depósito Digital', paddingX + logoW + 15, headerY + 22);

    } catch (e) {
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 28px "InterCustom", sans-serif';
        ctx.fillText('BANCO HYPE', paddingX, headerY);
    }

    // ==========================================
    // 4. DETALHES DA TRANSAÇÃO (Esquerda)
    // ==========================================
    const contentY = headerY + 70; // 125
    
    ctx.fillStyle = '#aaaaaa'; ctx.font = 'bold 15px "InterCustom", sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('STATUS RECOMPENSA', paddingX, contentY);
    ctx.fillText('DATA E HORA', paddingX, contentY + 60);
    ctx.fillText('REF. TRANSAÇÃO', paddingX, contentY + 120);

    const dateFormatted = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' });
    const refId = `#SYNC${Math.floor(Date.now() / 1000).toString(16).toUpperCase()}`;

    ctx.fillStyle = '#ffffff'; ctx.font = '900 24px Arial, sans-serif'; 
    ctx.fillText(rewardName.toUpperCase(), paddingX, contentY + 30);
    
    ctx.fillStyle = '#ffffff'; ctx.font = '700 18px Arial, sans-serif';
    ctx.fillText(dateFormatted, paddingX, contentY + 85);
    ctx.fillText(refId, paddingX, contentY + 145);

    // ==========================================
    // 5. VALOR E TITULAR (Direita) - SUBIMOS AS INFOS AQUI 👇
    // ==========================================
    const rightStartX = 480; 
    const rightContentY = contentY - 15; // Movemos todo o bloco para cima!

    // Avatar do Jogador
    const avatarSize = 80; // Reduzimos de 90 para 80 para caber melhor
    const avatarX = rightStartX; 
    const avatarY = rightContentY;

    ctx.save();
    ctx.beginPath(); ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.closePath(); ctx.clip(); 

    try {
        const avatarImg = await loadImage(userDiscord.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
    } catch(e) {}
    ctx.restore();

    ctx.save();
    ctx.shadowColor = hexToRgba(themeColorHex, 0.8); ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.lineWidth = 2; ctx.strokeStyle = themeColorHex; ctx.stroke();
    ctx.restore();

    // Nome e ID
    const textStartX = avatarX + 100;
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.font = '800 24px "InterCustom", sans-serif';
    let username = userDiscord.username.length > 15 ? userDiscord.username.substring(0, 15) + '...' : userDiscord.username;
    ctx.fillText(`@${username}`, textStartX, avatarY + (avatarSize/2) - 12);

    ctx.fillStyle = themeColorHex; ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText(`ID: ${userDiscord.id.substring(0, 10)}...`, textStartX, avatarY + (avatarSize/2) + 12);

    // Valor (Puxado para cima e alinhado)
    const valorY = avatarY + 110; 
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.font = 'bold 15px "InterCustom", sans-serif';
    ctx.fillText('VALOR DISPONÍVEL NA CARTEIRA', rightStartX, valorY);

    ctx.fillStyle = '#57F287'; 
    ctx.font = '900 52px "Arial Black", Arial, sans-serif'; 
    ctx.save();
    ctx.shadowColor = 'rgba(87, 242, 135, 0.3)'; ctx.shadowBlur = 8;
    ctx.fillText(`+ R$ ${rewardAmount.toLocaleString('pt-BR')}`, rightStartX, valorY + 45);
    ctx.restore();

    // ==========================================
    // 6. BARRA VIP FOOTER (Sem Emojis Bugados)
    // ==========================================
    if (vipMultiplier > 1) {
        const footerY = containerY + containerH - 60;
        
        ctx.save();
        ctx.fillStyle = 'rgba(212, 175, 55, 0.08)';
        drawRoundRectPath(ctx, containerX + 20, footerY, containerW - 40, 50, 10);
        ctx.fill();

        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)'; ctx.stroke();


        // Texto Limpo e Profissional
        ctx.fillStyle = '#FEE75C'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = 'bold 15px "InterCustom", Arial, sans-serif';
        ctx.fillText(`BÔNUS VIP ( X${vipMultiplier} ) APLICADO AO VALOR DA TRANSAÇÃO`, width/2 + 10, footerY + 25);
        ctx.restore();
    } else {
        const footerY = containerY + containerH - 45;
        ctx.fillStyle = '#555555'; ctx.textAlign = 'center'; ctx.font = '14px "InterCustom", Arial, sans-serif';
        ctx.fillText(`*(Adquira um Cartão VIP para multiplicar automaticamente as suas transações)*`, width/2, footerY);
    }

    return canvas.toBuffer('image/png');
}

module.exports = { generateRewardImage };