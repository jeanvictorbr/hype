const { createCanvas, loadImage } = require('canvas');

async function generateContratosImage(user, contratos) {
    const width = 900; const height = 750; 
    const canvas = createCanvas(width, height); const ctx = canvas.getContext('2d');

    // Fundo Escuro do Submundo
    ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, width, height);

    // Efeito de Néon no fundo (AZUL HYPE)
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0, 89, 255, 0.15)'); 
    gradient.addColorStop(1, 'transparent'); 
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);

    // Linhas de Grade Tática (HUD Clean)
    ctx.strokeStyle = 'rgba(0, 89, 255, 0.05)'; ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
    for (let i = 0; i < height; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

    // ==========================================
    // CABEÇALHO COM AVATAR DO JOGADOR
    // ==========================================
    try {
        const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 128 });
        const avatar = await loadImage(avatarUrl);
        ctx.save();
        ctx.beginPath(); ctx.arc(100, 100, 60, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
        ctx.drawImage(avatar, 40, 40, 120, 120);
        ctx.restore();
        
        // Borda Azul no Avatar
        ctx.beginPath(); ctx.arc(100, 100, 60, 0, Math.PI * 2);
        ctx.lineWidth = 4; ctx.strokeStyle = '#0059ff'; ctx.stroke();
    } catch(e) {}

    // Textos do Cabeçalho
    ctx.fillStyle = '#ffffff'; ctx.font = '900 45px "Arial Black"'; ctx.textAlign = 'left';
    ctx.fillText('CONTRATOS DO SINDICATO', 180, 85);
    
    ctx.fillStyle = '#0059ff'; ctx.font = 'bold 22px Arial';
    ctx.fillText(`AGENTE RESPONSÁVEL: @${user.username.toUpperCase()}`, 180, 120);
    
    ctx.fillStyle = '#71717a'; ctx.font = 'italic 18px Arial';
    ctx.fillText('Cumpra as missões finalizando utilize "hcontratos entregar"para receber a maleta.', 180, 150);
    


    // ==========================================
    // DESENHAR AS 3 MISSÕES (CARDS)
    // ==========================================
    let startY = 200;
    for (let i = 0; i < contratos.length; i++) {
        const c = contratos[i];
        
        const isDone = c.completed;
        const mainColor = isDone ? '#10b981' : '#0059ff'; // Verde se completo, Azul Hype se andamento
        const bgCard = isDone ? 'rgba(16, 185, 129, 0.05)' : 'rgba(15, 20, 30, 0.8)';
        
        // Caixa da Missão
        ctx.fillStyle = bgCard;
        ctx.strokeStyle = mainColor; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(40, startY, 820, 150, 15); ctx.fill(); ctx.stroke();

        // Carimbo de Fundo se tiver pago
        if (isDone) {
            ctx.save();
            ctx.translate(650, startY + 75);
            ctx.rotate(-0.2);
            ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
            ctx.font = '900 60px "Arial Black"'; ctx.textAlign = 'center';
            ctx.fillText('PAGO', 0, 0);
            ctx.restore();
        }

        // Barra lateral indicadora de cor
        ctx.fillStyle = mainColor;
        ctx.beginPath(); ctx.roundRect(65, startY + 30, 8, 90, 4); ctx.fill();

        // Número da Missão
        ctx.fillStyle = mainColor; ctx.font = '900 24px "Arial Black"'; ctx.textAlign = 'left';
        ctx.fillText(`0${i + 1}.`, 90, startY + 50);

        // Título/Descrição
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px Arial';
        ctx.fillText(c.desc, 135, startY + 50);

        // Recompensa (Sem Emojis, usando Tag Visual de [ R$ ])
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.beginPath(); ctx.roundRect(135, startY + 63, 60, 25, 5); ctx.fill();
        ctx.fillStyle = '#10b981'; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
        ctx.fillText('R$', 165, startY + 81);

        ctx.fillStyle = '#10b981'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'left';
        ctx.fillText(`PAGAMENTO: R$ ${c.reward.toLocaleString('pt-BR')}`, 205, startY + 82);

        // Fundo da Barra de Progresso (Mais curta para não bater nos textos)
        ctx.fillStyle = '#09090b';
        ctx.beginPath(); ctx.roundRect(135, startY + 110, 400, 15, 8); ctx.fill();

        // Enchimento da Barra de Progresso
        const progPercent = Math.min(c.progress / c.target, 1);
        ctx.fillStyle = mainColor;
        ctx.shadowColor = mainColor; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.roundRect(135, startY + 110, Math.max(400 * progPercent, 15), 15, 8); ctx.fill();
        ctx.shadowBlur = 0; 

        // Texto do Progresso (Ex: 5 / 10) ajustado
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px Arial'; ctx.textAlign = 'right';
        ctx.fillText(`${c.progress} / ${c.target}`, 590, startY + 123);

        // Badge Escrito do Status (Distante para não encavalar)
        ctx.fillStyle = isDone ? '#10b981' : '#3b82f6';
        ctx.font = 'bold 18px Arial'; ctx.textAlign = 'right';
        ctx.fillText(isDone ? '[ CONCLUÍDO ]' : '[ EM ANDAMENTO ]', 830, startY + 123);

        startY += 175; 
    }

    return canvas.toBuffer('image/png');
}

module.exports = { generateContratosImage };