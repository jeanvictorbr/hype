const { createCanvas, loadImage } = require('canvas');
const path = require('path');

async function generateShopCatalog() {
    // 🌃 Formato Quadrado Robusto (700x700)
    const canvas = createCanvas(700, 700);
    const ctx = canvas.getContext('2d');

    // Fundo: Beco Noturno Dark
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gradiente Central para dar profundidade
    const grad = ctx.createRadialGradient(350, 350, 100, 350, 350, 450);
    grad.addColorStop(0, '#11112b'); 
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Borda Neon Roxo Profundo
    ctx.strokeStyle = '#6a0dad';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    // Título Mercado Negro
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#6a0dad';
    ctx.fillText('MERCADO NEGRO', canvas.width / 2, 80);
    ctx.shadowBlur = 0;

    // Função interna para desenhar retângulos arredondados manualmente (Compatível)
    const drawRoundedRect = (x, y, w, h, r) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    };

    // Função para desenhar os itens
    const drawItem = (name, price, desc, y, emoji) => {
        // Fundo do card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        drawRoundedRect(50, y, 600, 140, 15);
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Emoji (Aumentado para visualização clara)
        ctx.font = '60px serif';
        ctx.textAlign = 'left';
        ctx.fillText(emoji, 80, y + 90);

        // Título do Produto
        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = '#9b59b6';
        ctx.fillText(name, 170, y + 45);

        // Descrição com quebra de linha simples
        ctx.font = '18px sans-serif';
        ctx.fillStyle = '#cccccc';
        const words = desc.split(' ');
        let line = '';
        let ty = y + 75;
        for(let word of words) {
            if ((line + word).length > 40) {
                ctx.fillText(line, 170, ty);
                line = word + ' ';
                ty += 25;
            } else { line += word + ' '; }
        }
        ctx.fillText(line, 170, ty);

        // Preço em Destaque
        ctx.font = 'bold 26px sans-serif';
        ctx.fillStyle = '#57F287';
        ctx.textAlign = 'right';
        ctx.fillText(`R$ ${price.toLocaleString('pt-BR')}`, 630, y + 120);
    };

    // Lista de Produtos no Beco
    drawItem('COLETE BALÍSTICO', 200000, 'Proteção total contra o próximo assalto. Uso único.', 150, '🛡️');
    drawItem('PÉ DE CABRA', 100000, 'Aumenta em 15% a chance de roubo por 24 horas.', 320, '🔨');
    drawItem('KIT DISFARCE', 150000, 'Corta 50% do valor de 3 multas policiais.', 490, '🎭');

    return canvas.toBuffer();
}

module.exports = { generateShopCatalog };