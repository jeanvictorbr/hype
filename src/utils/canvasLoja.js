const { createCanvas, loadImage } = require('canvas');

async function generateShopCatalog() {
    const canvas = createCanvas(700, 920); // Altura aumentada para respirar melhor
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createRadialGradient(350, 460, 100, 350, 460, 600);
    grad.addColorStop(0, '#11112b'); grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#001aff'; ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 50px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('MERCADO NEGRO', canvas.width / 2, 80);

    const drawRoundedRect = (x, y, w, h, r) => {
        ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    };

    const drawItem = async (name, price, desc, y, imgUrl) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        drawRoundedRect(50, y, 600, 130, 15);
        ctx.fill(); ctx.strokeStyle = '#0059ff'; ctx.lineWidth = 1; ctx.stroke();
        try {
            const icon = await loadImage(imgUrl);
            ctx.drawImage(icon, 70, y + 20, 90, 90);
        } catch (e) {
            ctx.fillStyle = '#fff'; ctx.font = '40px serif'; ctx.fillText('?', 110, y + 80);
        }
        ctx.textAlign = 'left'; ctx.font = 'bold 24px sans-serif'; ctx.fillStyle = '#0059ff';
        ctx.fillText(name, 180, y + 40);
        ctx.font = '18px sans-serif'; ctx.fillStyle = '#cccccc';
        ctx.fillText(desc, 180, y + 70);
        ctx.font = 'bold 26px sans-serif'; ctx.fillStyle = '#57F287'; ctx.textAlign = 'right';
        ctx.fillText(`R$ ${price.toLocaleString('pt-BR')}`, 630, y + 110);
    };

    await drawItem('COLETE BALÍSTICO', 150000, 'Proteção total contra assaltos (15min).', 120, 'https://raw.githubusercontent.com/qbcore-framework/qb-inventory/main/html/images/armor.png');
    await drawItem('PÉ DE CABRA', 50000, 'Aumenta em 15% chance de roubo (15min).', 260, 'https://raw.githubusercontent.com/qbcore-framework/qb-inventory/main/html/images/weapon_crowbar.png');
    await drawItem('KIT DISFARCE', 30000, 'Corta 50% do valor de 3 multas.', 400, 'https://raw.githubusercontent.com/qbcore-framework/qb-inventory/main/html/images/id_card.png');
    await drawItem('LANTERNA TÁTICA', 100000, 'Revela 3 casas no Mines antes de clicar.', 540, 'https://raw.githubusercontent.com/qbcore-framework/qb-inventory/main/html/images/weapon_flashlight.png');

    // 👇 AVISO POSICIONADO MAIS ABAIXO (y: 740) PARA NÃO COBRIR O ÚLTIMO ITEM 👇
    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)'; ctx.fillRect(10, 740, canvas.width - 20, 140);
    ctx.fillStyle = '#facc15'; ctx.font = '900 24px Arial'; ctx.textAlign = 'center';
    ctx.fillText('⚠️ ATENÇÃO: INVENTÁRIO TÁTICO', canvas.width / 2, 780);
    ctx.fillStyle = '#ffffff'; ctx.font = '18px Arial';
    ctx.fillText('Os itens comprados vão diretos para a sua HMochila.', canvas.width / 2, 810);
    ctx.fillText('Digite HUSAR <ITEM> para equipar!', canvas.width / 2, 835);

    return canvas.toBuffer('image/png');
}
module.exports = { generateShopCatalog };