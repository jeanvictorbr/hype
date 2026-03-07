const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

try { registerFont(path.join(__dirname, 'Inter-Variable.ttf'), { family: 'InterCustom' }); } catch (e) {}

function hexToRgba(hex, alpha) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0,2), 16); 
    let g = parseInt(hex.substring(2,4), 16); 
    let b = parseInt(hex.substring(4,6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawRoundRectPath(ctx, x, y, w, h, radius) {
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius); ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
}

async function generateRouboImage(ladraoDiscord, vitimaDiscord, isSuccess, amount, itemMsg) {
    const width = 900; const height = 400; 
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Tema dinâmico: Sucesso (Verde Dinheiro) | Falha (Vermelho Cadeia)
    const themeColorHex = isSuccess ? '#57F287' : '#ef4444';
    const titleText = isSuccess ? 'ASSALTO BEM SUCEDIDO' : 'OPERAÇÃO POLICIAL: PRISÃO';
    const subTitleText = isSuccess ? 'Relatório de Atividade do Submundo' : 'Boletim de Ocorrência Criminal';

    // Fundo Hype Premium
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
    glow.addColorStop(0, hexToRgba(themeColorHex, 0.15)); 
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 1;
    for(let i = 0; i < height; i += 30) {
        ctx.strokeStyle = `rgba(255, 255, 255, 0.01)`; 
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    // Moldura Principal (Filéti Neon)
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
    // CABEÇALHO (Logo e Título)
    // ==========================================
    const headerY = containerY + 35;
    const paddingX = containerX + 40;

    try {
        const logo = await loadImage(path.join(__dirname, 'logo.png'));
        const logoW = 60; const logoH = logoW * (logo.height / logo.width);
        ctx.drawImage(logo, paddingX, headerY - (logoH/2), logoW, logoH);
        
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.font = '900 24px "InterCustom", Arial, sans-serif';
        ctx.fillText(titleText, paddingX + logoW + 15, headerY - 5);

        ctx.fillStyle = themeColorHex; ctx.font = 'italic 16px "InterCustom", Arial, sans-serif';
        ctx.fillText(subTitleText, paddingX + logoW + 15, headerY + 18);
    } catch (e) {
        ctx.fillStyle = themeColorHex; ctx.font = '900 28px "InterCustom", Arial, sans-serif';
        ctx.fillText(titleText, paddingX, headerY);
    }

    // ==========================================
    // ZONA DOS AVATARES (Ladrão vs Vítima)
    // ==========================================
    const avatarY = 160;
    const ladraoX = 100;
    const vitimaX = 300;
    const avatarSize = 110;

    async function drawAvatar(discordUser, x, y, isTarget) {
        ctx.save();
        ctx.beginPath(); ctx.arc(x + avatarSize/2, y + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.closePath(); ctx.clip();
        try {
            const img = await loadImage(discordUser.displayAvatarURL({ extension: 'png', size: 256 }));
            ctx.drawImage(img, x, y, avatarSize, avatarSize);
        } catch(e) {}
        ctx.restore();

        // Borda do Avatar
        ctx.save();
        const borderColor = isTarget ? '#aaaaaa' : themeColorHex;
        ctx.shadowColor = hexToRgba(borderColor, 0.8); ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(x + avatarSize/2, y + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.lineWidth = 3; ctx.strokeStyle = borderColor; ctx.stroke();
        ctx.restore();

        // Nome embaixo
        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.font = 'bold 16px "InterCustom", Arial';
        let name = discordUser.username.length > 12 ? discordUser.username.substring(0, 12) + '...' : discordUser.username;
        ctx.fillText(`@${name}`, x + avatarSize/2, y + avatarSize + 25);
        
        ctx.fillStyle = isTarget ? '#ef4444' : themeColorHex; 
        ctx.font = 'bold 12px Arial';
        ctx.fillText(isTarget ? 'VÍTIMA' : 'AUTOR', x + avatarSize/2, y + avatarSize + 42);
    }

    await drawAvatar(ladraoDiscord, ladraoX, avatarY, false);
    await drawAvatar(vitimaDiscord, vitimaX, avatarY, true);

    // Ícone de alvo / VS no meio
    ctx.fillStyle = '#444444'; ctx.textAlign = 'center'; ctx.font = '900 24px Arial';
    ctx.fillText('➡️', (ladraoX + vitimaX + avatarSize) / 2, avatarY + avatarSize/2);

    // ==========================================
    // ZONA DE INFORMAÇÕES FINANCEIRAS (Direita)
    // ==========================================
    const rightStartX = 500;
    const rightY = 180;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#aaaaaa'; ctx.font = 'bold 16px "InterCustom", Arial, sans-serif';
    ctx.fillText(isSuccess ? 'VALOR ROUBADO' : 'MULTA APLICADA (FIANÇA)', rightStartX, rightY);

    ctx.fillStyle = themeColorHex; 
    ctx.font = '900 55px "Arial Black", Arial, sans-serif'; 
    ctx.save();
    ctx.shadowColor = hexToRgba(themeColorHex, 0.4); ctx.shadowBlur = 8;
    const sinal = isSuccess ? '+' : '-';
    ctx.fillText(`${sinal} R$ ${amount.toLocaleString('pt-BR')}`, rightStartX, rightY + 55);
    ctx.restore();

    ctx.fillStyle = '#ffffff'; ctx.font = '15px "InterCustom", Arial';
    if (isSuccess) {
        ctx.fillText('Dinheiro limpo adicionado à sua carteira.', rightStartX, rightY + 85);
    } else {
        ctx.fillText('Dinheiro confiscado pela polícia.', rightStartX, rightY + 85);
    }

    // ==========================================
    // BARRA DE ITENS (Mercado Negro)
    // ==========================================
    if (itemMsg) {
        const footerY = containerY + containerH - 60;
        
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        drawRoundRectPath(ctx, containerX + 20, footerY, containerW - 40, 50, 10);
        ctx.fill();

        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.stroke();

        ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = 'bold 15px "InterCustom", Arial, sans-serif';
        ctx.fillText(itemMsg.toUpperCase(), width/2, footerY + 25);
        ctx.restore();
    }

    return canvas.toBuffer('image/png');
}

module.exports = { generateRouboImage };