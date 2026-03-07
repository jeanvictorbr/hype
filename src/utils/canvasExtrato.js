const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');

try { registerFont(path.join(__dirname, 'Inter-Variable.ttf'), { family: 'InterCustom' }); } catch (e) {}

function drawRoundRectPath(ctx, x, y, w, h, radius) {
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius); ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h); ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
}

async function generateExtratoImage(userDiscord, transactions, page, totalPages) {
    const width = 800; const height = 750;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#070709';
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 1;
    for (let i = 0; i < height; i += 40) {
        ctx.strokeStyle = `rgba(255, 255, 255, 0.02)`;
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    ctx.save();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255, 0.15)';
    drawRoundRectPath(ctx, 15, 15, width - 30, height - 30, 15); ctx.stroke();
    ctx.restore();

    const headerY = 60;
    try {
        const logo = await loadImage(path.join(__dirname, 'logo.png'));
        const logoW = 80; const logoH = logoW * (logo.height / logo.width);
        ctx.drawImage(logo, 40, headerY - (logoH/2), logoW, logoH);
    } catch(e) {}

    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = '900 32px "InterCustom", Arial';
    ctx.fillText('EXTRATO BANCÁRIO', 140, headerY - 5);

    ctx.fillStyle = '#aaaaaa'; ctx.font = '16px Arial';
    ctx.fillText(`DOCUMENTO CONFIDENCIAL - PÁGINA ${page} DE ${totalPages}`, 140, headerY + 25);

    const titularY = 150;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    drawRoundRectPath(ctx, 40, titularY, width - 80, 80, 10); ctx.fill();

    const avatarSize = 60;
    ctx.save(); ctx.beginPath(); ctx.arc(40 + 20 + avatarSize/2, titularY + 10 + avatarSize/2, avatarSize/2, 0, Math.PI*2); ctx.clip();
    try {
        const avatarImg = await loadImage(userDiscord.displayAvatarURL({ extension: 'png', size: 128 }));
        ctx.drawImage(avatarImg, 60, titularY + 10, avatarSize, avatarSize);
    } catch(e) {}
    ctx.restore();

    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px Arial';
    ctx.fillText(`Titular da Conta: @${userDiscord.username}`, 135, titularY + 30);
    ctx.fillStyle = '#888888'; ctx.font = '14px Arial';
    ctx.fillText(`ID de Registo: ${userDiscord.id}`, 135, titularY + 55);

    const listStartY = 270;
    const rowHeight = 70;

    ctx.fillStyle = '#555555'; ctx.font = 'bold 12px Arial';
    ctx.fillText('TIPO / DATA', 50, listStartY - 15);
    ctx.fillText('DESCRIÇÃO DA MOVIMENTAÇÃO', 200, listStartY - 15);
    ctx.textAlign = 'right';
    ctx.fillText('VALOR (R$)', width - 50, listStartY - 15);

    if (!transactions || transactions.length === 0) {
        ctx.textAlign = 'center'; ctx.fillStyle = '#666666'; ctx.font = 'italic 18px Arial';
        ctx.fillText('Ainda não existem movimentos na ficha deste utilizador.', width/2, listStartY + 100);
        return canvas.toBuffer('image/png');
    }

    transactions.forEach((tx, i) => {
        const rowY = listStartY + (i * rowHeight);
        
        if (i % 2 === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.fillRect(40, rowY - 10, width - 80, rowHeight - 5);
        }

        ctx.textAlign = 'left';
        if (tx.type === 'IN') {
            ctx.fillStyle = '#57F287'; ctx.font = 'bold 16px Arial'; ctx.fillText('➕ ENTRADA', 50, rowY + 10);
        } else {
            ctx.fillStyle = '#ef4444'; ctx.font = 'bold 16px Arial'; ctx.fillText('➖ SAÍDA', 50, rowY + 10);
        }

        ctx.fillStyle = '#888888'; ctx.font = '12px Arial';
        const dateStr = new Date(tx.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' });
        ctx.fillText(dateStr, 50, rowY + 30);

        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px "InterCustom", Arial';
        const shortDesc = tx.description.length > 40 ? tx.description.substring(0, 38) + '...' : tx.description;
        ctx.fillText(shortDesc, 200, rowY + 20);

        ctx.textAlign = 'right';
        ctx.fillStyle = tx.type === 'IN' ? '#57F287' : '#ef4444';
        ctx.font = '900 22px "Arial Black", Arial';
        const sign = tx.type === 'IN' ? '+' : '-';
        ctx.fillText(`${sign} ${tx.amount.toLocaleString('pt-BR')}`, width - 50, rowY + 20);
    });

    return canvas.toBuffer('image/png');
}

module.exports = { generateExtratoImage };