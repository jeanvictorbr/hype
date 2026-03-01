const { createCanvas, loadImage } = require('canvas');
const path = require('path');

function drawRoundRectPath(ctx, x, y, w, h, radius) {
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius); ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
}

function hexToRgba(hex, alpha) {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawCleanGlassBox(ctx, x, y, w, h, radius) {
    ctx.save();
    ctx.fillStyle = 'rgba(20, 20, 25, 0.6)';
    drawRoundRectPath(ctx, x, y, w, h, radius);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 25; ctx.shadowOffsetY = 12;
    ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    const borderGrad = ctx.createLinearGradient(x, y, x + w, y + h);
    borderGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    borderGrad.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
    ctx.strokeStyle = borderGrad; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
}

// 🌌 GERAÇÃO PROCEDURAL (OS NOVOS TEMAS VIP)
function drawProceduralBackground(ctx, width, height, themeStr) {
    ctx.save();
    
    if (themeStr === 'gold') {
        // 👑 TEMA: Magnata do Ouro
        ctx.fillStyle = '#0a0800'; ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'screen';
        
        const goldGlow = ctx.createRadialGradient(width/2, height, 0, width/2, height, 800);
        goldGlow.addColorStop(0, 'rgba(212, 175, 55, 0.3)'); 
        goldGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = goldGlow; ctx.fillRect(0, 0, width, height);
        
        // Partículas Douradas
        ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
        for(let i=0; i<50; i++) {
            ctx.beginPath();
            let r = Math.random() * 2.5 + 0.5;
            ctx.arc(Math.random() * width, Math.random() * height, r, 0, Math.PI * 2);
            ctx.fill();
        }
    } 
    else if (themeStr === 'cyberpunk') {
        // 🤖 TEMA: Cyberpunk Neon
        ctx.fillStyle = '#05050a'; ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'screen';
        
        const cyan = ctx.createRadialGradient(0, 0, 0, 0, 0, 700);
        cyan.addColorStop(0, 'rgba(0, 255, 255, 0.25)'); cyan.addColorStop(1, 'transparent');
        ctx.fillStyle = cyan; ctx.fillRect(0, 0, width, height);
        
        const magenta = ctx.createRadialGradient(width, height, 0, width, height, 700);
        magenta.addColorStop(0, 'rgba(255, 0, 255, 0.25)'); magenta.addColorStop(1, 'transparent');
        ctx.fillStyle = magenta; ctx.fillRect(0, 0, width, height);

        // Grade Digital (Tech Grid)
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
        ctx.lineWidth = 1.5;
        for(let i=0; i<width; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
        for(let i=0; i<height; i+=40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }
    }
    else if (themeStr === 'blood') {
        // 🩸 TEMA: Máfia Sanguinária
        ctx.fillStyle = '#050000'; ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'screen';
        
        const blood = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, 700);
        blood.addColorStop(0, 'rgba(200, 0, 0, 0.3)'); blood.addColorStop(1, 'transparent');
        ctx.fillStyle = blood; ctx.fillRect(0, 0, width, height);

        // Neblina Oculta
        ctx.fillStyle = 'rgba(255, 0, 0, 0.04)';
        for(let i=0; i<25; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 150 + 50, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    else if (themeStr === 'galaxy') {
        // 🌌 TEMA: Galáxia Profunda
        ctx.fillStyle = '#020008'; ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'screen';
        
        // Céu Estrelado
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for(let i=0; i<180; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Nebulosas Cósmicas
        const neb1 = ctx.createRadialGradient(width*0.2, height*0.2, 0, width*0.2, height*0.2, 600);
        neb1.addColorStop(0, 'rgba(138, 43, 226, 0.25)'); neb1.addColorStop(1, 'transparent');
        ctx.fillStyle = neb1; ctx.fillRect(0, 0, width, height);

        const neb2 = ctx.createRadialGradient(width*0.8, height*0.8, 0, width*0.8, height*0.8, 600);
        neb2.addColorStop(0, 'rgba(0, 191, 255, 0.2)'); neb2.addColorStop(1, 'transparent');
        ctx.fillStyle = neb2; ctx.fillRect(0, 0, width, height);
    }
    else {
        // 🌑 TEMA PADRÃO (Minimalista Hype)
        ctx.fillStyle = '#09090b'; ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'screen';
        const topGlow = ctx.createRadialGradient(width, 0, 0, width, 0, 700);
        topGlow.addColorStop(0, 'rgba(56, 189, 248, 0.12)'); topGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = topGlow; ctx.fillRect(0, 0, width, height);
        const bottomGlow = ctx.createRadialGradient(0, height, 0, 0, height, 700);
        bottomGlow.addColorStop(0, 'rgba(87, 242, 135, 0.10)'); bottomGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = bottomGlow; ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
}

async function generateProfileImage(userDiscord, userData, userRank) {
    const width = 950; const height = 460;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const themeStr = userData.profileTheme || 'default';

    drawProceduralBackground(ctx, width, height, themeStr);

    try {
        const logoImg = await loadImage(path.join(__dirname, 'logo.png'));
        const logoW = 200; const logoH = logoW * (logoImg.height / logoImg.width);
        ctx.save();
        ctx.globalAlpha = 0.05; ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(logoImg, width - logoW - 45, 45, logoW, logoH);
        ctx.restore();
    } catch(e) {}

    let vipColor = '#a1a1aa'; let vipName = 'Membro Comum'; let isVip = false;
    if (userData.vipLevel >= 5) { vipColor = '#ef4444'; vipName = 'VIP SUPREME'; isVip = true; }
    else if (userData.vipLevel === 4) { vipColor = '#facc15'; vipName = 'VIP ELITE'; isVip = true; }
    else if (userData.vipLevel === 3) { vipColor = '#c084fc'; vipName = 'VIP EXCLUSIVE'; isVip = true; }
    else if (userData.vipLevel === 2) { vipColor = '#ffffff'; vipName = 'VIP PRIME'; isVip = true; }
    else if (userData.vipLevel === 1) { vipColor = '#f472b6'; vipName = 'VIP BOOSTER'; isVip = true; }

    const avatarSize = 120; const avatarX = 45; const avatarY = 45;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'; ctx.shadowBlur = 15; ctx.shadowOffsetY = 10;
    ctx.beginPath(); ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.fillStyle = '#18181b'; ctx.fill();
    ctx.restore();

    try {
        const avatarImg = await loadImage(userDiscord.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.save();
        ctx.beginPath(); ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.closePath(); ctx.clip();
        ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
    } catch(e) {}

    ctx.save();
    ctx.beginPath(); ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = isVip ? vipColor : 'rgba(255, 255, 255, 0.1)';
    if(isVip) { ctx.shadowColor = vipColor; ctx.shadowBlur = 15; }
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = 'bold 38px "Arial", sans-serif';
    ctx.fillText(userDiscord.username.length > 15 ? userDiscord.username.substring(0, 15) + '...' : userDiscord.username, 195, 60);

    ctx.font = 'bold 12px Arial';
    const badgeW = ctx.measureText(vipName).width + 30;
    drawRoundRectPath(ctx, 195, 115, badgeW, 26, 8);
    ctx.fillStyle = isVip ? hexToRgba(vipColor, 0.15) : 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = isVip ? vipColor : '#a1a1aa';
    ctx.fillText(vipName, 195 + (badgeW/2), 115 + 13);

    const statY = 200; const boxWidth = 200;
    function drawPremiumStatBox(x, label, value, glowColor) {
        drawCleanGlassBox(ctx, x, statY, boxWidth, 90, 16);
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillStyle = '#a1a1aa'; ctx.font = '600 14px "Arial", sans-serif';
        ctx.fillText(label, x + 20, statY + 18);
        ctx.fillStyle = '#ffffff'; 
        ctx.font = value.length > 10 ? 'bold 22px "Arial", sans-serif' : 'bold 26px "Arial", sans-serif';
        ctx.shadowColor = glowColor; ctx.shadowBlur = 15;
        ctx.fillText(value, x + 20, statY + 45);
        ctx.shadowBlur = 0;
    }

    drawPremiumStatBox(45, 'BANCO HYPE', `R$ ${(userData.hypeCash || 0).toLocaleString('pt-BR')}`, '#38bdf8');
    drawPremiumStatBox(265, 'CARTEIRA', `R$ ${(userData.carteira || 0).toLocaleString('pt-BR')}`, '#57F287');
    drawPremiumStatBox(485, 'RANK GLOBAL', `#${userRank}`, '#facc15');
    drawPremiumStatBox(705, 'REPUTAÇÃO', `${userData.rep || 0} Reps`, '#f87171');

    const bioY = 320;
    drawCleanGlassBox(ctx, 45, bioY, 860, 90, 16);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#a1a1aa'; ctx.font = '600 14px "Arial", sans-serif';
    ctx.fillText('SOBRE MIM', 65, bioY + 18);

    ctx.fillStyle = '#e4e4e7'; ctx.font = 'italic 18px "Arial", sans-serif';
    const bioText = userData.bio || "Membro da família Hype! Use os botões abaixo para editar esta biografia.";
    const maxChars = 90; 
    if(bioText.length > maxChars) {
        ctx.fillText(`"${bioText.substring(0, maxChars)}-`, 65, bioY + 42);
        ctx.fillText(`${bioText.substring(maxChars, maxChars*2)}${bioText.length > maxChars*2 ? '...' : ''}"`, 65, bioY + 65);
    } else {
        ctx.fillText(`"${bioText}"`, 65, bioY + 45);
    }

    return canvas.toBuffer('image/png');
}

module.exports = { generateProfileImage };