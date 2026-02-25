const { createCanvas, loadImage } = require('canvas');
const path = require('path');

// Função auxiliar para desenhar cantos arredondados
function drawRoundRectPath(ctx, x, y, w, h, radius) {
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius); ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
}

// Efeito de vidro fosco (Glassmorphism)
function drawGlassBox(ctx, x, y, w, h, radius, themeColor) {
    ctx.save();
    drawRoundRectPath(ctx, x, y, w, h, radius);
    ctx.clip();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(x, y, w, h);

    const gradTop = ctx.createLinearGradient(x, y, x, y + h/2);
    gradTop.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradTop.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = gradTop;
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = themeColor;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.restore();
}

// 🌌 GERAÇÃO PROCEDURAL DOS TEMAS (A Mágica Matemática)
function drawProceduralBackground(ctx, width, height, themeStr) {
    if (themeStr === 'galaxy') {
        // Tema Galáxia (Nebulosa e Estrelas)
        const bgGrad = ctx.createRadialGradient(width/2, height, 0, width/2, height/2, width);
        bgGrad.addColorStop(0, '#4c1d95'); bgGrad.addColorStop(0.5, '#1e1b4b'); bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, width, height);

        // Nuvens de nebulosa (sobreposição de gradientes radiais gigantes)
        for(let i=0; i<3; i++) {
            ctx.globalAlpha = 0.3;
            ctx.globalCompositeOperation = 'screen';
            const nebula = ctx.createRadialGradient(Math.random()*width, Math.random()*height, 50, Math.random()*width, Math.random()*height, 400);
            nebula.addColorStop(0, i === 0 ? '#c084fc' : (i===1 ? '#38bdf8' : '#e879f9')); nebula.addColorStop(1, 'transparent');
            ctx.fillStyle = nebula; ctx.fillRect(0, 0, width, height);
        }
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;

        // Estrelas
        ctx.fillStyle = '#ffffff';
        for(let i=0; i<150; i++) {
            const r = Math.random();
            ctx.globalAlpha = r > 0.9 ? 1 : (r > 0.5 ? 0.5 : 0.2); // Algumas brilham mais
            ctx.beginPath(); ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;

    } else if (themeStr === 'hacker') {
        // Tema Hacker (Matrix Verde)
        ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, width, height);
        
        ctx.textAlign = 'center'; ctx.font = '14px monospace';
        const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        // Desenha "chuva" de código
        for(let x=0; x<width; x+=15) {
            let y = Math.random() * height; // Início aleatório
            for(let i=0; i<20; i++) { // Comprimento da cauda
                ctx.fillStyle = i === 0 ? '#ffffff' : `rgba(0, 255, 65, ${1 - (i/20)})`;
                ctx.fillText(chars.charAt(Math.floor(Math.random() * chars.length)), x, (y - (i*15) + height) % height);
            }
        }
        // Scanlines horizontais por cima
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        for(let i=0; i<height; i+=3) { ctx.fillRect(0, i, width, 1); }

    } else if (themeStr === 'gold') {
        // Tema Ouro Maciço (Reflexos Metálicos)
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#422006'); bgGrad.addColorStop(0.3, '#ca8a04'); 
        bgGrad.addColorStop(0.5, '#fef08a'); bgGrad.addColorStop(0.7, '#ca8a04'); bgGrad.addColorStop(1, '#422006');
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, width, height);

        // Ruído/Textura de Ouro
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        for(let i=0; i<3000; i++) { ctx.fillRect(Math.random()*width, Math.random()*height, 2, 2); }
        
        // Reflexos de luz circulares
        ctx.globalCompositeOperation = 'overlay';
        const shine = ctx.createRadialGradient(width*0.2, height*0.2, 0, width*0.2, height*0.2, 300);
        shine.addColorStop(0, 'rgba(255,255,255,0.6)'); shine.addColorStop(1, 'transparent');
        ctx.fillStyle = shine; ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';

    } else if (themeStr === 'blood') {
        // Tema Carmesim (Máfia / Fumaça Vermelha)
        const bgGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width*0.8);
        bgGrad.addColorStop(0, '#7f1d1d'); bgGrad.addColorStop(1, '#2a0404'); // Vermelho para Preto
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, width, height);

        // Fumaça escura procedural
        for(let i=0; i<5; i++) {
            ctx.beginPath();
            ctx.moveTo(0, height);
            ctx.quadraticCurveTo(Math.random()*width, Math.random()*height, width, height);
            ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath();
            ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + Math.random()*0.2})`;
            ctx.fill();
        }
    } else {
        // Tema Default (Azul Escuro Clean com Grelha)
        const bgGrad = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width);
        bgGrad.addColorStop(0, '#1e293b'); bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'; ctx.lineWidth = 1.5;
        for (let i = 0; i < width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
        for (let i = 0; i < height; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }
    }
}

async function generateProfileImage(userDiscord, userData, userRank) {
    const width = 800;
    const height = 480;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const themeStr = userData.profileTheme || 'default';
    
    // Define a cor de destaque principal baseada no tema
    let themeColor = '#38bdf8'; 
    switch(themeStr) {
        case 'hacker': themeColor = '#00ff41'; break;
        case 'galaxy': themeColor = '#c084fc'; break;
        case 'gold':   themeColor = '#fbbf24'; break;
        case 'blood':  themeColor = '#f87171'; break;
    }

    // 1. DESENHA O FUNDO PROCEDURAL
    drawProceduralBackground(ctx, width, height, themeStr);

    // Efeito Vinheta Escura nas bordas para focar nas caixas
    const vignette = ctx.createRadialGradient(width/2, height/2, width*0.4, width/2, height/2, width*0.8);
    vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, width, height);

    // ==========================================
    // 2. LOGO MARCA D'ÁGUA
    // ==========================================
    try {
        const logoImg = await loadImage(path.join(__dirname, 'logo.png'));
        const logoW = 350; const logoH = logoW * (logoImg.height / logoImg.width);
        ctx.save();
        ctx.globalAlpha = 0.08; ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(logoImg, width - logoW + 50, (height - logoH) / 2, logoW, logoH);
        ctx.restore();
    } catch(e) {}

    // ==========================================
    // 3. LÓGICA VIP (Cores do Avatar/Badge)
    // ==========================================
    let vipColor = '#94a3b8'; let vipName = 'Membro Comum'; let isVip = false;
    if (userData.vipLevel >= 5) { vipColor = '#ED4245'; vipName = '⭐ SUPREME'; isVip = true; }
    else if (userData.vipLevel === 4) { vipColor = '#FEE75C'; vipName = '⭐ ELITE'; isVip = true; }
    else if (userData.vipLevel === 3) { vipColor = '#9b59b6'; vipName = '⭐ EXCLUSIVE'; isVip = true; }
    else if (userData.vipLevel === 2) { vipColor = '#ffffff'; vipName = '⭐ PRIME'; isVip = true; }
    else if (userData.vipLevel === 1) { vipColor = '#ff85cd'; vipName = '⭐ VIP BOOSTER'; isVip = true; }

    // ==========================================
    // 4. AVATAR COM BRILHO
    // ==========================================
    const avatarX = 50; const avatarY = 50; const avatarSize = 130;
    ctx.save();
    ctx.shadowColor = vipColor; ctx.shadowBlur = isVip ? 35 : 15; 
    ctx.beginPath(); ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 + 3, 0, Math.PI * 2);
    ctx.fillStyle = vipColor; ctx.fill();
    ctx.restore();

    try {
        const avatarImg = await loadImage(userDiscord.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.save();
        ctx.beginPath(); ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 - 4, 0, Math.PI * 2);
        ctx.closePath(); ctx.clip();
        ctx.drawImage(avatarImg, avatarX + 4, avatarY + 4, avatarSize - 8, avatarSize - 8);
        ctx.restore();
    } catch(e) {}

    // ==========================================
    // 5. NOME & TAG VIP
    // ==========================================
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = '900 45px "Arial Black", sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,1)'; ctx.shadowBlur = 10;
    ctx.fillText(userDiscord.username.length > 15 ? userDiscord.username.substring(0, 15) + '...' : userDiscord.username, 210, 60);
    ctx.shadowBlur = 0;

    // Badge VIP 
    drawGlassBox(ctx, 210, 125, ctx.measureText(vipName).width + 70, 40, 10, vipColor);
    ctx.fillStyle = vipColor; ctx.font = 'bold 20px Arial';
    ctx.fillText(vipName, 225, 135);

    // ==========================================
    // 6. CAIXAS DE ESTATÍSTICAS (PREMIUM)
    // ==========================================
    const statY = 220;
    function drawPremiumStatBox(x, label, value, valueColor) {
        drawGlassBox(ctx, x, statY, 210, 90, 15, themeColor);
        
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#cbd5e1'; ctx.font = 'bold 18px Arial';
        ctx.fillText(label, x + 105, statY + 25);
        
        ctx.fillStyle = valueColor; ctx.font = '900 26px "Arial Black", sans-serif';
        ctx.shadowColor = valueColor; ctx.shadowBlur = 20;
        ctx.fillText(value, x + 105, statY + 65);
        ctx.shadowBlur = 0;
    }

    drawPremiumStatBox(50, '💰 Fortuna', `${(userData.hypeCash || 0).toLocaleString('pt-BR')} HC`, '#57F287');
    drawPremiumStatBox(295, '🏆 Rank Global', `#${userRank}`, '#38bdf8');
    drawPremiumStatBox(540, '⭐ Reputação', `${userData.rep || 0} Reps`, '#FEE75C');

    // ==========================================
    // 7. BIO BOX 
    // ==========================================
    const bioY = 340;
    drawGlassBox(ctx, 50, bioY, 700, 90, 15, themeColor);

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff'; ctx.font = 'italic 20px Arial';
    const bioText = userData.bio || "Membro da família Hype! Use o comando de perfil para mudar este texto.";
    const maxChars = 75;
    if(bioText.length > maxChars) {
        ctx.fillText(bioText.substring(0, maxChars) + '-', width/2, bioY + 30);
        ctx.fillText(bioText.substring(maxChars, maxChars*2) + (bioText.length > maxChars*2 ? '...' : ''), width/2, bioY + 60);
    } else {
        ctx.fillText(`"${bioText}"`, width/2, bioY + 45);
    }

    // ==========================================
    // 8. MOLDURA FINAL
    // ==========================================
    ctx.save();
    ctx.strokeStyle = themeColor; ctx.lineWidth = 10;
    ctx.shadowColor = themeColor; ctx.shadowBlur = 25;
    drawRoundRectPath(ctx, 5, 5, width - 10, height - 10, 20); ctx.stroke();
    ctx.restore();

    return canvas.toBuffer('image/png');
}

module.exports = { generateProfileImage };