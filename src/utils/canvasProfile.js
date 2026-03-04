const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

try { registerFont(path.join(__dirname, 'Inter-Variable.ttf'), { family: 'InterCustom' }); } catch (e) {}

function hexToRgba(hex, alpha) {
    hex = hex.replace('#', '');
    let r = 0, g = 0, b = 0;
    if (hex.length === 3) {
        r = parseInt(hex[0]+hex[0], 16); g = parseInt(hex[1]+hex[1], 16); b = parseInt(hex[2]+hex[2], 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.substring(0,2), 16); g = parseInt(hex.substring(2,4), 16); b = parseInt(hex.substring(4,6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawRoundRectPath(ctx, x, y, w, h, radius) {
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius); ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
}

function drawHypeSolidBox(ctx, x, y, w, h, radius, glowColorHex) {
    ctx.save();
    ctx.fillStyle = '#111111'; 
    drawRoundRectPath(ctx, x, y, w, h, radius);
    ctx.fill();

    ctx.lineWidth = 1;
    ctx.strokeStyle = hexToRgba(glowColorHex, 0.3); 
    ctx.shadowColor = hexToRgba(glowColorHex, 0.5); 
    ctx.shadowBlur = 12; 
    ctx.shadowOffsetY = 0;
    ctx.stroke(); 
    ctx.restore();
}

async function generateProfileImage(userDiscord, userData, userRank) {
    const width = 1100; const height = 550;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    let vipColor = '#3b82f6'; 
    let vipName = 'Membro Comum'; let isVip = false;
    
    if (userData.vipLevel >= 5) { vipColor = '#ef4444'; vipName = 'VIP SUPREME'; isVip = true; }
    else if (userData.vipLevel === 4) { vipColor = '#facc15'; vipName = 'VIP ELITE'; isVip = true; }
    else if (userData.vipLevel === 3) { vipColor = '#c084fc'; vipName = 'VIP EXCLUSIVE'; isVip = true; }
    else if (userData.vipLevel === 2) { vipColor = '#ffffff'; vipName = 'VIP PRIME'; isVip = true; }
    else if (userData.vipLevel === 1) { vipColor = '#f472b6'; vipName = 'VIP BOOSTER'; isVip = true; }

    const color1 = userData.customColor1 || vipColor;
    const color2 = userData.customColor2 || color1;

    const radialBg = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width/1.2); 
    radialBg.addColorStop(0, hexToRgba(color2, 0.15)); 
    radialBg.addColorStop(1, '#020202'); 
    ctx.fillStyle = radialBg;
    ctx.fillRect(0, 0, width, height);

    const containerX = 40; const containerY = 40;
    const containerW = 1020; const containerH = 470; 
    
    ctx.save();
    ctx.shadowColor = hexToRgba(color1, 0.4); 
    ctx.shadowBlur = 50; 
    ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    
    ctx.fillStyle = '#0a0a0a';
    drawRoundRectPath(ctx, containerX, containerY, containerW, containerH, 20);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.lineWidth = 1; ctx.strokeStyle = hexToRgba(color1, 0.2);
    drawRoundRectPath(ctx, containerX, containerY, containerW, containerH, 20);
    ctx.stroke();
    ctx.restore();

    const contentX = containerX + 40; const contentY = containerY + 40;
    const avatarSize = 120; const avatarX = contentX; const avatarY = contentY;

    ctx.save();
    ctx.shadowColor = hexToRgba(color1, 0.8); 
    ctx.shadowBlur = 25; 
    ctx.beginPath(); ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
    ctx.lineWidth = 3; ctx.strokeStyle = color1;
    ctx.stroke();
    ctx.restore();

    try {
        const avatarImg = await loadImage(userDiscord.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.save();
        ctx.beginPath(); ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.closePath(); ctx.clip();
        ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
    } catch(e) {}

    const textStartX = avatarX + 145; 
    ctx.textBaseline = 'middle'; 

    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left';
    ctx.font = '800 36px "InterCustom", sans-serif'; 
    ctx.fillText(userDiscord.username.length > 15 ? userDiscord.username.substring(0, 15) + '...' : userDiscord.username, textStartX, avatarY + 38);

    const badgeY = avatarY + 80;
    ctx.font = '700 13px "InterCustom", sans-serif'; 
    const badgeW = ctx.measureText(vipName).width + 36; 
    const badgeH = 30; 
    const badgeRadius = badgeH / 2;

    ctx.save();
    ctx.fillStyle = isVip ? color1 : 'rgba(255,255,255,0.1)';
    if(isVip) { 
        ctx.shadowColor = hexToRgba(color1, 0.8); 
        ctx.shadowBlur = 15; 
    }
    drawRoundRectPath(ctx, textStartX, badgeY, badgeW, badgeH, badgeRadius);
    ctx.fill();
    ctx.restore();

    ctx.textAlign = 'center'; ctx.fillStyle = isVip ? '#000000' : '#a1a1aa';
    ctx.fillText(vipName, textStartX + (badgeW/2), badgeY + (badgeH/2));

    // ==========================================
    // 💳 ALINHAMENTO MILIMÉTRICO (CORRIGIDO)
    // ==========================================
    const statY = avatarY + 160; 
    const boxW = 220; // 4x 220 = 880
    const gap = 20;   // 3x 20 = 60 (Total exato: 940px)
    const totalBoxWidth = (boxW * 4) + (gap * 3); // Dá 940px perfeitos

    function drawHypeStatCard(x, label, value, valueColor) {
        drawHypeSolidBox(ctx, x, statY, boxW, 110, 15, color1); 
        
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillStyle = '#888888'; ctx.font = '600 14px "InterCustom", sans-serif';
        ctx.fillText(label, x + 25, statY + 25); 
        
        ctx.fillStyle = valueColor; ctx.font = '700 24px "InterCustom", sans-serif'; // Diminuí 2px a fonte pra encaixar perfeito
        ctx.fillText(value, x + 25, statY + 50);
    }

    drawHypeStatCard(contentX, 'BANCO HYPE', `R$ ${(userData.hypeCash || 0).toLocaleString('pt-BR')}`, '#4da6ff');
    drawHypeStatCard(contentX + boxW + gap, 'CARTEIRA', `R$ ${(userData.carteira || 0).toLocaleString('pt-BR')}`, '#00ff88');
    drawHypeStatCard(contentX + (boxW*2) + (gap*2), 'RANK GLOBAL', `#${userRank}`, '#ffd700');
    drawHypeStatCard(contentX + (boxW*3) + (gap*3), 'CURTIDAS', `${userData.rep || 0} Curtidas`, '#ff4d4d');

    // ==========================================
    // ✍️ CAIXA SOBRE MIM (AMARRADA AO TAMANHO EXATO)
    // ==========================================
    const bioY = statY + gap + 110; 
    const bioH = 100;
    
    // A caixa bio agora usa o tamanho matematicamente exato das de cima (totalBoxWidth)
    drawHypeSolidBox(ctx, contentX, bioY, totalBoxWidth, bioH, 15, color1);

    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#888888'; ctx.font = '600 14px "InterCustom", sans-serif';
    ctx.fillText('SOBRE MIM', contentX + 25, bioY + 20);

    ctx.fillStyle = '#cccccc'; ctx.font = 'italic 18px "InterCustom", sans-serif'; 
    const bioText = userData.bio || "Hype no Topo! Use os botões abaixo para editar esta biografia.";
    
    if (ctx.measureText(`"${bioText}"`).width > (totalBoxWidth - 50)) {
        ctx.fillText(`"${bioText.substring(0, 90)}-`, contentX + 25, bioY + 45);
        ctx.fillText(`${bioText.substring(90, 180)}${bioText.length > 180 ? '...' : ''}"`, contentX + 25, bioY + 68);
    } else {
        ctx.fillText(`"${bioText}"`, contentX + 25, bioY + 45);
    }

    return canvas.toBuffer('image/png');
}

module.exports = { generateProfileImage };