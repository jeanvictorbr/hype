const { createCanvas, loadImage } = require('canvas');
const path = require('path');

// Função para pintar a logo
function tintLogo(ctx, img, x, y, width, height, colorStr) {
    const tempCanvas = createCanvas(width, height);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(img, 0, 0, width, height);
    tempCtx.globalCompositeOperation = 'source-in';
    tempCtx.fillStyle = colorStr;
    tempCtx.fillRect(0, 0, width, height);
    ctx.drawImage(tempCanvas, x, y, width, height);
}

// Função auxiliar para desenhar brilhos de néon INTENSOS
function drawNeonCircle(ctx, x, y, radius, color, blur) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    // Camada dupla de brilho para mais intensidade
    ctx.shadowColor = color; ctx.shadowBlur = blur;
    ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.stroke();
    ctx.shadowBlur = blur / 2; ctx.globalAlpha = 0.7; ctx.stroke();
    ctx.restore();
}

// Função para desenhar o TAMBOR ULTRA-REALISTA com a BALA
// bulletIndex: onde a bala está (0-5). Se -1, não desenha bala (ex: lobby)
function drawRealisticChamber(ctx, x, y, radius, angle, state, bulletIndex = -1) {
    ctx.save();
    ctx.translate(x, y);
    if (state === 'spinning') ctx.rotate(angle + Math.random()*0.5); else ctx.rotate(angle);

    // 1. CORPO DO METAL (Aço Escovado com Reflexos)
    const metalGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
    metalGrad.addColorStop(0, '#374151'); // Cinza escuro
    metalGrad.addColorStop(0.4, '#9ca3af'); // Reflexo metálico
    metalGrad.addColorStop(0.5, '#d1d5db'); // Brilho forte
    metalGrad.addColorStop(0.6, '#6b7280');
    metalGrad.addColorStop(1, '#1f2937'); // Sombra

    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2);
    ctx.fillStyle = metalGrad; ctx.fill();
    
    // Textura de "ruído" metálico
    ctx.globalAlpha = 0.1; ctx.fillStyle = '#000000';
    for(let i=0; i<500; i++) {
        const rx = (Math.random()-0.5)*radius*2; const ry = (Math.random()-0.5)*radius*2;
        if(rx*rx + ry*ry < radius*radius) ctx.fillRect(rx,ry,1,1);
    }
    ctx.globalAlpha = 1;

    // Borda Biselada (Efeito 3D na borda do tambor)
    ctx.beginPath(); ctx.arc(0, 0, radius-2, 0, Math.PI*2);
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2);
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.stroke();

    // 2. AS CÂMARAS E A BALA
    for(let i=0; i<6; i++) {
        const hAngle = (i / 6) * Math.PI * 2;
        const hRadius = radius * 0.65;
        const hSize = radius * 0.22;
        const hX = Math.cos(hAngle) * hRadius; const hY = Math.sin(hAngle) * hRadius;
        
        // Buraco escuro com profundidade
        const holeGrad = ctx.createRadialGradient(hX, hY, hSize*0.8, hX, hY, hSize+2);
        holeGrad.addColorStop(0, '#000000'); holeGrad.addColorStop(1, '#374151');
        ctx.beginPath(); ctx.arc(hX, hY, hSize, 0, Math.PI*2); ctx.fillStyle = holeGrad; ctx.fill();
        // Borda interna do buraco
        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.stroke();

        // ---> DESENHAR A BALA SE FOR O ÍNDICE CORRETO <---
        if (i === bulletIndex) {
            // Base de Latão (Brass)
            const brassGrad = ctx.createRadialGradient(hX, hY, 0, hX, hY, hSize*0.9);
            brassGrad.addColorStop(0.5, '#ca8a04'); // Ouro escuro
            brassGrad.addColorStop(0.8, '#facc15'); // Ouro brilhante
            brassGrad.addColorStop(1, '#854d0e'); // Borda do latão
            ctx.beginPath(); ctx.arc(hX, hY, hSize*0.85, 0, Math.PI*2); ctx.fillStyle = brassGrad; ctx.fill();

            // Espoleta central (Primer) - Prata/Cobre
            const primerGrad = ctx.createRadialGradient(hX, hY, 0, hX, hY, hSize*0.3);
            primerGrad.addColorStop(0, '#d1d5db'); primerGrad.addColorStop(1, '#9ca3af');
            ctx.beginPath(); ctx.arc(hX, hY, hSize*0.3, 0, Math.PI*2); ctx.fillStyle = primerGrad; ctx.fill();
            ctx.lineWidth = 0.5; ctx.strokeStyle = '#4b5563'; ctx.stroke();

            // Reflexo na bala
            ctx.beginPath(); ctx.ellipse(hX-hSize*0.3, hY-hSize*0.3, hSize*0.2, hSize*0.1, Math.PI/4, 0, Math.PI*2);
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
        }
    }

    // Reflexo de luz especular no topo do tambor (o "brilho" final)
    ctx.beginPath(); ctx.ellipse(-radius*0.3, -radius*0.3, radius*0.5, radius*0.2, Math.PI/-4, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();

    ctx.restore();
}

async function generateRoletaImage(state, players, targetIndex = -1, potAmount = 0) {
    const width = 800; const height = 600;
    const canvas = createCanvas(width, height); const ctx = canvas.getContext('2d');

    let logoImg = null;
    try { logoImg = await loadImage(path.join(__dirname, 'logo.png')); } catch (e) {}

    // ==========================================
    // 1. FUNDO DRAMÁTICO (Mais escuro e focado)
    // ==========================================
    const tableGrad = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width);
    tableGrad.addColorStop(0, '#450a0a'); // Vermelho sangue muito escuro no centro
    tableGrad.addColorStop(0.6, '#1a0505'); 
    tableGrad.addColorStop(1, '#000000'); // Preto total nas bordas
    ctx.fillStyle = tableGrad; ctx.fillRect(0, 0, width, height);

    // Vinheta agressiva
    const vignette = ctx.createRadialGradient(width/2, height/2, width*0.3, width/2, height/2, width*0.9);
    vignette.addColorStop(0, 'transparent'); vignette.addColorStop(1, 'rgba(0,0,0,0.95)');
    ctx.fillStyle = vignette; ctx.fillRect(0,0,width,height);

    // Efeitos de Flash de Luz (Tensão)
    if (state === 'shoot') {
        const flash = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
        flash.addColorStop(0, 'rgba(220, 38, 38, 0.6)'); flash.addColorStop(1, 'transparent');
        ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = flash; ctx.fillRect(0, 0, width, height); ctx.globalCompositeOperation = 'source-over';
    }

    // ==========================================
    // 2. POTE TOTAL (Topo)
    // ==========================================
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fef08a'; ctx.font = '900 40px "Arial Black", sans-serif';
    ctx.shadowColor = '#ca8a04'; ctx.shadowBlur = 30;
    
    let potText = `${potAmount.toLocaleString('pt-BR')} HC`;
    if (logoImg) {
        const logoSize = 50; const logoH = logoSize * (logoImg.height / logoImg.width);
        tintLogo(ctx, logoImg, width/2 - 150, 50 - logoH/2, logoSize, logoH, '#fbbf24');
        ctx.fillText(potText, width/2 + 30, 50);
    } else {
        ctx.fillText(`POTE: ${potText}`, width/2, 50);
    }
    ctx.shadowBlur = 0;

    // ==========================================
    // 3. JOGADORES EM CÍRCULO (Bases de Néon Intensas)
    // ==========================================
    const centerX = width / 2; const centerY = height / 2 + 30;
    const radius = 180; const avatarSize = 90;

    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius; const y = centerY + Math.sin(angle) * radius;

        let neonColor = '#38bdf8'; let neonBlur = 30;

        if (players[i]) {
            const p = players[i];
            if (p.isDead) { neonColor = '#ef4444'; neonBlur = 20; } 
            else if (state === 'winner' && !p.isDead) { neonColor = '#fbbf24'; neonBlur = 60; } 
            else if (i === targetIndex) { neonColor = '#ef4444'; neonBlur = 50; } 

            // Base de Vidro/Néon
            ctx.save();
            ctx.beginPath(); ctx.arc(x, y, avatarSize/2 + 10, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fill(); 
            drawNeonCircle(ctx, x, y, avatarSize/2 + 10, neonColor, neonBlur); 
            ctx.restore();

            // Avatar
            try {
                if (p.avatarBuffer) {
                    ctx.save(); ctx.beginPath(); ctx.arc(x, y, avatarSize/2, 0, Math.PI * 2);
                    ctx.closePath(); ctx.clip();
                    if (p.isDead) { ctx.globalCompositeOperation = 'luminosity'; ctx.globalAlpha = 0.6; }
                    const img = await loadImage(p.avatarBuffer);
                    ctx.drawImage(img, x - avatarSize/2, y - avatarSize/2, avatarSize, avatarSize);
                    
                    if (p.isDead) {
                        ctx.globalCompositeOperation = 'overlay';
                        const bloodGrad = ctx.createRadialGradient(x, y, 0, x, y, avatarSize/2);
                        bloodGrad.addColorStop(0, 'rgba(220, 38, 38, 0.9)'); bloodGrad.addColorStop(1, 'transparent');
                        ctx.fillStyle = bloodGrad; ctx.fillRect(x-avatarSize/2, y-avatarSize/2, avatarSize, avatarSize);
                    }
                    ctx.restore();
                }
            } catch(e) {}

            // Nome
            ctx.fillStyle = p.isDead ? '#ef4444' : '#ffffff'; ctx.font = 'bold 16px Arial';
            ctx.shadowColor = 'rgba(0,0,0,1)'; ctx.shadowBlur = 5;
            let name = p.username.length > 12 ? p.username.substring(0, 12) + '...' : p.username;
            ctx.fillText(name, x, y + 70);

        } else {
            // Cadeira Vazia
            ctx.save(); ctx.globalAlpha = 0.4;
            drawNeonCircle(ctx, x, y, avatarSize/2, '#38bdf8', 15);
            ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 14px Arial'; ctx.fillText('LIVRE', x, y);
            ctx.restore();
        }
    }

    // ==========================================
    // 4. O TAMBOR METÁLICO CENTRAL (REALISTA)
    // ==========================================
    const gunRadius = 65;
    // No lobby ou winner, não mostra bala. Nos outros, mostra a bala na posição do alvo
    const bulletPos = (state === 'lobby' || state === 'winner') ? -1 : targetIndex;
    
    drawRealisticChamber(ctx, centerX, centerY, gunRadius, Math.random() * Math.PI * 2, state, bulletPos);

    if (state === 'lobby' && logoImg) {
        ctx.save(); ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 40;
        tintLogo(ctx, logoImg, centerX - 35, centerY - 35, 70, 70 * (logoImg.height / logoImg.width), '#38bdf8');
        ctx.restore();
    }

    // ==========================================
    // 5. O LASER (MIRA)
    // ==========================================
    if (targetIndex >= 0 && state !== 'lobby' && state !== 'winner') {
        const tAngle = (targetIndex / 6) * Math.PI * 2 - Math.PI / 2;
        ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(tAngle);
        
        const laserGrad = ctx.createLinearGradient(gunRadius, 0, radius - avatarSize/2, 0);
        laserGrad.addColorStop(0, 'rgba(255, 0, 0, 0.9)');
        laserGrad.addColorStop(1, 'rgba(255, 50, 50, 0.2)');
        
        ctx.beginPath();
        ctx.moveTo(gunRadius+5, -3); ctx.lineTo(radius - 60, -1); 
        ctx.lineTo(radius - 60, 1); ctx.lineTo(gunRadius+5, 3); 
        
        ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 30; ctx.fillStyle = laserGrad; ctx.fill();
        ctx.beginPath(); ctx.arc(radius - 50, 0, 8, 0, Math.PI*2); ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.restore();
    }

    // ==========================================
    // 6. BARRA DE STATUS INFERIOR
    // ==========================================
    const statusY = height - 60;
    let statusText = '', statusColor = '#ffffff';
    if (state === 'lobby') { statusText = `AGUARDANDO JOGADORES (${players.filter(p=>p).length}/6)`; statusColor = '#38bdf8'; }
    else if (state === 'spinning') { statusText = 'GIRANDO O TAMBOR...'; statusColor = '#f59e0b'; }
    else if (state === 'shoot') { statusText = '💥 DISPARO CONFIRMADO!'; statusColor = '#ef4444'; }
    else if (state === 'winner') { statusText = '👑 O ÚLTIMO SOBREVIVENTE!'; statusColor = '#fef08a'; }

    ctx.save();
    ctx.shadowColor = statusColor; ctx.shadowBlur = 25;
    ctx.fillStyle = statusColor; ctx.font = '900 28px "Arial Black", sans-serif';
    ctx.fillText(statusText, width/2, statusY);
    
    ctx.beginPath(); ctx.moveTo(width/2 - 150, statusY + 20); ctx.lineTo(width/2 + 150, statusY + 20);
    ctx.strokeStyle = statusColor; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();

    return canvas.toBuffer('image/png');
}
module.exports = { generateRoletaImage };