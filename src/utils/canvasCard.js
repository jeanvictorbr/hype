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

async function generateHypeCard(user, cardNumber, balance, vipRealLevel, txtVip, txtValidade) {
    const width = 800;
    const height = 480; 
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // =========================================================
    // 1. MOTOR DE TEMAS (OS 5 NÍVEIS VIP)
    // =========================================================
    let isColorful = false;
    let theme = {
        bgDark: '#090a0c', bgLight: '#1a1d24', // Membro Comum
        accent: '#5865F2', text: '#ffffff', subtext: 'rgba(255, 255, 255, 0.5)',
        chipBg: '#D4AF37', chipLines: '#997a00' 
    };

    if (vipRealLevel >= 5) {
        // VIP 5: SUPREME (Preto Absoluto com Vermelho)
        theme = { 
            bgDark: '#050505', bgLight: '#240000', 
            accent: '#ED4245', text: '#ffffff', subtext: 'rgba(255, 255, 255, 0.6)', 
            chipBg: '#ED4245', chipLines: '#8a0606' 
        };
    } else if (vipRealLevel === 4) {
        // VIP 4: ELITE (Preto Absoluto com Dourado)
        theme = { 
            bgDark: '#050505', bgLight: '#1f1905', 
            accent: '#FEE75C', text: '#ffffff', subtext: 'rgba(255, 255, 255, 0.6)', 
            chipBg: '#D4AF37', chipLines: '#997a00' 
        };
    } else if (vipRealLevel === 3) {
        // VIP 3: EXCLUSIVE (Colorido / Holográfico)
        isColorful = true;
        theme = { 
            bgDark: '#000000', bgLight: '#ffffff', // Ignorado pelo isColorful
            accent: '#ffffff', text: '#ffffff', subtext: 'rgba(255, 255, 255, 0.8)',
            chipBg: '#ffffff', chipLines: '#333333' 
        };
    } else if (vipRealLevel === 2) {
        // VIP 2: PRIME (Preto e Branco Metálico)
        theme = { 
            bgDark: '#050505', bgLight: '#b0b0b0', 
            accent: '#ffffff', text: '#ffffff', subtext: 'rgba(255, 255, 255, 0.8)', 
            chipBg: '#ffffff', chipLines: '#000000' 
        };
    } else if (vipRealLevel === 1) {
        // VIP 1: BOOSTER (Rosa Fraco e Forte)
        theme = { 
            bgDark: '#b81267', bgLight: '#ff85cd', 
            accent: '#ffffff', text: '#ffffff', subtext: 'rgba(255, 255, 255, 0.8)',
            chipBg: '#ffffff', chipLines: '#d44297' 
        };
    }

    // =========================================================
    // 2. DESENHO DO FUNDO E MOLDURA
    // =========================================================
    ctx.save();
    drawRoundRect(ctx, 0, 0, width, height, 30);
    ctx.clip(); 

    const bgGradient = ctx.createLinearGradient(0, height, width, 0);
    
    // Se for VIP 3 (Exclusive), aplica o gradiente Arco-Íris Holográfico
    if (isColorful) {
        bgGradient.addColorStop(0, '#ff0055'); // Rosa Choque
        bgGradient.addColorStop(0.33, '#7000ff'); // Roxo
        bgGradient.addColorStop(0.66, '#00c3ff'); // Azul Claro
        bgGradient.addColorStop(1, '#00ff88'); // Verde Neon
    } else {
        bgGradient.addColorStop(0, theme.bgDark);
        bgGradient.addColorStop(1, theme.bgLight);
    }
    
    ctx.fillStyle = bgGradient;
    ctx.fill();

    // Formas Geométricas para Luxo e Profundidade
    ctx.beginPath();
    ctx.moveTo(-100, height * 0.3); ctx.lineTo(width, height * 0.8);
    ctx.lineTo(width, height + 100); ctx.lineTo(-100, height + 100);
    // Ajuste de transparência consoante a cor
    ctx.fillStyle = (vipRealLevel === 2) ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)';
    ctx.fill();

    // =========================================================
    // 3. CHIP EMV E CONTACTLESS
    // =========================================================
    const chipX = 50;
    const chipY = 70;
    
    ctx.fillStyle = theme.chipBg;
    drawRoundRect(ctx, chipX, chipY, 75, 55, 8);
    ctx.fill();
    ctx.strokeStyle = theme.chipLines;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chipX, chipY + 20); ctx.lineTo(chipX + 25, chipY + 20);
    ctx.moveTo(chipX, chipY + 35); ctx.lineTo(chipX + 25, chipY + 35);
    ctx.moveTo(chipX + 50, chipY + 20); ctx.lineTo(chipX + 75, chipY + 20);
    ctx.moveTo(chipX + 50, chipY + 35); ctx.lineTo(chipX + 75, chipY + 35);
    ctx.moveTo(chipX + 25, chipY); ctx.lineTo(chipX + 25, chipY + 55);
    ctx.moveTo(chipX + 50, chipY); ctx.lineTo(chipX + 50, chipY + 55);
    ctx.stroke();

    ctx.strokeStyle = theme.text;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(chipX + 115, chipY + 27, i * 10, -0.7, 0.7);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // =========================================================
    // 4. STATUS VIP (Topo Direito)
    // =========================================================
    // Aplico uma sombra extra no texto de topo para leitura clara
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1;

    ctx.textAlign = 'right';
    ctx.fillStyle = theme.subtext;
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText('STATUS HYPE', width - 40, 50);

    ctx.fillStyle = theme.accent;
    let vipFont = 28;
    ctx.font = `900 ${vipFont}px Arial, sans-serif`;
    const cleanVipName = txtVip.replace(/[⭐🥇🥈🥉⚠️]/g, '').trim().toUpperCase();
    
    while (ctx.measureText(cleanVipName).width > 300 && vipFont > 16) {
        vipFont -= 2; ctx.font = `900 ${vipFont}px Arial, sans-serif`;
    }
    ctx.fillText(cleanVipName, width - 40, 85);

    if (txtValidade) {
        ctx.fillStyle = theme.subtext;
        ctx.font = 'italic 16px Arial, sans-serif';
        const cleanValidade = txtValidade.replace(/[\(\)*]/g, '').trim();
        ctx.fillText(cleanValidade, width - 40, 110);
    }
    
    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; // Desliga a sombra

    // =========================================================
    // 5. NÚMERO DO CARTÃO (Alto Relevo)
    // =========================================================
    ctx.textAlign = 'left';
    ctx.fillStyle = theme.text;
    ctx.font = 'bold 50px "Courier New", monospace';
    // Sombra pesada para dar aquele efeito de auto-relevo do plástico
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 3;
    
    const displayCardNumber = cardNumber.replace(/-/g, '  '); 
    ctx.fillText(displayCardNumber, 50, height / 2 + 30);
    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; 

    // =========================================================
    // 6. RÓTULOS INFERIORES E ÍCONE HC
    // =========================================================
    const bottomLabelY = height - 105;
    const bottomTextY = height - 55;
    const startX = 50;

    // Religa sombra suave para leitura perfeita nos novos fundos claros (Branco/Rosa)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 3; ctx.shadowOffsetY = 1; ctx.shadowOffsetX = 1;

    ctx.fillStyle = theme.subtext;
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText('SALDO DISPONÍVEL', startX, bottomLabelY);
    ctx.fillText('TITULAR DO CARTÃO', 330, bottomLabelY);

    // SISTEMA ÍCONE HC
    let iconWidth = 0;
    const padding = 10;
    try {
        const hcIconPath = path.join(__dirname, 'hc.png');
        const hcIcon = await loadImage(hcIconPath);
        const iconHeight = 36;
        iconWidth = iconHeight * (hcIcon.width / hcIcon.height);
        ctx.drawImage(hcIcon, startX, bottomTextY - iconHeight + 4, iconWidth, iconHeight);
    } catch (e) {
        ctx.fillStyle = theme.accent;
        ctx.font = `900 40px Arial, sans-serif`;
        ctx.fillText('HC', startX, bottomTextY);
        iconWidth = ctx.measureText('HC').width;
    }

    // Saldo numérico
    ctx.fillStyle = theme.accent;
    let balanceFont = 40;
    ctx.font = `900 ${balanceFont}px Arial, sans-serif`;
    let balanceText = `${balance}`;
    while (ctx.measureText(balanceText).width > (260 - iconWidth - padding) && balanceFont > 20) {
        balanceFont -= 2; ctx.font = `900 ${balanceFont}px Arial, sans-serif`;
    }
    ctx.fillText(balanceText, startX + iconWidth + padding, bottomTextY);

    // Nome Titular
    ctx.fillStyle = theme.text;
    let nameFont = 28;
    ctx.font = `bold ${nameFont}px Arial, sans-serif`;
    let nameText = user.username.toUpperCase();
    while (ctx.measureText(nameText).width > 200 && nameFont > 16) {
        nameFont -= 2; ctx.font = `bold ${nameFont}px Arial, sans-serif`;
    }
    ctx.fillText(nameText, 330, bottomTextY);

    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; // Desliga

    // =========================================================
    // 7. A BANDEIRA DO CARTÃO (Tua Logo no Canto Inferior Direito)
    // =========================================================
    try {
        const logoPath = path.join(__dirname, 'logo.png');
        const logo = await loadImage(logoPath);
        const logoWidth = 140; 
        const logoHeight = logoWidth * (logo.height / logo.width);
        
        const logoX = width - logoWidth - 40;
        const logoY = height - logoHeight - 35;

        // Texto NETWORK
        ctx.fillStyle = theme.subtext;
        ctx.font = 'bold 11px Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 2;
        ctx.fillText('NETWORK', width - 40, logoY - 10);

        // Aplica o relevo na logo
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
    } catch (e) {}

    ctx.restore();
    return canvas.toBuffer('image/png');
}

module.exports = { generateHypeCard };