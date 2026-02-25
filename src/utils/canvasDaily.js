const { createCanvas, loadImage } = require('canvas');
const path = require('path');

// Função auxiliar para criar a moldura
function drawRoundRectPath(ctx, x, y, w, h, radius) {
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius); ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
}

// Filtro de Cor para pintar a tua logo de forma dinâmica!
function tintLogo(ctx, img, x, y, width, height, colorStr) {
    const tempCanvas = createCanvas(width, height);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0, width, height);
    tempCtx.globalCompositeOperation = 'source-in';
    tempCtx.fillStyle = colorStr;
    tempCtx.fillRect(0, 0, width, height);
    ctx.drawImage(tempCanvas, x, y, width, height);
}

async function generateDailyImage(status, amount = 0, timeString = '') {
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Carrega a Logo Hype
    let logoImg = null;
    try {
        const logoPath = path.join(__dirname, 'logo.png');
        logoImg = await loadImage(logoPath);
    } catch (e) {
        console.error("Erro ao carregar logo.png para o Daily");
    }

    // ==========================================
    // 1. FUNDO PREMIUM (Ambiente Noturno / Cofre)
    // ==========================================
    const bgGrad = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width);
    
    if (status === 'detonating') {
        bgGrad.addColorStop(0, '#450a0a'); // Vermelho Fogo
        bgGrad.addColorStop(1, '#050505');
    } else if (status === 'success') {
        bgGrad.addColorStop(0, '#064e3b'); // Verde Esmeralda
        bgGrad.addColorStop(1, '#022c22');
    } else if (status === 'robbing') {
        bgGrad.addColorStop(0, '#0f172a'); // Azul Profundo
        bgGrad.addColorStop(1, '#020617');
    } else {
        bgGrad.addColorStop(0, '#1e1e24'); // Cinza/Azul escuro
        bgGrad.addColorStop(1, '#09090b');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Grelha de Segurança
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < width; i += 30) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
    for (let i = 0; i < height; i += 30) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

    // ==========================================
    // 2. LOGO GIGANTE NO FUNDO (Marca D'água)
    // ==========================================
    if (logoImg) {
        const logoW = 400; 
        const logoH = logoW * (logoImg.height / logoImg.width);
        ctx.save();
        ctx.globalAlpha = status === 'success' ? 0.08 : 0.03; 
        ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(logoImg, (width - logoW) / 2, (height - logoH) / 2, logoW, logoH);
        ctx.restore();
    }

    // ==========================================
    // 3. EFEITOS E ÍCONES PRINCIPAIS POR ESTADO
    // ==========================================
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Tamanho do ícone central (a logo)
    const iconW = 100;
    const iconH = logoImg ? iconW * (logoImg.height / logoImg.width) : 100;
    const iconX = (width - iconW) / 2;
    const iconY = height / 2 - 90; // Sobe o ícone para dar espaço ao texto

    if (status === 'cooldown') {
        // ÍCONE CENTRAL VERMELHO
        if (logoImg) {
            ctx.shadowColor = '#ED4245'; ctx.shadowBlur = 40;
            tintLogo(ctx, logoImg, iconX, iconY, iconW, iconH, '#ED4245');
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = '#ED4245';
        ctx.font = '900 45px "Arial Black", sans-serif';
        ctx.fillText('ÁREA ISOLADA', width / 2, height / 2 + 20);
        
        ctx.fillStyle = '#a1a1aa';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`Próximo carro-forte em: ${timeString}`, width / 2, height / 2 + 70);
    } 
    else if (status === 'robbing') {
        // ÍCONE CENTRAL AZUL NÉON
        if (logoImg) {
            ctx.shadowColor = '#3b82f6'; ctx.shadowBlur = 40;
            tintLogo(ctx, logoImg, iconX, iconY, iconW, iconH, '#3b82f6');
            ctx.shadowBlur = 0;
        }
        
        ctx.fillStyle = '#3b82f6'; 
        ctx.font = '900 40px "Arial Black", sans-serif';
        ctx.fillText('HACKEANDO BLINDAGEM...', width / 2, height / 2 + 20);
        
        // BARRA DE PROGRESSO
        const barW = 400; const barH = 20;
        const barX = (width - barW) / 2; const barY = height / 2 + 70;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barW, barH); 
        ctx.fillStyle = '#3b82f6';
        ctx.shadowColor = '#3b82f6'; ctx.shadowBlur = 15;
        ctx.fillRect(barX, barY, barW * 0.45, barH); 
        ctx.shadowBlur = 0;
    }
    else if (status === 'detonating') {
        // Efeito de Flash Vermelho
        ctx.save();
        ctx.beginPath(); ctx.arc(width/2, height/2, 250, 0, Math.PI * 2);
        const flashGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, 250);
        flashGrad.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
        flashGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = flashGrad; ctx.fill(); ctx.restore();

        // ÍCONE CENTRAL LARANJA (A Tremer)
        if (logoImg) {
            ctx.save();
            ctx.translate(width / 2, iconY + iconH / 2);
            ctx.rotate(0.1); // Dá uma leve inclinada de explosão
            ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 50;
            tintLogo(ctx, logoImg, -iconW/2, -iconH/2, iconW, iconH, '#f59e0b');
            ctx.restore();
        }
        
        ctx.fillStyle = '#f59e0b'; // Laranja
        ctx.font = '900 50px "Arial Black", sans-serif';
        ctx.fillText('DETONANDO PORTAS!', width / 2, height / 2 + 40);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px Arial';
        ctx.fillText('O cofre está prestes a ceder...', width / 2, height / 2 + 90);
    }
    else if (status === 'success') {
        // ÍCONE CENTRAL VERDE ESMERALDA
        if (logoImg) {
            ctx.shadowColor = '#57F287'; ctx.shadowBlur = 50;
            tintLogo(ctx, logoImg, iconX, iconY - 10, iconW, iconH, '#57F287');
            ctx.shadowBlur = 0;
        }
        
        // Texto de Lucro com Gradiente Dourado
        const textGrad = ctx.createLinearGradient(0, height / 2 + 10, 0, height / 2 + 90);
        textGrad.addColorStop(0, '#fef08a'); textGrad.addColorStop(1, '#eab308');
        
        ctx.fillStyle = textGrad;
        ctx.font = '900 65px "Arial Black", sans-serif';
        ctx.fillText(`+ ${amount.toLocaleString('pt-BR')} HC`, width / 2, height / 2 + 35);
        
        ctx.fillStyle = '#a7f3d0';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('FUGA SUCEDIDA! MALOTES GARANTIDOS.', width / 2, height / 2 + 100);
    }

    // ==========================================
    // 4. MOLDURA CINEMÁTICA
    // ==========================================
    ctx.save();
    const borderGrad = ctx.createLinearGradient(0, 0, width, height);
    if (status === 'success') {
        borderGrad.addColorStop(0, '#fde047'); borderGrad.addColorStop(1, '#ca8a04'); // Ouro
    } else if (status === 'detonating') {
        borderGrad.addColorStop(0, '#ef4444'); borderGrad.addColorStop(1, '#991b1b'); // Vermelho
    } else if (status === 'robbing') {
        borderGrad.addColorStop(0, '#38bdf8'); borderGrad.addColorStop(1, '#1d4ed8'); // Azul
    } else {
        borderGrad.addColorStop(0, '#3f3f46'); borderGrad.addColorStop(1, '#18181b'); // Policial
    }
    
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 14;
    drawRoundRectPath(ctx, 7, 7, width - 14, height - 14, 15);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    drawRoundRectPath(ctx, 16, 16, width - 32, height - 32, 10);
    ctx.stroke();
    ctx.restore();

    return canvas.toBuffer('image/png');
}

module.exports = { generateDailyImage };