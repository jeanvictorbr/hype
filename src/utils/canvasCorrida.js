const { createCanvas } = require('canvas');

function drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y); ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius); ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height); ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
}

async function generateRaceImage(state, cars) {
    const width = 800; const height = 400;
    const canvas = createCanvas(width, height); const ctx = canvas.getContext('2d');

    // 1. Fundo de Asfalto Noturno
    ctx.fillStyle = '#0f1015';
    ctx.fillRect(0, 0, width, height);

    // 2. Linhas da Pista
    const startX = 50; const endX = 720;
    const laneHeight = height / 4;

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#333333';
    for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.setLineDash([15, 10]);
        ctx.moveTo(startX, i * laneHeight);
        ctx.lineTo(endX + 30, i * laneHeight);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // 3. Linha de Chegada (Checkerboard)
    ctx.fillStyle = '#ffffff';
    for (let y = 0; y < height; y += 20) {
        ctx.fillStyle = (y / 20) % 2 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(endX, y, 10, 20);
        ctx.fillStyle = (y / 20) % 2 === 0 ? '#000000' : '#ffffff';
        ctx.fillRect(endX + 10, y, 10, 20);
    }

    // 4. Desenhar os Carros (Neon Lightcycles)
    const colors = {
        'red': { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.6)' },
        'blue': { main: '#3b82f6', glow: 'rgba(59, 130, 246, 0.6)' },
        'green': { main: '#10b981', glow: 'rgba(16, 185, 129, 0.6)' },
        'yellow': { main: '#facc15', glow: 'rgba(250, 204, 21, 0.6)' }
    };

    cars.forEach((car, index) => {
        const yCenter = (index * laneHeight) + (laneHeight / 2);
        
        // Converte o progresso (0-100) para pixels (X)
        const carX = startX + ((endX - startX) * (car.progress / 100));

        // Rasto de luz (Trail)
        const trailGrad = ctx.createLinearGradient(startX, 0, carX, 0);
        trailGrad.addColorStop(0, 'transparent');
        trailGrad.addColorStop(1, colors[car.color].glow);
        ctx.beginPath();
        ctx.moveTo(startX, yCenter); ctx.lineTo(carX, yCenter);
        ctx.lineWidth = 6; ctx.strokeStyle = trailGrad; 
        ctx.shadowColor = colors[car.color].main; ctx.shadowBlur = 10;
        ctx.stroke(); ctx.shadowBlur = 0;

        // O Carro (Pílula Cyberpunk)
        ctx.fillStyle = '#111827'; // Corpo do carro
        drawRoundRect(ctx, carX - 30, yCenter - 10, 40, 20, 8);
        ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = colors[car.color].main;
        ctx.stroke();

        // Farol de Neon
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = colors[car.color].main; ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.arc(carX + 5, yCenter, 4, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    });

    // 5. HUD Superior (Fase da Corrida)
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    
    let hudText = "🏁 PREPAREM-SE...";
    if (state === 'racing') hudText = "🔥 CORRIDA EM ANDAMENTO!";
    if (state === 'finished') hudText = "🏆 CORRIDA ENCERRADA!";
    ctx.fillText(hudText, width / 2, 28);

    return canvas.toBuffer('image/png');
}

module.exports = { generateRaceImage };