const { createCanvas, loadImage } = require('canvas');
const path = require('path');

function drawRoundRectPath(ctx, x, y, w, h, radius) {
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius); ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
}

// Filtro de Cor para pintar a logo na hora da explosão ou vitória
function tintLogo(ctx, img, x, y, width, height, colorStr) {
    // Cria um canvas temporário só para a logo
    const tempCanvas = createCanvas(width, height);
    const tempCtx = tempCanvas.getContext('2d');
    
    // Desenha a logo
    tempCtx.drawImage(img, 0, 0, width, height);
    
    // Pinta por cima com a cor escolhida usando "source-in" (mantém transparência)
    tempCtx.globalCompositeOperation = 'source-in';
    tempCtx.fillStyle = colorStr;
    tempCtx.fillRect(0, 0, width, height);
    
    // Desenha a logo pintada no canvas principal
    ctx.drawImage(tempCanvas, x, y, width, height);
}

async function generateCrashImage(multiplier, status = 'flying') {
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Tenta carregar a logo principal
    let logoImg = null;
    try {
        const logoPath = path.join(__dirname, 'logo.png');
        logoImg = await loadImage(logoPath);
    } catch (e) {
        console.error("Erro ao carregar logo.png para o Crash:", e);
    }

    // ==========================================
    // 1. FUNDO PREMIUM AZUL/BRANCO (Estilo Servidor)
    // ==========================================
    const bgGrad = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width);
    bgGrad.addColorStop(0, '#0a192f'); // Azul escuro premium
    bgGrad.addColorStop(1, '#020617'); // Azul quase preto
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Grelha de radar ultra fina e elegante
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
    for (let i = 0; i < height; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

    // ==========================================
    // 2. MARCA D'ÁGUA CENTRAL
    // ==========================================
    if (logoImg) {
        const logoW = 250; 
        const logoH = logoW * (logoImg.height / logoImg.width);
        ctx.save();
        ctx.globalAlpha = 0.08; 
        ctx.drawImage(logoImg, (width - logoW) / 2, (height - logoH) / 2, logoW, logoH);
        ctx.restore();
    }

    // ==========================================
    // 3. O GRÁFICO (LINHA DE LUZ NEON AZUL/BRANCA)
    // ==========================================
    const visualMult = Math.min(multiplier, 5); 
    const startX = 50;
    const startY = height - 50;
    const endX = startX + (700 * (visualMult / 5)); 
    const endY = startY - (300 * (visualMult / 5)); 
    const controlX = startX + (350 * (visualMult / 5)); 

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(controlX, endY, endX, endY); 
    
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    
    // Cores da linha consoante o estado
    if (status === 'crashed') {
        ctx.strokeStyle = '#ED4245'; ctx.shadowColor = '#ED4245'; ctx.shadowBlur = 25; // Vermelho Explosão
    } else if (status === 'cashed_out') {
        ctx.strokeStyle = '#57F287'; ctx.shadowColor = '#57F287'; ctx.shadowBlur = 25; // Verde Dinheiro
    } else {
        // AZUL E BRANCO (Estilo Hype Premium)
        const lineGrad = ctx.createLinearGradient(startX, startY, endX, endY);
        lineGrad.addColorStop(0, '#1e3a8a'); // Azul Escuro
        lineGrad.addColorStop(1, '#ffffff'); // Branco na ponta

        ctx.strokeStyle = lineGrad; 
        ctx.shadowColor = '#60a5fa'; // Brilho Azul Claro
        ctx.shadowBlur = 30;
    }
    ctx.stroke();
    ctx.restore();

    // ==========================================
    // 4. A LOGO NA PONTA DO GRÁFICO
    // ==========================================
    ctx.save();
    ctx.translate(endX, endY);
    
    if (logoImg) {
        const iconSize = 75; // 👈 Aumentei a logo para ficar MAIS TOP!
        const iconH = iconSize * (logoImg.height / logoImg.width);
        
        // Se a nave explodiu, a logo fumaça para baixo e pinta de vermelho
        if (status === 'crashed') {
            ctx.rotate(0.3); // "Cai" um pouco
            ctx.shadowColor = '#ED4245'; ctx.shadowBlur = 40;
            // Pinta a logo de vermelho
            tintLogo(ctx, logoImg, -iconSize/2, -iconH/2 + 10, iconSize, iconH, '#ED4245');
        } 
        // Se tirou lucro, a logo pinta de verde
        else if (status === 'cashed_out') {
            const angle = Math.atan2(endY - startY, endX - startX);
            ctx.rotate(angle);
            ctx.shadowColor = '#57F287'; ctx.shadowBlur = 40;
            tintLogo(ctx, logoImg, -iconSize/2, -iconH/2, iconSize, iconH, '#57F287');
        } 
        // Se está a voar, desenha a logo normal e majestosa com brilho branco/azul
        else {
            const angle = Math.atan2(endY - startY, endX - startX); 
            ctx.rotate(angle); 
            ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 20;
            ctx.drawImage(logoImg, -iconSize/2, -iconH/2, iconSize, iconH);
        }
    } else {
        // Fallback caso a imagem dê erro
        ctx.font = '50px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(status === 'crashed' ? '💥' : (status === 'cashed_out' ? '💸' : '🚀'), 0, 0);
    }
    ctx.restore();

    // ==========================================
    // 5. O MULTIPLICADOR GIGANTE (CENTRO)
    // ==========================================
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 110px Arial, sans-serif'; 
    
    if (status === 'crashed') {
        ctx.fillStyle = '#ED4245';
        ctx.shadowColor = 'rgba(237, 66, 69, 0.4)'; ctx.shadowBlur = 30;
        ctx.fillText(`CRASHED!`, width / 2, height / 2 - 30);
        ctx.font = 'bold 50px Arial, sans-serif';
        ctx.fillText(`@ ${multiplier.toFixed(2)}x`, width / 2, height / 2 + 50);
    } else if (status === 'cashed_out') {
        ctx.fillStyle = '#57F287';
        ctx.shadowColor = 'rgba(87, 242, 135, 0.4)'; ctx.shadowBlur = 30;
        ctx.fillText(`${multiplier.toFixed(2)}x`, width / 2, height / 2 - 30);
        ctx.font = 'bold 40px Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`LUCRO GARANTIDO!`, width / 2, height / 2 + 50);
    } else {
        // A voar (Branco Absoluto com sombra azul clara)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 40;
        ctx.fillText(`${multiplier.toFixed(2)}x`, width / 2, height / 2);
    }
    ctx.shadowBlur = 0; 

    // ==========================================
    // 6. MOLDURA AZUL/BRANCO PREMIUM
    // ==========================================
    ctx.save();
    // Gradiente metálico Azul e Branco
    const borderGrad = ctx.createLinearGradient(0, 0, width, height);
    borderGrad.addColorStop(0, '#0f172a'); // Slate escuro
    borderGrad.addColorStop(0.3, '#38bdf8'); // Azul Claro
    borderGrad.addColorStop(0.7, '#f8fafc'); // Branco Gelo
    borderGrad.addColorStop(1, '#1e3a8a'); // Azul Profundo
    
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 10;
    drawRoundRectPath(ctx, 5, 5, width - 10, height - 10, 20);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    drawRoundRectPath(ctx, 15, 15, width - 30, height - 30, 15);
    ctx.stroke();
    ctx.restore();

    return canvas.toBuffer('image/png');
}

module.exports = { generateCrashImage };