const { createCanvas, loadImage } = require('canvas');
const path = require('path');

// Função de segurança para cantos arredondados
function drawRoundRect(ctx, x, y, w, h, radius) {
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius); ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
}

async function generateMalaWinImage(userDiscord, prize, password) {
    const width = 900;
    const height = 500; // Um pouco mais alto para destacar o vencedor
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Fundo Escuro Hacker Profundo
    const bgGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
    bgGrad.addColorStop(0, '#020f04'); // Verde escuro abissal
    bgGrad.addColorStop(1, '#000000'); // Preto total nas bordas
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Chuva de Dinheiro Procedural (Notas caindo em HD)
    ctx.fillStyle = 'rgba(87, 242, 135, 0.1)'; // Verde dinheiro translúcido
    for(let i=0; i<120; i++) {
        const px = Math.random() * width;
        const py = Math.random() * height;
        const pw = Math.random() * 20 + 10;
        const ph = pw * 0.55;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.random() * Math.PI); // Rotação aleatória
        ctx.fillRect(-pw/2, -ph/2, pw, ph);
        ctx.restore();
    }

    // 3. Brilho Néon de Sucesso no centro
    const successGlow = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, 600);
    successGlow.addColorStop(0, 'rgba(0, 255, 128, 0.2)');
    successGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = successGlow; ctx.fillRect(0, 0, width, height);

    // ==========================================
    // 4. O VENCEDOR (Avatar + Brilho)
    // ==========================================
    const cx = width / 2;
    const cy = 160;
    const avatarSize = 150; // Avatar grande para dar destaque

    ctx.save();
    // Brilho intenso verde néon atrás do avatar
    ctx.shadowColor = '#00ff80'; ctx.shadowBlur = 50; 
    ctx.beginPath(); ctx.arc(cx, cy, avatarSize/2 + 5, 0, Math.PI * 2);
    ctx.fillStyle = '#00ff80'; ctx.fill(); 
    ctx.restore();

    try {
        const avatarImg = await loadImage(userDiscord.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, avatarSize/2, 0, Math.PI * 2);
        ctx.closePath(); ctx.clip();
        ctx.drawImage(avatarImg, cx - avatarSize/2, cy - avatarSize/2, avatarSize, avatarSize);
        ctx.restore();
    } catch(e) {}

    // ==========================================
    // 5. TEXTOS DA VITÓRIA (Sem Emojis Bugados)
    // ==========================================
    ctx.textAlign = 'center';
    
    // Título Superior
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 45px "Arial Black", sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 10;
    ctx.fillText('ACESSO CONCEDIDO', width/2, 310);
    ctx.shadowBlur = 0;

    // Nome do Ganhador
    ctx.fillStyle = '#57F287'; // Verde grana
    ctx.font = 'bold 30px Arial';
    let name = userDiscord.username.length > 25 ? userDiscord.username.substring(0, 25) + '...' : userDiscord.username;
    ctx.fillText(`MALA HACKEADA POR: ${name}`, width/2, 360);

    // Visor Digital mostrando a senha correta (HD via código)
    ctx.fillStyle = '#111827'; // Fundo do visor escuro
    drawRoundRect(ctx, width/2 - 100, 380, 200, 50, 10); ctx.fill();
    ctx.strokeStyle = '#374151'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#facc15'; // Senha em amarelo LCD
    ctx.font = 'bold 30px monospace';
    ctx.fillText(`[ ${password} ]`, width/2, 415); // Mostra a senha vencedora!

    // Valor Ganho (Destaque Gigante)
    ctx.font = '900 65px "Arial Black", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00ff80'; ctx.shadowBlur = 30; // Brilho no prémio
    ctx.fillText(`R$ ${prize.toLocaleString('pt-BR')}`, width/2, 485);
    ctx.shadowBlur = 0;

    // 6. Logo da Hype (Canto superior direito, meio transparente)
    try {
        const logo = await loadImage(path.join(__dirname, 'logo.png'));
        const logoW = 90; 
        const logoH = logoW * (logo.height/logo.width);
        ctx.save();
        ctx.globalAlpha = 0.3; // Estilo marca d'água premium
        ctx.drawImage(logo, width - logoW - 30, 30, logoW, logoH);
        ctx.restore();
    } catch(e) {}

    return canvas.toBuffer('image/png');
}

module.exports = { generateMalaWinImage };