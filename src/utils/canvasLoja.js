const { createCanvas, loadImage } = require('canvas');
const path = require('path');

async function generateShopCatalog() {
    const canvas = createCanvas(700, 700);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const grad = ctx.createRadialGradient(350, 350, 100, 350, 350, 450);
    grad.addColorStop(0, '#11112b'); 
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#001aff'; ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('MERCADO NEGRO', canvas.width / 2, 80);

    const drawRoundedRect = (x, y, w, h, r) => {
        ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    };

    const drawItem = async (name, price, desc, y, imgUrl) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        drawRoundedRect(50, y, 600, 140, 15);
        ctx.fill(); ctx.strokeStyle = '#fffcfc'; ctx.stroke();

        try {
            const icon = await loadImage(imgUrl);
            ctx.drawImage(icon, 70, y + 25, 90, 90);
        } catch (e) {
            ctx.fillStyle = '#fff'; ctx.font = '40px serif'; ctx.fillText('?', 110, y + 80);
        }

        ctx.textAlign = 'left'; ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = '#0059ff';
        ctx.fillText(name, 180, y + 45);

        ctx.font = '18px sans-serif'; ctx.fillStyle = '#cccccc';
        const words = desc.split(' '); let line = ''; let ty = y + 75;
        for(let word of words) {
            if ((line + word).length > 40) { ctx.fillText(line, 180, ty); line = word + ' '; ty += 25; } 
            else { line += word + ' '; }
        }
        ctx.fillText(line, 180, ty);

        ctx.font = 'bold 26px sans-serif'; ctx.fillStyle = '#57F287'; ctx.textAlign = 'right';
        ctx.fillText(`R$ ${price.toLocaleString('pt-BR')}`, 630, y + 120);
    };

    // 👇 NOVOS PREÇOS E DESCRIÇÕES
    await drawItem('COLETE BALÍSTICO', 150000, 'Proteção total contra todos os assaltos por 15 minutos.', 150, 'https://i.imgur.com/8P4SWpz.png');
    await drawItem('PÉ DE CABRA', 50000, 'Aumenta em 15% a chance de roubo por 15 minutos.', 320, 'https://i.imgur.com/pBFWxEA.png');
    await drawItem('KIT DISFARCE', 30000, 'Corta 50% do valor de 3 multas policiais.', 490, 'https://i.imgur.com/8Wmmnn1.png');

    return canvas.toBuffer();
}

module.exports = { generateShopCatalog };