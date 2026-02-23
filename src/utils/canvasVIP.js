const { createCanvas, loadImage } = require('canvas');

/**
 * Gera um Banner Premium estilo "Card Hype VIP"
 */
async function generateVipBanner(user, guild, title, subtitle, colorHex) {
    const width = 800;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const isMoneyTheme = colorHex.toUpperCase().includes('D4AF37') || colorHex.toUpperCase().includes('FEE75C');

    // ==========================================================================
    // 1. FUNDO PREMIUM SÓBRIO (Controle de Brilho)
    // ==========================================================================
    // Fundo base BEM escuro para dar destaque ao dourado
    ctx.fillStyle = '#0a0a0c'; 
    ctx.fillRect(0, 0, width, height);

    // Spotlight muito mais suave, sem estourar o amarelo
    const avatarCenterX = 150;
    const avatarCenterY = height / 2;
    
    const spotlight = ctx.createRadialGradient(
        avatarCenterX, avatarCenterY, 10,
        width / 2, height / 2, width
    );
    // Usa uma versão mais escura da cor para o brilho do fundo
    spotlight.addColorStop(0, adjustColorBrightness(colorHex, -50)); 
    spotlight.addColorStop(0.5, '#0a0a0c'); 
    spotlight.addColorStop(1, '#050505');

    ctx.globalAlpha = 0.5; // Brilho de fundo reduzido pela metade
    ctx.fillStyle = spotlight;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1.0;

    // ==========================================================================
    // 2. MOLDURA "CARD PREMIUM"
    // ==========================================================================
    const borderPadding = 4;
    ctx.lineWidth = 3;
    ctx.strokeStyle = adjustColorBrightness(colorHex, -20); // Borda da cor do tema
    ctx.strokeRect(borderPadding, borderPadding, width - (borderPadding*2), height - (borderPadding*2));

    // ==========================================================================
    // 3. MARCA D'ÁGUA (Ícone do Servidor)
    // ==========================================================================
    if (guild.iconURL()) {
        try {
            const guildIcon = await loadImage(guild.iconURL({ extension: 'png', size: 512 }));
            ctx.save();
            ctx.globalAlpha = 0.08; // Ainda mais subtil para não sujar a leitura
            ctx.drawImage(guildIcon, width - 300, -50, 350, 350);
            ctx.restore();
        } catch (e) {}
    }

    // ==========================================================================
    // 4. SELO "HYPE VIP SYSTEM"
    // ==========================================================================
    ctx.save();
    ctx.fillStyle = colorHex;
    // Desenha uma fita no canto superior esquerdo
    ctx.beginPath();
    ctx.moveTo(borderPadding, borderPadding);
    ctx.lineTo(250, borderPadding);
    ctx.lineTo(230, 40);
    ctx.lineTo(borderPadding, 40);
    ctx.fill();

    ctx.fillStyle = '#000000'; // Texto escuro em cima da fita dourada
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('⭐ HYPE VIP SYSTEM', 20, 20 + borderPadding);
    ctx.restore();

    // ==========================================================================
    // 5. AVATAR PREMIUM
    // ==========================================================================
    const avatarSize = 140; // Um pouco menor para respirar
    const avatarX = avatarCenterX - (avatarSize / 2);
    const avatarY = avatarCenterY - (avatarSize / 2);

    // Glow do Avatar (Controlado)
    ctx.save();
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 30; // Glow menos estourado
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, (avatarSize / 2), 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();

    // Recorte do Avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    try {
        const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    } catch (e) {}
    ctx.restore();

    // Anéis do Avatar
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarSize / 2, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, (avatarSize / 2) + 5, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = colorHex;
    ctx.stroke();

    // ==========================================================================
    // 6. ELEMENTOS DECORATIVOS (Dinheiro ou Abstrato)
    // ==========================================================================
    ctx.save();
    ctx.globalAlpha = 0.9;
    if (isMoneyTheme) {
        // Moedas mais limpas, menos borradas
        drawCleanCoin(ctx, 450, 240, 30, colorHex);
        drawCleanCoin(ctx, 720, 90, 40, colorHex);
        drawCleanCoin(ctx, 270, 220, 20, colorHex);
    } else {
        // X vermelhos (ou da cor do tema)
        drawAbstractShape(ctx, 500, 220, 30, colorHex);
        drawAbstractShape(ctx, 700, 100, 40, colorHex);
    }
    ctx.restore();

    // ==========================================================================
    // 7. TIPOGRAFIA INTELIGENTE (Auto-Scale)
    // ==========================================================================
    const textStartX = 260; // Começa mais à direita
    const maxTextWidth = width - textStartX - 30; // Largura máxima antes de cortar
    
    let currentTextY = 120;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // -- TÍTULO --
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    // Encolhe a fonte se o título for gigante
    let titleFontSize = 55;
    ctx.font = `900 ${titleFontSize}px sans-serif`;
    while (ctx.measureText(title.toUpperCase()).width > maxTextWidth && titleFontSize > 30) {
        titleFontSize -= 2;
        ctx.font = `900 ${titleFontSize}px sans-serif`;
    }
    ctx.fillText(title.toUpperCase(), textStartX, currentTextY);

    // Remove sombras para os outros textos
    ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

    // -- SUBTÍTULO (Ação/Efeito) --
    currentTextY += 45;
    let subFontSize = 28;
    ctx.font = `italic 600 ${subFontSize}px sans-serif`;
    // A cor agora é um Amarelo/Dourado legível, e não um branco ofuscante
    ctx.fillStyle = isMoneyTheme ? '#FEE75C' : adjustColorBrightness(colorHex, 50);
    
    // Auto-scale do subtítulo
    while (ctx.measureText(subtitle).width > maxTextWidth && subFontSize > 18) {
        subFontSize -= 2;
        ctx.font = `italic 600 ${subFontSize}px sans-serif`;
    }
    ctx.fillText(subtitle, textStartX, currentTextY);

    // -- LINHA SEPARADORA --
    currentTextY += 25;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(textStartX, currentTextY);
    ctx.lineTo(textStartX + maxTextWidth, currentTextY);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.stroke();
    ctx.restore();

    // -- NOME DO AUTOR --
    currentTextY += 35;
    ctx.font = '500 24px sans-serif';
    ctx.fillStyle = '#AAAAAA'; // Cinza claro
    let authorText = `Ativado por: @${user.username}`;
    // Previne que o nome passe da borda
    if (ctx.measureText(authorText).width > maxTextWidth) {
        authorText = `Autor: @${user.username}`;
    }
    ctx.fillText(authorText, textStartX, currentTextY);

    return canvas.toBuffer('image/png');
}

// ==========================================================================
// FUNÇÕES DE DESENHO MELHORADAS E MAIS LIMPAS
// ==========================================================================

function drawCleanCoin(ctx, x, y, radius, color) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    // Fundo da moeda escuro com gradiente dourado
    const grad = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
    grad.addColorStop(0, adjustColorBrightness(color, 20));
    grad.addColorStop(1, adjustColorBrightness(color, -60));
    ctx.fillStyle = grad;
    ctx.fill();

    // Borda sólida
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.stroke();
    
    // Símbolo limpo
    ctx.fillStyle = color;
    ctx.font = `bold ${radius * 1.2}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', x, y + (radius*0.1));
    ctx.restore();
}

function drawAbstractShape(ctx, x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.5); 
    ctx.beginPath();
    ctx.moveTo(-size, -size/2); ctx.lineTo(size, size/2);
    ctx.moveTo(size, -size/2); ctx.lineTo(-size, size/2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
}

function adjustColorBrightness(hex, amount) {
    let useHash = false;
    if (hex[0] == "#") { hex = hex.slice(1); useHash = true; }
    let num = parseInt(hex, 16);
    let r = (num >> 16) + amount;
    if (r > 255) r = 255; else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amount;
    if (b > 255) b = 255; else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amount;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    return (useHash ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}

module.exports = { generateVipBanner };