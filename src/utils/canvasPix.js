const { createCanvas, loadImage } = require('canvas');
const path = require('path');

async function generatePixReceipt(sender, receiver, amount, txId) {
    // Tamanho do comprovante (estilo ecrã de telemóvel)
    const canvas = createCanvas(450, 700);
    const ctx = canvas.getContext('2d');

    // Fundo Escuro (Estilo Dark / Hype)
    ctx.fillStyle = '#121214';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cabeçalho (Header)
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, canvas.width, 120);

    // Logo Hype (Usa o logo.png que já tens no src/utils/)
    try {
        const logoPath = path.join(__dirname, 'logo.png');
        const logo = await loadImage(logoPath);
        const logoWidth = 80;
        const logoHeight = (logo.height / logo.width) * logoWidth;
        ctx.drawImage(logo, (canvas.width / 2) - (logoWidth / 2), 20, logoWidth, logoHeight);
    } catch (e) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('HYPE BANK', canvas.width / 2, 65);
    }

    // Título Comprovante
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('COMPROVANTE DE PIX', canvas.width / 2, 160);

    // Valor da Transferência
    ctx.fillStyle = '#57F287'; // Verde Discord
    ctx.font = 'bold 45px sans-serif';
    ctx.fillText(`R$ ${amount.toLocaleString('pt-BR')}`, canvas.width / 2, 220);

    // ==========================================
    // SISTEMA DE AVATARES (Quem enviou -> Quem recebeu)
    // ==========================================
    const senderAvatarUrl = sender.displayAvatarURL({ extension: 'png', size: 128 });
    const receiverAvatarUrl = receiver.displayAvatarURL({ extension: 'png', size: 128 });

    const avatarSize = 80;
    const yAvatars = 280;
    const xSender = 80;
    const xReceiver = canvas.width - 80 - avatarSize;

    // Linha de conexão / Seta de envio
    ctx.beginPath();
    ctx.strokeStyle = '#3a3a40';
    ctx.lineWidth = 3;
    ctx.moveTo(xSender + avatarSize + 10, yAvatars + avatarSize / 2);
    ctx.lineTo(xReceiver - 10, yAvatars + avatarSize / 2);
    ctx.stroke();

    ctx.fillStyle = '#57F287';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('➔', canvas.width / 2, yAvatars + (avatarSize / 2) + 10);

    // Função para desenhar avatar circular com borda
    async function drawAvatar(url, x, y) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        try {
            const img = await loadImage(url);
            ctx.drawImage(img, x, y, avatarSize, avatarSize);
        } catch (e) {
            ctx.fillStyle = '#3a3a40';
            ctx.fillRect(x, y, avatarSize, avatarSize);
        }
        ctx.restore();
        
        // Borda circular VIP
        ctx.beginPath();
        ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#9b59b6'; // Roxo Hype
        ctx.stroke();
    }

    await drawAvatar(senderAvatarUrl, xSender, yAvatars);
    await drawAvatar(receiverAvatarUrl, xReceiver, yAvatars);

    // Nomes debaixo dos avatares
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    
    const truncate = (str, n) => str.length > n ? str.substring(0, n - 1) + '...' : str;
    ctx.fillText(truncate(sender.username, 12), xSender + avatarSize / 2, yAvatars + avatarSize + 25);
    ctx.fillText(truncate(receiver.username, 12), xReceiver + avatarSize / 2, yAvatars + avatarSize + 25);

    // ==========================================
    // DETALHES TÉCNICOS DA TRANSAÇÃO
    // ==========================================
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Detalhes da Transação', 30, 450);

    // Linha divisória
    ctx.beginPath();
    ctx.strokeStyle = '#2a2a30';
    ctx.lineWidth = 2;
    ctx.moveTo(30, 465);
    ctx.lineTo(canvas.width - 30, 465);
    ctx.stroke();

    ctx.font = '16px sans-serif';
    const drawRow = (label, value, y) => {
        ctx.fillStyle = '#a1a1aa';
        ctx.textAlign = 'left';
        ctx.fillText(label, 30, y);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.fillText(value, canvas.width - 30, y);
    }

    // Gerar Data e Hora formatada para o Brasil
    const date = new Date();
    const dateStr = date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR');

    drawRow('ID da Transação', txId, 500);
    drawRow('Data e Hora', dateStr, 540);
    drawRow('Instituição', 'Hype Bank', 580);
    drawRow('Método', 'PIX', 620);

    // Rodapé
    ctx.fillStyle = '#a1a1aa';
    ctx.textAlign = 'center';
    ctx.font = '12px sans-serif';
    ctx.fillText('Este é um comprovante oficial do Hype Bot.', canvas.width / 2, 680);

    return canvas.toBuffer();
}

module.exports = { generatePixReceipt };