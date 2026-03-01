const { createCanvas, loadImage } = require('canvas');
const path = require('path');

async function generatePurchaseReceipt(user, itemName, price, benefit, duration) {
    const canvas = createCanvas(600, 300);
    const ctx = canvas.getContext('2d');

    // Fundo Dark Clean
    ctx.fillStyle = '#121214';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Detalhe lateral Roxo (Marca Hype)
    ctx.fillStyle = '#9b59b6';
    ctx.fillRect(0, 0, 10, canvas.height);

    // --- AVATAR DO USUÁRIO ---
    ctx.save();
    const avatarSize = 100;
    const xAvatar = 40;
    const yAvatar = 50;
    
    ctx.beginPath();
    ctx.arc(xAvatar + avatarSize / 2, yAvatar + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    try {
        const avatarImg = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.drawImage(avatarImg, xAvatar, yAvatar, avatarSize, avatarSize);
    } catch (e) {
        ctx.fillStyle = '#333';
        ctx.fillRect(xAvatar, yAvatar, avatarSize, avatarSize);
    }
    ctx.restore();

    // Borda do Avatar
    ctx.strokeStyle = '#9b59b6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(xAvatar + avatarSize / 2, yAvatar + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.stroke();

    // --- TEXTOS INFORMATIVOS ---
    ctx.textAlign = 'left';
    
    // Título Principal
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('PEDIDO PROCESSADO', 170, 75);

    // Linha de Divisão
    ctx.strokeStyle = '#29292e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(170, 95);
    ctx.lineTo(550, 95);
    ctx.stroke();

    // Item Comprado
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '16px sans-serif';
    ctx.fillText('Produto:', 170, 125);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(itemName, 170, 150);

    // Benefício
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '16px sans-serif';
    ctx.fillText('Vantagem:', 170, 185);
    ctx.fillStyle = '#57F287'; // Verde Sucesso
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(benefit, 170, 210);

    // Duração / Expiração
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '16px sans-serif';
    ctx.fillText('Validade:', 170, 245);
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px sans-serif';
    ctx.fillText(duration, 170, 270);

    // Valor no Canto Inferior Direito
    ctx.textAlign = 'right';
    ctx.fillStyle = '#9b59b6';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`- R$ ${price.toLocaleString('pt-BR')}`, 560, 270);

    return canvas.toBuffer();
}

module.exports = { generatePurchaseReceipt };