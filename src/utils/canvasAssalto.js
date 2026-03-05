const { createCanvas, loadImage } = require('canvas');

function drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius); ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height); ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
}

async function generateHeistImage(state, players = [], pot = 0, frame = 1) {
    const width = 800; const height = 500; 
    const canvas = createCanvas(width, height); const ctx = canvas.getContext('2d');

    // ==========================================
    // 1. ANIMAÇÕES PROCEDURAIS DE AÇÃO (FRAME 1 E FRAME 2)
    // ==========================================
    if (state.startsWith('action_')) {
        ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, width, height);

        // FUNÇÕES PROCEDURAIS PARA DESENHAR ELEMENTOS
        if (state === 'action_c4') {
            if (frame === 1) {
                // Desenhando a C4 plantada
                ctx.fillStyle = '#333'; ctx.fillRect(300, 200, 200, 100);
                ctx.fillStyle = '#ff0000'; ctx.font = 'bold 50px monospace'; ctx.fillText('00:03', 330, 265);
                ctx.strokeStyle = 'red'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(350, 200); ctx.lineTo(400, 150); ctx.stroke();
                ctx.strokeStyle = 'blue'; ctx.beginPath(); ctx.moveTo(450, 200); ctx.lineTo(400, 150); ctx.stroke();
                ctx.fillStyle = '#fff'; ctx.font = 'bold 30px Arial'; ctx.fillText('PLANTANDO EXPLOSIVO...', 200, 380);
            } else {
                // A Explosão
                const boom = ctx.createRadialGradient(400, 250, 10, 400, 250, 400);
                boom.addColorStop(0, '#ffffff'); boom.addColorStop(0.2, '#facc15'); boom.addColorStop(0.6, '#ea580c'); boom.addColorStop(1, '#450a0a');
                ctx.fillStyle = boom; ctx.fillRect(0, 0, width, height);
                // Faíscas
                for(let i=0; i<80; i++) {
                    ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#facc15';
                    ctx.beginPath(); ctx.arc(400 + (Math.random()-0.5)*700, 250 + (Math.random()-0.5)*500, Math.random()*15, 0, Math.PI*2); ctx.fill();
                }
                ctx.fillStyle = '#fff'; ctx.font = '900 80px "Arial Black"'; ctx.textAlign = 'center'; ctx.fillText('KABOOM!', 400, 280);
            }
        } 
        else if (state === 'action_shoot') {
            if (frame === 1) {
                // Miras e Lasers vermelhos
                ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, width, height);
                for(let i=0; i<5; i++) {
                    let y = 100 + (i * 80);
                    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(800, y + (Math.random()*50 - 25)); ctx.stroke();
                }
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(400, 250, 80, 0, Math.PI*2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(400, 150); ctx.lineTo(400, 350); ctx.moveTo(300, 250); ctx.lineTo(500, 250); ctx.stroke();
                ctx.fillStyle = '#fff'; ctx.font = 'bold 30px Arial'; ctx.textAlign = 'center'; ctx.fillText('ALVO NA MIRA...', 400, 400);
            } else {
                // Tiros e rastos de bala
                ctx.fillStyle = '#1e1b4b'; ctx.fillRect(0, 0, width, height);
                for(let i=0; i<30; i++) {
                    ctx.strokeStyle = '#facc15'; ctx.lineWidth = Math.random() * 6 + 2;
                    let y = Math.random() * height;
                    ctx.beginPath(); ctx.moveTo(Math.random() * 200, y); ctx.lineTo(Math.random() * 400 + 400, y + (Math.random()*20-10)); ctx.stroke();
                    // Clarão
                    ctx.fillStyle = 'rgba(250, 204, 21, 0.5)';
                    ctx.beginPath(); ctx.arc(Math.random()*width, Math.random()*height, Math.random()*40+20, 0, Math.PI*2); ctx.fill();
                }
                ctx.fillStyle = '#fff'; ctx.font = '900 70px "Arial Black"'; ctx.textAlign = 'center'; ctx.fillText('RAJADA DE BALA!', 400, 280);
            }
        }
        else if (state === 'action_hack') {
            if (frame === 1) {
                // Barra de carregamento
                ctx.fillStyle = '#022c22'; ctx.fillRect(0, 0, width, height);
                ctx.fillStyle = '#064e3b'; drawRoundRect(ctx, 150, 220, 500, 40, 10); ctx.fill();
                ctx.fillStyle = '#10b981'; drawRoundRect(ctx, 150, 220, 340, 40, 10); ctx.fill(); // 68% cheio
                ctx.fillStyle = '#fff'; ctx.font = 'bold 24px monospace'; ctx.fillText('INJETANDO PAYLOAD... [68%]', 150, 200);
            } else {
                // Matrix Rain
                ctx.fillStyle = '#020617'; ctx.fillRect(0, 0, width, height);
                ctx.fillStyle = '#10b981'; ctx.font = 'bold 20px monospace';
                for(let i=0; i<150; i++) {
                    ctx.fillText(Math.random().toString(36).substring(2, 5), Math.random()*width, Math.random()*height);
                }
                ctx.fillStyle = '#fff'; ctx.font = '900 65px "Arial Black"'; ctx.textAlign = 'center'; 
                ctx.shadowColor = '#10b981'; ctx.shadowBlur = 20; ctx.fillText('ACESSO LIBERADO', 400, 270);
            }
        }
        else if (state === 'action_drill') {
            if (frame === 1) {
                // Aço aquecendo
                ctx.fillStyle = '#1f2937'; ctx.fillRect(0, 0, width, height);
                ctx.strokeStyle = '#374151'; ctx.lineWidth = 10;
                for(let i=0; i<800; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, 500); ctx.stroke(); }
                // Fio de fogo
                ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 15; ctx.shadowColor = '#facc15'; ctx.shadowBlur = 30;
                ctx.beginPath(); ctx.moveTo(200, 250); ctx.lineTo(500, 250); ctx.stroke();
                ctx.fillStyle = '#fff'; ctx.font = 'bold 30px Arial'; ctx.textAlign = 'center'; ctx.fillText('AQUECENDO O TITÂNIO...', 400, 350);
            } else {
                // Chuva de Faíscas
                ctx.fillStyle = '#450a0a'; ctx.fillRect(0, 0, width, height);
                for(let i=0; i<200; i++) {
                    ctx.fillStyle = Math.random() > 0.5 ? '#facc15' : '#f97316';
                    ctx.fillRect(400 + (Math.random()-0.5)*600, 250 + (Math.random()-0.5)*500, Math.random()*20+5, Math.random()*4+2);
                }
                ctx.fillStyle = '#fff'; ctx.font = '900 65px "Arial Black"'; ctx.textAlign = 'center'; 
                ctx.shadowColor = '#ea580c'; ctx.shadowBlur = 20; ctx.fillText('CORTANDO AÇO!', 400, 270);
            }
        }
        else if (state === 'action_drive') {
            if (frame === 1) {
                // Velocímetro
                ctx.fillStyle = '#111'; ctx.fillRect(0, 0, width, height);
                ctx.strokeStyle = '#333'; ctx.lineWidth = 20; ctx.beginPath(); ctx.arc(400, 300, 150, Math.PI, 0); ctx.stroke();
                ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 20; ctx.beginPath(); ctx.arc(400, 300, 150, Math.PI, Math.PI * 1.8); ctx.stroke();
                // Ponteiro
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(400, 300); ctx.lineTo(400 + Math.cos(Math.PI*1.8)*130, 300 + Math.sin(Math.PI*1.8)*130); ctx.stroke();
                ctx.fillStyle = '#fff'; ctx.font = 'bold 40px Arial'; ctx.textAlign = 'center'; ctx.fillText('180 KM/H', 400, 360);
            } else {
                // Motion Blur e Fuga
                ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, width, height);
                for(let i=0; i<40; i++) {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random()*0.5})`; ctx.lineWidth = Math.random()*10;
                    let y = Math.random() * height;
                    ctx.beginPath(); ctx.moveTo(Math.random()*300, y); ctx.lineTo(Math.random()*400+400, y); ctx.stroke();
                }
                ctx.fillStyle = '#fff'; ctx.font = '900 65px "Arial Black"'; ctx.textAlign = 'center'; 
                ctx.shadowColor = '#3b82f6'; ctx.shadowBlur = 20; ctx.fillText('PREGO A FUNDO!', 400, 270);
            }
        }
        else {
            // Genérico para as outras ações (Fumo, EMP, Negociação, etc)
            ctx.fillStyle = '#18181b'; ctx.fillRect(0, 0, width, height);
            const grad = ctx.createRadialGradient(400, 250, 0, 400, 250, 400);
            grad.addColorStop(0, frame === 1 ? '#3f3f46' : '#ef4444'); grad.addColorStop(1, '#000');
            ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#fff'; ctx.font = '900 55px "Arial Black"'; ctx.textAlign = 'center';
            ctx.fillText(frame === 1 ? 'EXECUTANDO A AÇÃO...' : 'O DESTINO FOI SELADO!', 400, 270);
        }

        return canvas.toBuffer('image/png');
    }

    // ==========================================
    // 2. FUNDO BASE DO CENÁRIO (LOBBY & FASES FINAIS)
    // ==========================================
    ctx.fillStyle = '#0a0a0c'; ctx.fillRect(0, 0, width, height);

    let glowColor = 'rgba(59, 130, 246, 0.15)'; 
    if (state === 'hostage') glowColor = 'rgba(168, 85, 247, 0.15)'; 
    if (state === 'vault') glowColor = 'rgba(250, 204, 21, 0.15)'; 
    if (state === 'ambush') glowColor = 'rgba(239, 68, 68, 0.15)'; 
    if (state === 'escape') glowColor = 'rgba(249, 115, 22, 0.15)'; 
    if (state === 'final_profit') glowColor = 'rgba(16, 185, 129, 0.3)'; // Verde Lucro
    if (state === 'final_loss') glowColor = 'rgba(245, 158, 11, 0.3)'; // Laranja Preju
    if (state === 'final_jail') glowColor = 'rgba(220, 38, 38, 0.4)'; // Vermelho Cadeia

    const glow = ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, 600);
    glow.addColorStop(0, glowColor); glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);

    // ==========================================
    // 3. TÍTULO E HUD (Ajustado para não cortar!)
    // ==========================================
    ctx.fillStyle = '#ffffff'; 
    ctx.font = '900 38px "Arial Black"'; // Fonte levemente menor para caber textos grandes
    ctx.textAlign = 'center';
    
    let title = "O PLANO (LOBBY)";
    if (state === 'entrance') title = "FASE 1: A INFILTRAÇÃO";
    if (state === 'hostage') title = "FASE 2: O DOMÍNIO";
    if (state === 'vault') title = "FASE 3: O ALVO PRINCIPAL";
    if (state === 'ambush') title = "FASE 4: O CONFRONTO";
    if (state === 'escape') title = "FASE 5: A FUGA";
    if (state === 'final_profit') title = "ASSALTO CONCLUÍDO: SUCESSO!";
    if (state === 'final_loss') title = "ASSALTO CONCLUÍDO: PREJUÍZO";
    if (state === 'final_jail') title = "OPERAÇÃO FALHOU: BUSTED!";

    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 10;
    ctx.fillText(title, width/2, 60); ctx.shadowBlur = 0;

    if (!state.startsWith('final_jail')) {
        ctx.fillStyle = state === 'final_loss' ? '#f87171' : '#facc15'; 
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`VALOR DO MALOTE: R$ ${pot.toLocaleString('pt-BR')}`, width/2, 105);
    }

    // ==========================================
    // 4. EQUIPA (CARDS COM AVATAR DINÂMICO)
    // ==========================================
    const isFinal = state.startsWith('final_');
    const cardW = isFinal ? 175 : 160; // Cards maiores na tela final
    const cardH = isFinal ? 260 : 240; 
    const spacing = 20;
    const totalW = (players.length * cardW) + ((players.length - 1) * spacing);
    let startX = (width - totalW) / 2;
    const startY = isFinal ? 150 : 160;

    for (let i = 0; i < players.length; i++) {
        const p = players[i];

        ctx.fillStyle = p.isDead ? 'rgba(30, 30, 30, 0.8)' : 'rgba(25, 25, 35, 0.9)';
        drawRoundRect(ctx, startX, startY, cardW, cardH, 15); ctx.fill();

        let roleColor = '#ffffff';
        if (p.role === 'Atirador') roleColor = '#ef4444';
        if (p.role === 'Hacker') roleColor = '#3b82f6';
        if (p.role === 'Piloto') roleColor = '#facc15';
        if (p.role === 'Cérebro') roleColor = '#a855f7';
        if (p.isDead) roleColor = '#52525b';

        ctx.lineWidth = 3; ctx.strokeStyle = roleColor; ctx.stroke();

        // Avatar Circular 
        const avatarSize = isFinal ? 100 : 80;
        const avatarX = startX + cardW/2;
        const avatarY = startY + (isFinal ? 70 : 60);

        ctx.save();
        ctx.beginPath(); ctx.arc(avatarX, avatarY, avatarSize/2, 0, Math.PI * 2);
        ctx.closePath(); ctx.clip();

        if (p.avatarBuffer) {
            try {
                if (p.isDead) { ctx.globalCompositeOperation = 'luminosity'; ctx.globalAlpha = 0.4; }
                const img = await loadImage(p.avatarBuffer);
                ctx.drawImage(img, avatarX - avatarSize/2, avatarY - avatarSize/2, avatarSize, avatarSize);
                
                if (p.isDead) {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.fillStyle = 'rgba(220, 38, 38, 0.6)'; // Sangue escuro nos mortos
                    ctx.fillRect(avatarX - avatarSize/2, avatarY - avatarSize/2, avatarSize, avatarSize);
                }
            } catch(e) {}
        } else {
            ctx.fillStyle = '#3f3f46'; ctx.fill();
        }
        ctx.restore();

        ctx.beginPath(); ctx.arc(avatarX, avatarY, avatarSize/2, 0, Math.PI * 2);
        ctx.lineWidth = 3; ctx.strokeStyle = roleColor; ctx.stroke();

        // Nome
        ctx.fillStyle = p.isDead ? '#71717a' : '#ffffff'; ctx.font = 'bold 18px Arial';
        let name = p.name.length > 12 ? p.name.substring(0, 12) + '..' : p.name;
        ctx.fillText(name, startX + cardW/2, startY + (isFinal ? 150 : 140));

        // Papel
        ctx.fillStyle = p.isDead ? '#52525b' : roleColor; ctx.font = 'bold 16px Arial';
        let printRole = p.role.toUpperCase().replace('É', 'E');
        ctx.fillText(printRole, startX + cardW/2, startY + (isFinal ? 180 : 170));

        // Status Pílula
        ctx.fillStyle = p.isDead ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
        drawRoundRect(ctx, startX + 20, startY + (isFinal ? 205 : 190), cardW - 40, 30, 8); ctx.fill();
        
        ctx.fillStyle = p.isDead ? '#fca5a5' : '#6ee7b7'; ctx.font = 'bold 13px Arial';
        ctx.fillText(p.isDead ? 'BAIXA/PRESO' : 'SOBREVIVENTE', startX + cardW/2, startY + (isFinal ? 225 : 210));

        startX += cardW + spacing;
    }

    return canvas.toBuffer('image/png');
}

module.exports = { generateHeistImage };