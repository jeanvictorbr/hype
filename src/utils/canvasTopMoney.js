const { createCanvas, loadImage } = require('canvas');
const path = require('path');

function drawRoundRectPath(ctx, x, y, w, h, radius) {
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius); ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
}

// Filtro de Cor para pintar a logo!
function tintLogo(ctx, img, x, y, width, height, colorStr) {
    const tempCanvas = createCanvas(width, height);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0, width, height);
    tempCtx.globalCompositeOperation = 'source-in';
    tempCtx.fillStyle = colorStr;
    tempCtx.fillRect(0, 0, width, height);
    ctx.drawImage(tempCanvas, x, y, width, height);
}

async function generateTopMoneyImage(topUsers, callerData) {
    const width = 800;
    const height = 750;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Carrega a Logo Hype
    let logoImg = null;
    try {
        const logoPath = path.join(__dirname, 'logo.png');
        logoImg = await loadImage(logoPath);
    } catch (e) {
        console.error("Erro ao carregar logo.png para o TopMoney");
    }

    // ==========================================
    // 1. FUNDO PREMIUM AZUL/BRANCO
    // ==========================================
    const bgGrad = ctx.createRadialGradient(width/2, height/2, 100, width/2, height/2, width);
    bgGrad.addColorStop(0, '#0a192f'); 
    bgGrad.addColorStop(1, '#020617'); 
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
    for (let i = 0; i < height; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

    // ==========================================
    // 2. LOGO MARCA D'ÁGUA
    // ==========================================
    if (logoImg) {
        const logoW = 400; 
        const logoH = logoW * (logoImg.height / logoImg.width);
        ctx.save();
        ctx.globalAlpha = 0.05; 
        ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(logoImg, (width - logoW) / 2, (height - logoH) / 2, logoW, logoH);
        ctx.restore();
    }

    // ==========================================
    // 3. TÍTULO DO RANKING
    // ==========================================
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (logoImg) {
        // Pinta a logo de Azul Néon para o título
        ctx.shadowColor = '#60a5fa'; ctx.shadowBlur = 40;
        tintLogo(ctx, logoImg, width/2 - 50, 10, 100, 100 * (logoImg.height / logoImg.width), '#60a5fa');
        ctx.shadowBlur = 0;
    }
    
    ctx.shadowColor = '#60a5fa'; ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 40px "Arial Black", sans-serif';
    ctx.fillText('RANKING DE MAGNATAS', width / 2, 110);
    ctx.shadowBlur = 0;

    // ==========================================
    // 4. DESENHAR OS TOP 5
    // ==========================================
    const startY = 160;
    const rowHeight = 85;
    const gap = 15;

    for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        const currentY = startY + (i * (rowHeight + gap));

        let rankColor = '#3f3f46'; // Cinza Escuro (Default)
        let textColor = '#a1a1aa';
        let glowColor = 'transparent';

        if (user.rank === 1) { rankColor = '#eab308'; textColor = '#fef08a'; glowColor = '#eab308'; } // Ouro
        else if (user.rank === 2) { rankColor = '#94a3b8'; textColor = '#f8fafc'; glowColor = '#94a3b8'; } // Prata
        else if (user.rank === 3) { rankColor = '#b45309'; textColor = '#fcd34d'; glowColor = '#b45309'; } // Bronze

        // Caixa de Fundo
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        if (user.rank === 1) ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
        drawRoundRectPath(ctx, 40, currentY, width - 80, rowHeight, 15);
        ctx.fill();

        ctx.strokeStyle = rankColor;
        ctx.lineWidth = 2;
        ctx.shadowColor = glowColor; ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();

        // Logo do Rank (Esquerda)
        if (logoImg && user.rank <= 3) {
            const medalSize = 60;
            const medalH = medalSize * (logoImg.height / logoImg.width);
            ctx.shadowColor = glowColor; ctx.shadowBlur = 25;
            // Pinta a logo de Ouro, Prata ou Bronze
            tintLogo(ctx, logoImg, 60, currentY + rowHeight / 2 - medalH / 2, medalSize, medalH, rankColor);
            ctx.shadowBlur = 0;
        } else {
            // Número para o rank 4 e 5
            ctx.textAlign = 'center';
            ctx.fillStyle = textColor;
            ctx.font = '900 35px "Arial Black", sans-serif';
            ctx.fillText(`#${user.rank}`, 90, currentY + rowHeight / 2);
        }

        // Avatar
        try {
            if (user.avatarUrl) {
                const avatar = await loadImage(user.avatarUrl);
                ctx.save();
                ctx.beginPath();
                ctx.arc(175, currentY + rowHeight / 2, 30, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatar, 145, currentY + rowHeight / 2 - 30, 60, 60);
                ctx.restore();
            }
        } catch (e) {
            ctx.fillStyle = rankColor;
            ctx.beginPath(); ctx.arc(175, currentY + rowHeight / 2, 30, 0, Math.PI * 2); ctx.fill();
        }

        // Nome
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(user.username.length > 15 ? user.username.substring(0, 15) + '...' : user.username, 230, currentY + rowHeight / 2);

        // Dinheiro (Direita)
        if (logoImg) {
            const cashIconSize = 40;
            const cashIconH = cashIconSize * (logoImg.height / logoImg.width);
            // Pinta a logo de Verde Dinheiro
            tintLogo(ctx, logoImg, width - 300, currentY + rowHeight / 2 - cashIconH / 2, cashIconSize, cashIconH, '#57F287');
        }

        ctx.textAlign = 'right';
        ctx.fillStyle = '#57F287'; 
        ctx.font = 'bold 30px Arial';
        ctx.fillText(`R$ ${user.cash.toLocaleString('pt-BR')}`, width - 60, currentY + rowHeight / 2);
    }

    // ==========================================
    // 5. RODAPÉ: O SEU POSICIONAMENTO
    // ==========================================
    const footerY = height - 100;
    
    ctx.save();
    const footerGrad = ctx.createLinearGradient(40, 0, width - 40, 0);
    footerGrad.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
    footerGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.6)');
    footerGrad.addColorStop(1, 'rgba(59, 130, 246, 0.2)');
    ctx.fillStyle = footerGrad;
    drawRoundRectPath(ctx, 40, footerY, width - 80, 70, 15);
    ctx.fill();
    ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 2; ctx.shadowColor = '#60a5fa'; ctx.shadowBlur = 15; ctx.stroke(); ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px Arial';
    ctx.fillText(`Sua Posição: #${callerData.rank}  |  Seu Saldo: R$ ${callerData.cash.toLocaleString('pt-BR')}`, width / 2, footerY + 35);

    // ==========================================
    // 6. MOLDURA GERAL
    // ==========================================
    ctx.save();
    const borderGrad = ctx.createLinearGradient(0, 0, width, height);
    borderGrad.addColorStop(0, '#0f172a'); borderGrad.addColorStop(0.5, '#38bdf8'); borderGrad.addColorStop(1, '#1e3a8a');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 10;
    drawRoundRectPath(ctx, 5, 5, width - 10, height - 10, 20);
    ctx.stroke();
    ctx.restore();

    return canvas.toBuffer('image/png');
}

module.exports = { generateTopMoneyImage };