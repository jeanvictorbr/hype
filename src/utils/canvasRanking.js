const { createCanvas, loadImage } = require('canvas');
const path = require('path');

function drawRoundRect(ctx, x, y, w, h, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y); ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius); ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
}

async function generateRankingImage(players, page, totalPages, guildName) {
    const width = 800;
    // Altura dinâmica: 150px de cabeçalho + 65px por cada jogador na lista
    const height = 150 + (players.length * 65); 
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Fundo Escuro Premium
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(width/2, 0, 0, width/2, 0, 600);
    glow.addColorStop(0, 'rgba(212, 175, 55, 0.15)'); // Brilho dourado no topo
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);

    // ==========================================
    // 2. CABEÇALHO (LOGO + TÍTULO)
    // ==========================================
    ctx.fillStyle = '#0000FF'; 
    ctx.font = '900 40px "Arial Black", sans-serif'; // Fonte um pouco menor para caber perfeito com a logo
    ctx.textBaseline = 'middle';
    
    const titleText = 'RANKING DO(A)S MAGNATAS';
    const textWidth = ctx.measureText(titleText).width;

    try {
        // Puxa a logo da Hype
        const logo = await loadImage(path.join(__dirname, 'logo.png'));
        const logoWidth = 55;
        const logoHeight = logoWidth * (logo.height / logo.width);
        
        // Calcula o centro combinando o tamanho da Logo + Espaço + Texto
        const totalWidth = logoWidth + 20 + textWidth;
        const startX = (width - totalWidth) / 2;

        // Desenha a Logo
        ctx.drawImage(logo, startX, 50 - (logoHeight / 2), logoWidth, logoHeight);
        
        // Desenha o Texto logo a seguir
        ctx.textAlign = 'left';
        ctx.shadowColor = '#0000FF'; ctx.shadowBlur = 15;
        ctx.fillText(titleText, startX + logoWidth + 20, 50);
        ctx.shadowBlur = 0;

    } catch (e) {
        // Se por acaso a logo não carregar, desenha só o texto centralizado
        ctx.textAlign = 'center';
        ctx.shadowColor = '#0000FF'; ctx.shadowBlur = 15;
        ctx.fillText(titleText, width/2, 50);
        ctx.shadowBlur = 0;
    }

    ctx.fillStyle = '#a1a1aa'; ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Servidor: ${guildName}  •  Página ${page}/${totalPages}`, width/2, 100);

    // ==========================================
    // 3. DESENHAR A LISTA DE JOGADORES
    // ==========================================
    let startY = 130;
    for (let i = 0; i < players.length; i++) {
        const p = players[i];
        const isTop1 = p.rank === 1;
        const isTop2 = p.rank === 2;
        const isTop3 = p.rank === 3;

        // Cores Dinâmicas para o Pódio
        const bgColor = isTop1 ? 'rgba(250, 204, 21, 0.15)' : 
                        isTop2 ? 'rgba(161, 161, 170, 0.15)' : 
                        isTop3 ? 'rgba(180, 83, 9, 0.15)' : 'rgba(255, 255, 255, 0.03)';
        
        const strokeColor = isTop1 ? '#0000FF' : isTop2 ? '#d4d4d8' : isTop3 ? '#b45309' : '#333333';

        ctx.save();
        ctx.fillStyle = bgColor;
        drawRoundRect(ctx, 40, startY, width - 80, 55, 12);
        ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = strokeColor; ctx.stroke();

        // Número da Posição (Sem Emojis para não bugar no Linux)
        ctx.fillStyle = strokeColor; ctx.font = '900 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`#${p.rank}`, 80, startY + 28);

        // Avatar do Jogador
        if (p.avatarBuffer) {
            try {
                const avatar = await loadImage(p.avatarBuffer);
                ctx.save(); ctx.beginPath();
                ctx.arc(140, startY + 27, 20, 0, Math.PI * 2);
                ctx.closePath(); ctx.clip();
                ctx.drawImage(avatar, 120, startY + 7, 40, 40);
                ctx.restore();
            } catch(e) {}
        } else {
            ctx.fillStyle = '#3f3f46'; ctx.beginPath();
            ctx.arc(140, startY + 27, 20, 0, Math.PI * 2); ctx.fill();
        }

        // Nome
        ctx.fillStyle = isTop1 ? '#0000FF' : '#ffffff';
        ctx.textAlign = 'left';
        ctx.font = isTop1 ? 'bold 22px Arial' : 'bold 20px Arial';
        let name = p.username.length > 18 ? p.username.substring(0, 18) + '...' : p.username;
        ctx.fillText(name, 180, startY + 28);

        // Saldo (Pontuação)
        ctx.fillStyle = '#57F287';
        ctx.textAlign = 'right';
        ctx.font = 'bold 22px Arial';
        ctx.fillText(`R$ ${p.score.toLocaleString('pt-BR')}`, width - 60, startY + 28);

        ctx.restore();
        startY += 65; // Pula para a próxima linha
    }

    return canvas.toBuffer('image/png');
}

module.exports = { generateRankingImage };