const { createCanvas, loadImage } = require('canvas');

async function generateRainBanner(user, amount) {
    const width = 800; const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Fundo Verde Magnata Profundo
    const bgGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
    bgGrad.addColorStop(0, '#0a2e15'); // Verde musgo profundo
    bgGrad.addColorStop(1, '#020a04'); // Quase preto
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Partículas de Dinheiro (Notas voando) geradas proceduralmente
    ctx.fillStyle = 'rgba(87, 242, 135, 0.15)'; 
    for(let i=0; i<80; i++) {
        const px = Math.random() * width;
        const py = Math.random() * height;
        const pw = Math.random() * 25 + 15;
        const ph = pw * 0.55;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.random() * Math.PI);
        ctx.fillRect(-pw/2, -ph/2, pw, ph);
        // Símbolo $ dentro de algumas notas
        if (Math.random() > 0.5) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.font = `bold ${ph*0.8}px Arial`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 0);
        }
        ctx.restore();
        ctx.fillStyle = 'rgba(87, 242, 135, 0.15)';
    }

    // 3. Brilho Néon Central
    const centerGlow = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, 400);
    centerGlow.addColorStop(0, 'rgba(87, 242, 135, 0.2)');
    centerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = centerGlow; ctx.fillRect(0, 0, width, height);

    // 4. Avatar do Magnata
    const avatarSize = 120;
    const avatarX = 50;
    const avatarY = (height - avatarSize) / 2;

    try {
        const avatarImg = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.save();
        ctx.beginPath(); ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.closePath(); ctx.clip();
        ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();

        // Borda do Avatar Neon Verde
        ctx.beginPath(); ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.lineWidth = 5; ctx.strokeStyle = '#57F287';
        ctx.shadowColor = '#57F287'; ctx.shadowBlur = 20;
        ctx.stroke(); ctx.shadowBlur = 0;
    } catch (e) {}

    // 5. Textos 3D
    ctx.textAlign = 'left';
    
    // Título
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 38px "Arial Black", sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10;
    ctx.fillText('CHUVA DE DINHEIRO!', 210, 110);
    ctx.shadowBlur = 0;

    // Valor (Destaque Gigante)
    ctx.fillStyle = '#57F287'; 
    ctx.font = '900 65px "Arial Black", sans-serif';
    ctx.shadowColor = '#57F287'; ctx.shadowBlur = 25;
    ctx.fillText(`R$ ${amount.toLocaleString('pt-BR')}`, 210, 190);
    ctx.shadowBlur = 0;

    // Rodapé
    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'italic 22px Arial';
    ctx.fillText(`Patrocinado por: ${user.username}`, 210, 240);

    return canvas.toBuffer('image/png');
}

module.exports = { generateRainBanner };