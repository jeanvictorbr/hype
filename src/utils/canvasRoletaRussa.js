const { createCanvas, loadImage } = require('canvas');
const path = require('path');

// Função auxiliar para desenhar caixas arredondadas (Pílulas/Badges)
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

// Função para pintar a logo sutilmente
function tintLogo(ctx, img, x, y, width, height, colorStr) {
    const tempCanvas = createCanvas(width, height);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0, width, height);
    tempCtx.globalCompositeOperation = 'source-in';
    tempCtx.fillStyle = colorStr;
    tempCtx.fillRect(0, 0, width, height);
    ctx.drawImage(tempCanvas, x, y, width, height);
}

// Função para desenhar o TAMBOR DE TUNGSTÉNIO ULTRA-REALISTA
function drawRealisticChamber(ctx, x, y, radius, angle, state, bulletIndex = -1) {
    ctx.save();
    ctx.translate(x, y);
    if (state === 'spinning') ctx.rotate(angle + Math.random() * 0.5); else ctx.rotate(angle);

    // Sombra projetada do tambor na mesa
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;

    // 1. CORPO DO METAL (Tungsténio / Aço Polido)
    const metalGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
    metalGrad.addColorStop(0, '#4b5563'); 
    metalGrad.addColorStop(0.3, '#1f2937'); 
    metalGrad.addColorStop(0.5, '#9ca3af'); // Brilho de luz
    metalGrad.addColorStop(0.7, '#111827'); 
    metalGrad.addColorStop(1, '#374151');

    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2);
    ctx.fillStyle = metalGrad; ctx.fill();
    ctx.shadowColor = 'transparent'; // Desliga sombra para o resto
    
    // Borda Biselada (Efeito 3D)
    ctx.beginPath(); ctx.arc(0, 0, radius-2, 0, Math.PI*2);
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2);
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.stroke();

    // 2. AS CÂMARAS E A BALA
    for(let i=0; i<6; i++) {
        const hAngle = (i / 6) * Math.PI * 2;
        const hRadius = radius * 0.65;
        const hSize = radius * 0.22;
        const hX = Math.cos(hAngle) * hRadius; const hY = Math.sin(hAngle) * hRadius;
        
        // Buraco escuro
        const holeGrad = ctx.createRadialGradient(hX, hY, hSize*0.5, hX, hY, hSize+2);
        holeGrad.addColorStop(0, '#000000'); holeGrad.addColorStop(1, '#111827');
        ctx.beginPath(); ctx.arc(hX, hY, hSize, 0, Math.PI*2); ctx.fillStyle = holeGrad; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.stroke();

        // BALA (Se for a sorteada)
        if (i === bulletIndex && state === 'shoot') {
            const brassGrad = ctx.createRadialGradient(hX, hY, 0, hX, hY, hSize*0.9);
            brassGrad.addColorStop(0.4, '#eab308'); // Ouro brilhante
            brassGrad.addColorStop(0.8, '#a16207'); // Ouro escuro
            brassGrad.addColorStop(1, '#422006'); // Sombra
            ctx.beginPath(); ctx.arc(hX, hY, hSize*0.85, 0, Math.PI*2); ctx.fillStyle = brassGrad; ctx.fill();

            // Espoleta central (Primer)
            ctx.beginPath(); ctx.arc(hX, hY, hSize*0.3, 0, Math.PI*2); 
            ctx.fillStyle = '#d1d5db'; ctx.fill();
            ctx.lineWidth = 0.5; ctx.strokeStyle = '#374151'; ctx.stroke();
        }
    }

    // Reflexo de luz especular no centro
    ctx.beginPath(); ctx.arc(0, 0, radius*0.2, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fill();

    ctx.restore();
}

async function generateRoletaImage(state, players, targetIndex = -1, potAmount = 0) {
    const width = 800; const height = 600;
    const canvas = createCanvas(width, height); const ctx = canvas.getContext('2d');

    let logoImg = null;
    try { logoImg = await loadImage(path.join(__dirname, 'logo.png')); } catch (e) {}

    // ==========================================
    // 1. FUNDO CLEAN & PREMIUM (Mesa de Cassino VIP)
    // ==========================================
    ctx.fillStyle = '#0f1015'; // Fundo base Slate super escuro
    ctx.fillRect(0, 0, width, height);

    // Holofote central suave
    const tableGrad = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width*0.8);
    tableGrad.addColorStop(0, 'rgba(255, 255, 255, 0.06)'); // Luz bem difusa
    tableGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = tableGrad; ctx.fillRect(0, 0, width, height);

    // Anel guia na mesa (liga as cadeiras) sutil
    ctx.beginPath();
    ctx.arc(width/2, height/2 + 20, 180, 0, Math.PI * 2);
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; ctx.stroke();

    // Flash de disparo (Vermelho Clean)
    if (state === 'shoot') {
        const flash = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width*0.7);
        flash.addColorStop(0, 'rgba(220, 38, 38, 0.25)'); // Vermelho menos estourado
        flash.addColorStop(1, 'transparent');
        ctx.fillStyle = flash; ctx.fillRect(0, 0, width, height);
    }

    // ==========================================
    // 2. POTE TOTAL (Badge Moderno no Topo)
    // ==========================================
    ctx.font = '900 32px "Arial Black", sans-serif';
    let potText = `${potAmount.toLocaleString('pt-BR')} HC`;
    const textWidth = ctx.measureText(potText).width;
    
    const badgeW = textWidth + 100;
    const badgeH = 56;
    const badgeX = (width - badgeW) / 2;
    const badgeY = 25;

    // Fundo da Badge
    ctx.fillStyle = 'rgba(15, 16, 21, 0.8)';
    drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 28);
    ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)'; ctx.stroke();

    // Texto do Pote
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#facc15'; // Dourado
    ctx.fillText(potText, width/2 + 10, badgeY + (badgeH/2));

    if (logoImg) {
        const logoSize = 36; 
        tintLogo(ctx, logoImg, badgeX + 20, badgeY + 10, logoSize, logoSize * (logoImg.height / logoImg.width), '#facc15');
    }

    // ==========================================
    // 3. JOGADORES EM CÍRCULO (UI App-Like)
    // ==========================================
    const centerX = width / 2; const centerY = height / 2 + 20;
    const radius = 180; const avatarSize = 84; 

    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius; const y = centerY + Math.sin(angle) * radius;

        if (players[i]) {
            const p = players[i];
            
            // Definição de Cores do Anel
            let ringColor = '#38bdf8'; // Azul padrão (Vivo)
            if (p.isDead) ringColor = '#ef4444'; // Vermelho Morte
            else if (state === 'winner' && !p.isDead) ringColor = '#fbbf24'; // Ouro Vencedor
            else if (i === targetIndex) ringColor = '#f87171'; // Alvo atual

            // Fundo escuro do Avatar
            ctx.beginPath(); ctx.arc(x, y, avatarSize/2, 0, Math.PI * 2);
            ctx.fillStyle = '#181a20'; ctx.fill();

            // Avatar do Jogador
            try {
                if (p.avatarBuffer) {
                    ctx.save(); ctx.beginPath(); ctx.arc(x, y, avatarSize/2, 0, Math.PI * 2);
                    ctx.closePath(); ctx.clip();
                    
                    if (p.isDead) { ctx.globalCompositeOperation = 'luminosity'; ctx.globalAlpha = 0.5; }
                    const img = await loadImage(p.avatarBuffer);
                    ctx.drawImage(img, x - avatarSize/2, y - avatarSize/2, avatarSize, avatarSize);
                    
                    // Overlay de Morte Limpo (Sem borrões de sangue, apenas um "Dark Red" premium)
                    if (p.isDead) {
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.fillStyle = 'rgba(153, 27, 27, 0.6)';
                        ctx.fillRect(x - avatarSize/2, y - avatarSize/2, avatarSize, avatarSize);
                        // Desenha um "X" vermelho bem limpo e fino
                        ctx.beginPath();
                        ctx.moveTo(x - 20, y - 20); ctx.lineTo(x + 20, y + 20);
                        ctx.moveTo(x + 20, y - 20); ctx.lineTo(x - 20, y + 20);
                        ctx.lineWidth = 4; ctx.strokeStyle = '#f87171'; ctx.stroke();
                    }
                    ctx.restore();
                }
            } catch(e) {}

            // Anel envolvente (Stroke limpo)
            ctx.beginPath(); ctx.arc(x, y, avatarSize/2 + 4, 0, Math.PI * 2);
            ctx.lineWidth = 3; ctx.strokeStyle = ringColor; ctx.stroke();
            
            // Efeito de Glow apenas no anel
            ctx.shadowColor = ringColor; ctx.shadowBlur = 15;
            ctx.stroke(); ctx.shadowBlur = 0;

            // Badge do Nome (Pílula abaixo do avatar)
            ctx.font = '600 14px sans-serif';
            let name = p.username.length > 12 ? p.username.substring(0, 12) + '...' : p.username;
            const nameW = ctx.measureText(name).width + 24;
            
            ctx.fillStyle = 'rgba(15, 16, 21, 0.85)';
            drawRoundRect(ctx, x - nameW/2, y + avatarSize/2 + 8, nameW, 24, 12);
            ctx.fill();
            
            ctx.fillStyle = p.isDead ? '#f87171' : '#ffffff';
            ctx.fillText(name, x, y + avatarSize/2 + 21);

        } else {
            // 🪑 CADEIRA VAZIA (Design Intuitivo tracejado)
            ctx.beginPath(); ctx.arc(x, y, avatarSize/2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.02)'; ctx.fill();
            
            ctx.save();
            ctx.setLineDash([6, 6]); // Borda tracejada moderna
            ctx.lineWidth = 2; ctx.strokeStyle = '#3f3f46'; ctx.stroke();
            ctx.restore();

            ctx.fillStyle = '#71717a'; ctx.font = '600 14px sans-serif';
            ctx.fillText('LIVRE', x, y + 5);
        }
    }

    // ==========================================
    // 4. O TAMBOR METÁLICO CENTRAL
    // ==========================================
    const gunRadius = 60;
    const bulletPos = (state === 'lobby' || state === 'winner') ? -1 : targetIndex;
    drawRealisticChamber(ctx, centerX, centerY, gunRadius, Math.random() * Math.PI * 2, state, bulletPos);

    // ==========================================
    // 5. O LASER (Mira Moderna e Direta)
    // ==========================================
    if (targetIndex >= 0 && state !== 'lobby' && state !== 'winner') {
        const tAngle = (targetIndex / 6) * Math.PI * 2 - Math.PI / 2;
        ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(tAngle);
        
        // Uma linha fina e cortante de laser vermelho
        const laserGrad = ctx.createLinearGradient(gunRadius, 0, radius - avatarSize/2 - 10, 0);
        laserGrad.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
        laserGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        
        ctx.beginPath();
        ctx.moveTo(gunRadius + 5, 0); ctx.lineTo(radius - 55, 0);
        ctx.lineWidth = 3; ctx.strokeStyle = laserGrad; 
        ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 10;
        ctx.stroke();
        
        // Ponto de impacto na direção da cadeira
        ctx.beginPath(); ctx.arc(radius - 55, 0, 4, 0, Math.PI*2); 
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.restore();
    }

    // ==========================================
    // 6. BARRA DE STATUS (Inferior - Badge Style)
    // ==========================================
    let statusText = '', statusColor = '#ffffff', statusBg = 'rgba(15, 16, 21, 0.8)';
    
    if (state === 'lobby') { statusText = `AGUARDANDO JOGADORES (${players.filter(p=>p).length}/6)`; statusColor = '#38bdf8'; }
    else if (state === 'spinning') { statusText = 'GIRANDO O TAMBOR...'; statusColor = '#facc15'; }
    else if (state === 'shoot') { statusText = '💥 DISPARO CONFIRMADO!'; statusColor = '#f87171'; statusBg = 'rgba(69, 10, 10, 0.8)'; }
    else if (state === 'click') { statusText = '💨 CLIQUE VAZIO... NINGUÉM MORREU!'; statusColor = '#34d399'; statusBg = 'rgba(6, 78, 59, 0.8)'; } // 👈 NOVO ESTADO
    else if (state === 'winner') { statusText = '👑 O ÚLTIMO SOBREVIVENTE!'; statusColor = '#facc15'; }

    ctx.font = '900 20px "Arial Black", sans-serif';
    const statusW = ctx.measureText(statusText).width + 60;
    const statusH = 46;
    const statusX = (width - statusW) / 2;
    const statusY = height - 70;

    // Fundo da Badge Status
    ctx.fillStyle = statusBg;
    drawRoundRect(ctx, statusX, statusY, statusW, statusH, 23);
    ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.stroke();

    // Texto Status
    ctx.fillStyle = statusColor;
    ctx.shadowColor = statusColor; ctx.shadowBlur = 10; // Leve brilho no texto
    ctx.fillText(statusText, width/2, statusY + (statusH/2) + 2);

    return canvas.toBuffer('image/png');
}

module.exports = { generateRoletaImage };