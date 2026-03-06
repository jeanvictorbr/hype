const { createCanvas, loadImage } = require('canvas');

async function generateMochilaImage(user, userProfile) {
    // Altura mantida em 720 para acomodar a nova linha de itens confortavelmente
    const width = 900; const height = 720; 
    const canvas = createCanvas(width, height); const ctx = canvas.getContext('2d');

    // Fundo Escuro
    ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, width, height);

    // Efeito de Néon no fundo (Azul Hype)
    const glow = ctx.createRadialGradient(width/2, 0, 50, width/2, 0, 600);
    glow.addColorStop(0, 'rgba(0, 89, 255, 0.15)'); 
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);

    // ==========================================
    // CABEÇALHO COM AVATAR DO JOGADOR
    // ==========================================
    try {
        const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 128 });
        const avatar = await loadImage(avatarUrl);
        ctx.save();
        ctx.beginPath(); ctx.arc(100, 80, 50, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
        ctx.drawImage(avatar, 50, 30, 100, 100);
        ctx.restore();
        
        ctx.beginPath(); ctx.arc(100, 80, 50, 0, Math.PI * 2);
        ctx.lineWidth = 4; ctx.strokeStyle = '#0059ff'; ctx.stroke();
    } catch(e) {}

    ctx.fillStyle = '#ffffff'; ctx.font = '900 42px "Arial Black"'; ctx.textAlign = 'left';
    ctx.fillText('INVENTÁRIO TÁTICO', 170, 75);

    ctx.fillStyle = '#aaaaaa'; ctx.font = '18px Arial';
    ctx.fillText(`PERTENCE A: @${user.username.toUpperCase()}`, 170, 105);
    ctx.fillStyle = '#0059ff'; ctx.font = 'italic 16px Arial';
    ctx.fillText('Use o comando "husar <item>" para equipar antes de ir para as ruas.', 170, 125);

    // ==========================================
    // CAIXAS DOS ITENS (Preservando originais + Lanterna)
    // ==========================================
    const items = [
        { 
            name1: 'COLETE', name2: 'BALÍSTICO', qty: userProfile.invColetes, 
            icon: 'https://raw.githubusercontent.com/qbcore-framework/qb-inventory/main/html/images/armor.png', 
            cmd: 'husar colete' 
        },
        { 
            name1: 'PÉ DE', name2: 'CABRA', qty: userProfile.invPedeCabra, 
            icon: 'https://raw.githubusercontent.com/qbcore-framework/qb-inventory/main/html/images/weapon_crowbar.png', 
            cmd: 'husar pecabra' 
        },
        { 
            name1: 'KIT', name2: 'DISFARCE', qty: userProfile.invDisfarces, 
            icon: 'https://raw.githubusercontent.com/qbcore-framework/qb-inventory/main/html/images/id_card.png', 
            cmd: 'husar disfarce' 
        },
        { 
            name1: 'MALETA DA', name2: 'MÁFIA', qty: userProfile.maletas, 
            icon: 'https://cdn-icons-png.flaticon.com/512/2666/2666505.png', 
            cmd: 'habrir maleta' 
        },
        { 
            name1: 'LANTERNA', name2: 'TÁTICA', qty: userProfile.invLanternas || 0, 
            icon: 'https://raw.githubusercontent.com/qbcore-framework/qb-inventory/main/html/images/weapon_flashlight.png', 
            cmd: 'husar lanterna' 
        }
    ];

    let startX = 40; let startY = 170;
    const cardW = 390; const cardH = 150;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const hasItem = item.qty > 0;

        ctx.fillStyle = hasItem ? 'rgba(0, 89, 255, 0.05)' : 'rgba(30, 30, 35, 0.6)';
        ctx.strokeStyle = hasItem ? '#0059ff' : '#27272a';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(startX, startY, cardW, cardH, 15); ctx.fill(); ctx.stroke();

        try {
            const icon = await loadImage(item.icon);
            if (!hasItem) { ctx.globalCompositeOperation = 'luminosity'; ctx.globalAlpha = 0.25; }
            ctx.drawImage(icon, startX + 20, startY + 25, 100, 100);
            ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1.0;
        } catch (e) {}

        ctx.fillStyle = hasItem ? '#ffffff' : '#71717a';
        ctx.textAlign = 'left'; ctx.font = '900 22px "Arial Black"';
        ctx.fillText(item.name1, startX + 140, startY + 50);
        ctx.fillText(item.name2, startX + 140, startY + 75);

        ctx.fillStyle = hasItem ? '#0059ff' : '#ef4444';
        ctx.beginPath(); ctx.roundRect(startX + 140, startY + 90, 110, 25, 5); ctx.fill();
        
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
        ctx.fillText(`Estoque: ${item.qty}`, startX + 195, startY + 108);

        ctx.fillStyle = '#71717a'; ctx.font = 'bold 15px monospace'; ctx.textAlign = 'left';
        ctx.fillText(`> ${item.cmd}`, startX + 140, startY + 135);

        startX += 420; 
        if ((i + 1) % 2 === 0) { // Pula linha a cada 2 itens
            startX = 40; 
            startY += 170; 
        }
    }

    return canvas.toBuffer('image/png');
}

module.exports = { generateMochilaImage };