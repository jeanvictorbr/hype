const { createCanvas, loadImage } = require('canvas');
const path = require('path');

// Mapeamento de imagens reais para o recibo (as mesmas da loja)
const ITEM_IMAGES = {
    'colete': 'https://cdn-icons-png.flaticon.com/512/3233/3233514.png',
    'pecabra': 'https://cdn-icons-png.flaticon.com/512/3596/3596045.png',
    'disfarce': 'https://cdn-icons-png.flaticon.com/512/1144/1144760.png'
};

async function generatePurchaseReceipt(userName, itemName, itemKey, price, feedback) {
    // 🧾 Formato Retangular Horizontal (Estilo Cheque/Recibo)
    const canvas = createCanvas(600, 350);
    const ctx = canvas.getContext('2d');

    // Fundo Beco Dark (Mesmo estilo da loja)
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const grad = ctx.createRadialGradient(300, 175, 50, 300, 175, 300);
    grad.addColorStop(0, '#1a1a2e'); 
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Borda Neon VERDE (Sucesso)
    ctx.strokeStyle = '#57F287';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    // Título em PT-BR
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 35px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#57F287';
    ctx.fillText('COMPRA CONCLUÍDA', canvas.width / 2, 60);
    ctx.shadowBlur = 0;

    // Linha divisória
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 80);
    ctx.lineTo(550, 80);
    ctx.stroke();

    // --- LADO ESQUERDO: Ícone do Item ---
    try {
        const imgUrl = ITEM_IMAGES[itemKey];
        const icon = await loadImage(imgUrl);
        ctx.drawImage(icon, 50, 110, 120, 120);
    } catch (e) {
        ctx.fillStyle = '#fff';
        ctx.font = '60px serif';
        ctx.fillText('📦', 110, 180);
    }

    // --- LADO DIREITO: Detalhes ---
    ctx.textAlign = 'left';
    
    // Nome do Usuário
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`Comprador: ${userName}`, 200, 130);

    // Nome do Item
    ctx.fillStyle = '#9b59b6'; // Roxo Hype
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(itemName, 200, 170);

    // Valor Pago (Verde Neon)
    ctx.fillStyle = '#57F287';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`Pago: R$ ${price.toLocaleString('pt-BR')}`, 200, 210);

    // Feedback (Texto PT-BR quebrado)
    ctx.fillStyle = '#cccccc';
    ctx.font = '16px sans-serif';
    
    const words = feedback.split(' ');
    let line = '';
    let ty = 240;
    for(let word of words) {
        if ((line + word).length > 45) {
            ctx.fillText(line, 200, ty);
            line = word + ' ';
            ty += 20;
        } else { line += word + ' '; }
    }
    ctx.fillText(line, 200, ty);

    // Rodapé
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Recibo oficial do Mercado Negro - Hype Bot.', canvas.width / 2, 335);

    return canvas.toBuffer();
}

module.exports = { generatePurchaseReceipt };