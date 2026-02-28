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

// Converte HEX para RGBA (Para selos com transparência)
function hexToRgba(hex, alpha) {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 🔥 NOVA CAIXA DE VIDRO ULTRA-CLEAN (Padrão Carteira)
function drawCleanGlassBox(ctx, x, y, w, h, radius) {
    ctx.save();
    // Fundo Translúcido Escuro
    ctx.fillStyle = 'rgba(30, 30, 36, 0.5)';
    drawRoundRectPath(ctx, x, y, w, h, radius);
    
    // Sombra de Profundidade
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;
    ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // Borda Metálica Fina
    const borderGrad = ctx.createLinearGradient(x, y, x + w, y + h);
    borderGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    borderGrad.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
}

// 🌌 GERAÇÃO PROCEDURAL DOS TEMAS
function drawProceduralBackground(ctx, width, height, themeStr) {
    if (themeStr === 'default') {
        // 🔥 NOVO TEMA DEFAULT (Igual ao zcarteira - Minimalista)
        ctx.fillStyle = '#09090b'; // Zinco Escuro
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'screen';
        
        // Luz Azul Topo-Direita
        const topGlow = ctx.createRadialGradient(width, 0, 0, width, 0, 700);
        topGlow.addColorStop(0, 'rgba(56, 189, 248, 0.12)'); 
        topGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = topGlow; ctx.fillRect(0, 0, width, height);

        // Luz Verde Fundo-Esquerda
        const bottomGlow = ctx.createRadialGradient(0, height, 0, 0, height, 700);
        bottomGlow.addColorStop(0, 'rgba(87, 242, 135, 0.10)'); 
        bottomGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = bottomGlow; ctx.fillRect(0, 0, width, height);
        
        ctx.globalCompositeOperation = 'source-over';
    } else {
        // Espaço reservado para os futuros temas VIP que vamos criar!
        ctx.fillStyle = '#09090b'; 
        ctx.fillRect(0, 0, width, height);
    }
}

async function generateProfileImage(userDiscord, userData, userRank) {
    const width = 950;
    const height = 460;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const themeStr = userData.profileTheme || 'default';

    // 1. FUNDO E LUZES
    drawProceduralBackground(ctx, width, height, themeStr);

    // 2. LOGO HYPE (Marca de Água Discreta no canto direito)
    try {
        const logoImg = await loadImage(path.join(__dirname, 'logo.png'));
        const logoW = 200; const logoH = logoW * (logoImg.height / logoImg.width);
        ctx.save();
        ctx.globalAlpha = 0.05; ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(logoImg, width - logoW - 45, 45, logoW, logoH);
        ctx.restore();
    } catch(e) {}

    // ==========================================
    // 3. LÓGICA VIP (Cores Atualizadas)
    // ==========================================
    let vipColor = '#a1a1aa'; let vipName = 'Membro Comum'; let isVip = false;
    if (userData.vipLevel >= 5) { vipColor = '#ef4444'; vipName = 'VIP SUPREME'; isVip = true; }
    else if (userData.vipLevel === 4) { vipColor = '#facc15'; vipName = 'VIP ELITE'; isVip = true; }
    else if (userData.vipLevel === 3) { vipColor = '#c084fc'; vipName = 'VIP EXCLUSIVE'; isVip = true; }
    else if (userData.vipLevel === 2) { vipColor = '#ffffff'; vipName = 'VIP PRIME'; isVip = true; }
    else if (userData.vipLevel === 1) { vipColor = '#f472b6'; vipName = 'VIP BOOSTER'; isVip = true; }

    // ==========================================
    // 4. AVATAR COM MOLDURA CLEAN
    // ==========================================
    const avatarSize = 120;
    const avatarX = 45; 
    const avatarY = 45;

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
    ctx.lineWidth = 3;
    // Se for VIP, a borda do perfil brilha na cor dele. Se não, borda discreta.
    ctx.strokeStyle = isVip ? vipColor : 'rgba(255, 255, 255, 0.1)';
    if(isVip) { ctx.shadowColor = vipColor; ctx.shadowBlur = 15; }
    ctx.stroke();
    ctx.restore();

    // ==========================================
    // 5. NOME & BADGE (Tipografia Apple)
    // ==========================================
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = 'bold 38px "Arial", sans-serif';
    ctx.fillText(userDiscord.username.length > 15 ? userDiscord.username.substring(0, 15) + '...' : userDiscord.username, 195, 60);

    // Badge / Selo Estilo App
    ctx.font = 'bold 12px Arial';
    const badgeW = ctx.measureText(vipName).width + 30;
    
    drawRoundRectPath(ctx, 195, 115, badgeW, 26, 8);
    ctx.fillStyle = isVip ? hexToRgba(vipColor, 0.15) : 'rgba(255,255,255,0.05)';
    ctx.fill();
    
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = isVip ? vipColor : '#a1a1aa';
    ctx.fillText(vipName, 195 + (badgeW/2), 115 + 13);

    // ==========================================
    // 6. CAIXAS DE ESTATÍSTICAS (4 COLUNAS FINTECH)
    // ==========================================
    const statY = 200;
    const boxWidth = 200;
    
    function drawPremiumStatBox(x, label, value, glowColor) {
        drawCleanGlassBox(ctx, x, statY, boxWidth, 90, 16);
        
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillStyle = '#a1a1aa'; // Cinza prateado
        ctx.font = '600 14px "Arial", sans-serif';
        ctx.fillText(label, x + 20, statY + 18);
        
        ctx.fillStyle = '#ffffff'; 
        ctx.font = value.length > 10 ? 'bold 22px "Arial", sans-serif' : 'bold 26px "Arial", sans-serif';
        ctx.shadowColor = glowColor; ctx.shadowBlur = 15;
        ctx.fillText(value, x + 20, statY + 45);
        ctx.shadowBlur = 0;
    }

    // Divididas perfeitamente (Gap de 20px)
    drawPremiumStatBox(45, 'BANCO HYPE', `R$ ${(userData.hypeCash || 0).toLocaleString('pt-BR')}`, '#38bdf8');
    drawPremiumStatBox(265, 'CARTEIRA (MÃO)', `R$ ${(userData.carteira || 0).toLocaleString('pt-BR')}`, '#57F287');
    drawPremiumStatBox(485, 'RANK GLOBAL', `#${userRank}`, '#facc15');
    drawPremiumStatBox(705, 'REPUTAÇÃO', `${userData.rep || 0} Reps`, '#f87171');

    // ==========================================
    // 7. BIO BOX (SOBRE MIM)
    // ==========================================
    const bioY = 320;
    drawCleanGlassBox(ctx, 45, bioY, 860, 90, 16);

    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#a1a1aa'; 
    ctx.font = '600 14px "Arial", sans-serif';
    ctx.fillText('SOBRE MIM', 65, bioY + 18);

    ctx.fillStyle = '#e4e4e7'; 
    ctx.font = 'italic 18px "Arial", sans-serif';
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