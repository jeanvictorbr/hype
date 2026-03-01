const { createCanvas, loadImage } = require('canvas');
const path = require('path');

async function generateShopCatalog() {
    // 🌃 Formato Quadrado e Robusto
    const canvas = createCanvas(700, 700);
    const ctx = canvas.getContext('2d');

    // Fundo: Beco Noturno Dark
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Textura de "Parede de Tijolos" ou Vinheta
    const grad = ctx.createRadialGradient(350, 350, 100, 350, 350, 450);
    grad.addColorStop(0, '#1a1a2e'); // Centro levemente azulado
    grad.addColorStop(1, '#000000'); // Bordas pretas
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Borda Neon Roxo Profundo
    ctx.strokeStyle = '#6a0dad';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    // Título Estilo Grafite
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#6a0dad';
    ctx.fillText('MERCADO NEGRO', canvas.width / 2, 80);
    ctx.shadowBlur = 0; // Reset sombra

    // Logo Hype pequena no canto
    try {
        const logo = await loadImage(path.join(__dirname, 'logo.png'));
        ctx.drawImage(logo, 20, 20, 60, 60);
    } catch (e) {}

    // Função para desenhar Itens no Beco
    const drawItem = (name, price, desc, y, emoji) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.roundRect ? ctx.fillRoundedRect(50, y, 600, 140, 15) : ctx.fillRect(50, y, 600, 140);
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, y, 600, 140);

        // Emoji/Ícone (Aumentado para não bugar)
        ctx.font = '60px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(emoji, 80, y + 90);

        // Textos
        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = '#9b59b6';
        ctx.fillText(name, 170, y + 45);

        ctx.font = '18px sans-serif';
        ctx.fillStyle = '#cccccc';
        // Wrap simples
        const words = desc.split(' ');
        let line = '';
        let ty = y + 75;
        for(let word of words) {
            if ((line + word).length > 45) {
                ctx.fillText(line, 170, ty);
                line = word + ' ';
                ty += 25;
            } else { line += word + ' '; }
        }
        ctx.fillText(line, 170, ty);

        // Preço Neon
        ctx.font = 'bold 26px sans-serif';
        ctx.fillStyle = '#57F287';
        ctx.textAlign = 'right';
        ctx.fillText(`R$ ${price.toLocaleString('pt-BR')}`, 630, y + 120);
    };

    drawItem('COLETE BALÍSTICO', 200000, 'Proteção total contra o próximo assalto. Uso único.', 150, '🛡️');
    drawItem('PÉ DE CABRA', 100000, 'Aumenta em 15% a chance de roubo por 24 horas.', 320, '🔨');
    drawItem('KIT DISFARCE', 150000, 'Corta 50% do valor de 3 multas policiais.', 490, '🎭');

    return canvas.toBuffer();
}

module.exports = { generateShopCatalog };