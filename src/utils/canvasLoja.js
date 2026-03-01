const { createCanvas, loadImage } = require('canvas');
const path = require('path');

async function generateShopCatalog() {
    // 📱 Tamanho do catálogo (Estilo Mobile / Vertical)
    const canvas = createCanvas(450, 750);
    const ctx = canvas.getContext('2d');

    // ==========================================
    // Fundo e Estilização Geral
    // ==========================================
    // Fundo Escuro Metalizado
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Borda Neon (PURPLE / GREEN)
    ctx.strokeStyle = '#9b59b6'; // Roxo Hype
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Gradiente de Fundo sutil
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a1e');
    gradient.addColorStop(0.5, '#0a0a0c');
    gradient.addColorStop(1, '#1a1a1e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ==========================================
    // Cabeçalho (Header)
    // ==========================================
    // Logo Hype (Usa o logo.png que já tens no src/utils/)
    try {
        const logoPath = path.join(__dirname, 'logo.png');
        const logo = await loadImage(logoPath);
        const logoWidth = 100;
        const logoHeight = (logo.height / logo.width) * logoWidth;
        ctx.drawImage(logo, (canvas.width / 2) - (logoWidth / 2), 20, logoWidth, logoHeight);
    } catch (e) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('HYPE', canvas.width / 2, 70);
    }

    // Título do Catálogo
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CATÁLOGO ILEGAL', canvas.width / 2, 130);
    
    // Subtítulo
    ctx.fillStyle = '#9b59b6';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('MERCADO NEGRO', canvas.width / 2, 160);

    // ==========================================
    // SISTEMA DE PRODUTOS
    // ==========================================
    // Função para desenhar cada card de produto
    const drawProductCard = (title, desc, price, y, iconEmoji) => {
        // Retângulo de Fundo do Card
        ctx.fillStyle = '#1a1a1e';
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 2;
        ctx.fillRect(30, y, canvas.width - 60, 160);
        ctx.strokeRect(30, y, canvas.width - 60, 160);

        // Ícone/Emoji Gigante
        ctx.fillStyle = '#ffffff';
        ctx.font = '50px serif';
        ctx.textAlign = 'left';
        ctx.fillText(iconEmoji, 50, y + 80);

        // Título e Descrição (Mais para a direita)
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(title, 130, y + 35);
        
        ctx.fillStyle = '#a1a1aa';
        ctx.font = '16px sans-serif';
        
        // Wrap de Texto Manual para a descrição
        const wrapText = (text, x, startY, maxWidth) => {
            const words = text.split(' ');
            let line = '';
            for(let n = 0; n < words.length; n++) {
                let testLine = line + words[n] + ' ';
                let metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && n > 0) {
                    ctx.fillText(line, x, startY);
                    line = words[n] + ' ';
                    startY += 20; 
                } else { line = testLine; }
            }
            ctx.fillText(line, x, startY);
        }
        wrapText(desc, 130, y + 65, canvas.width - 200);

        // Preço (Destaque Neon Verde)
        ctx.fillStyle = '#57F287';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`R$ ${price.toLocaleString('pt-BR')}`, canvas.width - 50, y + 140);
    }

    // DESENHAR OS PRODUTOS
    drawProductCard(
        'COLETE BALÍSTICO VIP', 
        'Proteção total contra o próximo assalto. Quebra após 1 uso. Segurança para magnatas.',
        200000, 200, '🛡️'
    );
    drawProductCard(
        'PÉ DE CABRA DE TITÂNIO', 
        'Facilita o acesso a carteiras trancadas. +15% de chance de sucesso por 24 horas.',
        100000, 380, '🪓'
    );
    drawProductCard(
        'KIT DE DISFARCE HYPE', 
        'Diminui o valor da multa ao ser pego pela polícia em 50%. Válido por 3 roubos.',
        150000, 560, '👀'
    );

    // ==========================================
    // Rodapé (Footer)
    // ==========================================
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Compras cobradas diretamente do seu Cartão Hype. Koda Studios.', canvas.width / 2, 730);

    return canvas.toBuffer();
}

module.exports = { generateShopCatalog };