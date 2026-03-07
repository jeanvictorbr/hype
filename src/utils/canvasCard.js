const { createCanvas, loadImage } = require('canvas');
const path = require('path');

function drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function hexToRgb(hex) {
    let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}

async function generateHypeCard(user, cardNumber, balance, vipRealLevel, txtVip, txtValidade, customColor1, customColor2) {
    const width = 800;
    const height = 480; 
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // =========================================================
    // 1. MOTOR DE TEMAS (TEXTOS BRANCOS E CHIP DOURADO FIXOS)
    // =========================================================
    let isColorful = false;
    let theme = {
        bgDark: '#090a0c', bgLight: '#1a1d24', 
        subtext: 'rgba(255, 255, 255, 0.7)'
    };

    if (vipRealLevel >= 5) {
        theme.bgDark = '#050505'; theme.bgLight = '#240000';
    } else if (vipRealLevel === 4) {
        theme.bgDark = '#050505'; theme.bgLight = '#1f1905';
    } else if (vipRealLevel === 3) {
        isColorful = true;
        theme.bgDark = '#000000'; theme.bgLight = '#ffffff';
    } else if (vipRealLevel === 2) {
        theme.bgDark = '#050505'; theme.bgLight = '#b0b0b0';
    } else if (vipRealLevel === 1) {
        theme.bgDark = '#b81267'; theme.bgLight = '#ff85cd';
    }

    // 🔥 ISOLAMENTO DA COR: O botão muda APENAS o fundo agora 🔥
    if (customColor1) {
        isColorful = false; 
        theme.bgLight = customColor2 || customColor1; 
        
        let rgb = hexToRgb(customColor1);
        if (rgb) {
            theme.bgDark = `rgb(${Math.max(0, rgb.r - 80)}, ${Math.max(0, rgb.g - 80)}, ${Math.max(0, rgb.b - 80)})`;
        }
    }

    // =========================================================
    // 2. DESENHO DO FUNDO E MOLDURA
    // =========================================================
    ctx.save();
    drawRoundRect(ctx, 0, 0, width, height, 30);
    ctx.clip(); 

    const bgGradient = ctx.createLinearGradient(0, height, width, 0);
    
    if (isColorful) {
        bgGradient.addColorStop(0, '#ff0055'); 
        bgGradient.addColorStop(0.33, '#7000ff'); 
        bgGradient.addColorStop(0.66, '#00c3ff'); 
        bgGradient.addColorStop(1, '#00ff88'); 
    } else {
        bgGradient.addColorStop(0, theme.bgDark);
        bgGradient.addColorStop(1, theme.bgLight);
    }
    
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0,0,width,height); 

    // Polígono de Luxo
    ctx.beginPath();
    ctx.moveTo(-100, height * 0.3); ctx.lineTo(width, height * 0.8);
    ctx.lineTo(width, height + 100); ctx.lineTo(-100, height + 100);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fill();

    // =========================================================
    // 3. CHIP EMV E CONTACTLESS (FIXADO NO AMARELO)
    // =========================================================
    const chipX = 50; const chipY = 70;
    
    ctx.fillStyle = '#D4AF37'; // Ouro fixo
    drawRoundRect(ctx, chipX, chipY, 75, 55, 8);
    ctx.fill();
    ctx.strokeStyle = '#997a00'; // Linhas do Ouro
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chipX, chipY + 20); ctx.lineTo(chipX + 25, chipY + 20);
    ctx.moveTo(chipX, chipY + 35); ctx.lineTo(chipX + 25, chipY + 35);
    ctx.moveTo(chipX + 50, chipY + 20); ctx.lineTo(chipX + 75, chipY + 20);
    ctx.moveTo(chipX + 50, chipY + 35); ctx.lineTo(chipX + 75, chipY + 35);
    ctx.moveTo(chipX + 25, chipY); ctx.lineTo(chipX + 25, chipY + 55);
    ctx.moveTo(chipX + 50, chipY); ctx.lineTo(chipX + 50, chipY + 55);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.6; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 1; i <= 3; i++) {
        ctx.beginPath(); ctx.arc(chipX + 115, chipY + 27, i * 10, -0.7, 0.7); ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // =========================================================
    // 4. STATUS VIP (Topo Direito) - BRANCO COM NEON CLEAN
    // =========================================================
    // Efeito Neon Fino
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = 6; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

    ctx.textAlign = 'right'; ctx.fillStyle = theme.subtext;
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText('STATUS HYPE', width - 40, 50);

    ctx.fillStyle = '#ffffff'; // Letra sempre Branca
    let vipFont = 28;
    ctx.font = `900 ${vipFont}px Arial, sans-serif`;
    const cleanVipName = txtVip.replace(/[⭐🥇🥈🥉⚠️]/g, '').trim().toUpperCase();
    
    while (ctx.measureText(cleanVipName).width > 300 && vipFont > 16) {
        vipFont -= 2; ctx.font = `900 ${vipFont}px Arial, sans-serif`;
    }
    ctx.fillText(cleanVipName, width - 40, 85);

    if (txtValidade) {
        ctx.fillStyle = theme.subtext; ctx.font = 'italic 16px Arial, sans-serif';
        const cleanValidade = txtValidade.replace(/[\(\)*]/g, '').trim();
        ctx.fillText(cleanValidade, width - 40, 110);
    }
    ctx.shadowBlur = 0;

    // =========================================================
    // 5. NÚMERO DO CARTÃO - ALTO RELEVO E NEON
    // =========================================================
    ctx.textAlign = 'left'; ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px "Courier New", monospace';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)'; ctx.shadowBlur = 8; 
    const displayCardNumber = cardNumber.replace(/-/g, '  '); 
    ctx.fillText(displayCardNumber, 50, height / 2 + 30);
    ctx.shadowBlur = 0; 

    // =========================================================
    // 6. RÓTULOS INFERIORES E SALDO 
    // =========================================================
    const bottomLabelY = height - 105; const bottomTextY = height - 55; const startX = 50;

    ctx.shadowColor = 'rgba(255, 255, 255, 0.3)'; ctx.shadowBlur = 4;

    ctx.fillStyle = theme.subtext; ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText('SALDO DISPONÍVEL', startX, bottomLabelY);
    ctx.fillText('TITULAR DO CARTÃO', 330, bottomLabelY);

    let iconWidth = 0; const padding = 10;
    try {
        const hcIconPath = path.join(__dirname, 'hc.png');
        const hcIcon = await loadImage(hcIconPath);
        const iconHeight = 36;
        iconWidth = iconHeight * (hcIcon.width / hcIcon.height);
        ctx.drawImage(hcIcon, startX, bottomTextY - iconHeight + 4, iconWidth, iconHeight);
    } catch (e) {
        ctx.fillStyle = '#ffffff'; ctx.font = `900 40px Arial, sans-serif`;
        ctx.fillText('HC', startX, bottomTextY);
        iconWidth = ctx.measureText('HC').width;
    }

    ctx.fillStyle = '#ffffff'; // Saldo Branco Neon
    let balanceFont = 40; ctx.font = `900 ${balanceFont}px Arial, sans-serif`;
    let balanceText = `${balance}`;
    while (ctx.measureText(balanceText).width > (260 - iconWidth - padding) && balanceFont > 20) {
        balanceFont -= 2; ctx.font = `900 ${balanceFont}px Arial, sans-serif`;
    }
    ctx.fillText(balanceText, startX + iconWidth + padding, bottomTextY);

    ctx.fillStyle = '#ffffff'; // Nome Branco Neon
    let nameFont = 28; ctx.font = `bold ${nameFont}px Arial, sans-serif`;
    let nameText = user.username.toUpperCase();
    while (ctx.measureText(nameText).width > 200 && nameFont > 16) {
        nameFont -= 2; ctx.font = `bold ${nameFont}px Arial, sans-serif`;
    }
    ctx.fillText(nameText, 330, bottomTextY);

    ctx.shadowBlur = 0;

    // =========================================================
    // 7. A BANDEIRA DO CARTÃO
    // =========================================================
    try {
        const logoPath = path.join(__dirname, 'logo.png');
        const logo = await loadImage(logoPath);
        const logoWidth = 140; const logoHeight = logoWidth * (logo.height / logo.width);
        const logoX = width - logoWidth - 40; const logoY = height - logoHeight - 35;

        ctx.fillStyle = theme.subtext; ctx.font = 'bold 11px Arial, sans-serif'; ctx.textAlign = 'right';
        ctx.fillText('NETWORK', width - 40, logoY - 10);

        // Neon atrás da logo
        ctx.shadowColor = 'rgba(255, 255, 255, 0.4)'; ctx.shadowBlur = 10;
        ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
    } catch (e) {}

    ctx.restore();
    return canvas.toBuffer('image/png');
}

module.exports = { generateHypeCard };