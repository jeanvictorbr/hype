const { createCanvas, loadImage } = require('canvas');

async function generateShopReceipt(user, itemName, price, iconUrl) {
    const width = 700; const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fundo Escuro do Submundo
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, width, height);

    // Glow Verde (Sucesso da Transação)
    const glow = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, 400);
    glow.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Borda Neon
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, width - 4, height - 4);

    // Cabeçalho do Recibo
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px "Arial Black"';
    ctx.textAlign = 'center';
    ctx.fillText('NEGÓCIO FECHADO', width / 2, 50);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('Transação aprovada e item guardado na mochila (hinv).', width / 2, 75);

    // Avatar do Comprador
    try {
        const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 128 });
        const avatar = await loadImage(avatarUrl);
        ctx.save();
        ctx.beginPath(); ctx.arc(120, 180, 50, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
        ctx.drawImage(avatar, 70, 130, 100, 100);
        ctx.restore();

        ctx.beginPath(); ctx.arc(120, 180, 50, 0, Math.PI * 2);
        ctx.lineWidth = 4; ctx.strokeStyle = '#3b82f6'; ctx.stroke();
    } catch(e) {}

    // Ícone do Item Comprado
    try {
        const icon = await loadImage(iconUrl);
        ctx.drawImage(icon, width - 180, 130, 100, 100);
    } catch(e) {}

    // Detalhes da Compra (Textos)
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('COMPRADOR', 210, 140);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial';
    ctx.fillText(user.username.toUpperCase(), 210, 165);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px Arial';
    ctx.fillText('ITEM ADQUIRIDO', 210, 205);

    ctx.fillStyle = '#facc15';
    ctx.font = '900 24px "Arial Black"';
    ctx.fillText(`1x ${itemName}`, 210, 230);

    // Valor Pago (Em Vermelho, mostrando a perda na carteira)
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`- R$ ${price.toLocaleString('pt-BR')}`, width / 2, 275);

    return canvas.toBuffer('image/png');
}

module.exports = { generateShopReceipt };