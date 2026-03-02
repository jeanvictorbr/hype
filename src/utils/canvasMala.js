const { createCanvas, loadImage } = require('canvas');
const path = require('path');

// Função de segurança para desenhar cantos arredondados (evita bugs em versões antigas do Canvas)
function drawRoundRect(ctx, x, y, w, h, radius) {
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius); ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
}

async function generateMalaImage(prize, cost) {
    const width = 900;
    const height = 450;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Fundo Escuro Premium (Cinza Azulado)
    const bgGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, 600);
    bgGrad.addColorStop(0, '#111827'); 
    bgGrad.addColorStop(1, '#030712'); 
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Luz de Alerta (Vermelho Néon) no topo
    const alertGlow = ctx.createRadialGradient(width/2, 0, 0, width/2, 0, 500);
    alertGlow.addColorStop(0, 'rgba(239, 68, 68, 0.25)'); // Vermelho Alerta
    alertGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = alertGlow; ctx.fillRect(0, 0, width, height);

    // 3. Desenhar um "Cadeado de Alta Segurança" HD via Código (Sem imagem externa)
    const cx = width / 2;
    const cy = 130;
    
    // Arco do cadeado (prata)
    ctx.beginPath(); ctx.arc(cx, cy - 20, 30, Math.PI, 0);
    ctx.lineWidth = 14; ctx.strokeStyle = '#9ca3af'; ctx.stroke();
    
    // Corpo do cadeado (vermelho)
    ctx.fillStyle = '#ef4444'; 
    ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 20;
    drawRoundRect(ctx, cx - 50, cy - 20, 100, 75, 12); ctx.fill();
    ctx.shadowBlur = 0;
    
    // Fechadura preta no centro do cadeado
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(cx, cy + 10, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - 4, cy + 10); ctx.lineTo(cx + 4, cy + 10); 
    ctx.lineTo(cx + 7, cy + 32); ctx.lineTo(cx - 7, cy + 32); ctx.fill();

    // 4. Título Principal (Sem Emojis)
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 45px "Arial Black", sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10;
    ctx.fillText('ACESSO BLOQUEADO', width/2, 250);
    ctx.shadowBlur = 0;

    // 5. Visor Digital de 3 Dígitos
    ctx.fillStyle = '#1f2937'; // Fundo do visor
    drawRoundRect(ctx, width/2 - 120, 270, 240, 60, 10); ctx.fill();
    ctx.strokeStyle = '#374151'; ctx.lineWidth = 3; ctx.stroke();
    
    ctx.fillStyle = '#facc15'; // Texto amarelo tipo tela LCD
    ctx.font = 'bold 35px monospace';
    ctx.fillText('[ * * * ]', width/2, 312); // Visor indicando 3 caracteres!

    // 6. Valores e Taxas
    ctx.font = '900 30px Arial';
    ctx.fillStyle = '#57F287'; // Verde grana
    ctx.fillText(`PRÊMIO: R$ ${prize.toLocaleString('pt-BR')}`, width/2, 375);
    
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#ef4444'; // Vermelho taxa
    ctx.fillText(`CUSTO: R$ ${cost.toLocaleString('pt-BR')} (Debitado do Banco)`, width/2, 415);

    // 7. Logo da Hype (Canto inferior esquerdo)
    try {
        const logo = await loadImage(path.join(__dirname, 'logo.png'));
        const logoW = 70; 
        const logoH = logoW * (logo.height/logo.width);
        ctx.save();
        ctx.globalAlpha = 0.4; 
        ctx.drawImage(logo, 30, height - logoH - 30, logoW, logoH);
        ctx.restore();
    } catch(e) {}

    return canvas.toBuffer('image/png');
}

module.exports = { generateMalaImage };