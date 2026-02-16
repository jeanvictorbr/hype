const generateTranscriptHTML = (guild, channel, messages, closerTag) => {
    // Inverte mensagens para ordem cronológica e filtra bots irrelevantes se necessário
    const msgs = Array.from(messages.values()).reverse();

    const messagesHTML = msgs.map(m => {
        const isBot = m.author.bot ? 'bot' : '';
        const avatar = m.author.displayAvatarURL({ extension: 'png', size: 64 });
        
        // Tratamento simples de anexos (imagens)
        let attachmentsHTML = '';
        if (m.attachments.size > 0) {
            attachmentsHTML = m.attachments.map(att => 
                `<br><img src="${att.url}" class="attachment" alt="Anexo">`
            ).join('');
        }

        return `
            <div class="message ${isBot}">
                <img src="${avatar}" class="avatar">
                <div class="content">
                    <div class="meta">
                        <span class="username">${m.author.username}</span>
                        <span class="timestamp">${m.createdAt.toLocaleString('pt-PT')}</span>
                    </div>
                    <div class="text">
                        ${m.content}
                        ${attachmentsHTML}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html lang="pt-PT">
    <head>
        <meta charset="UTF-8">
        <title>Ticket Log: ${channel.name}</title>
        <style>
            body { background-color: #313338; color: #dbdee1; font-family: 'gg sans', 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; }
            .header { border-bottom: 1px solid #3f4147; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { color: #f2f3f5; margin: 0; }
            .info { color: #949ba4; font-size: 14px; margin-top: 5px; }
            .message { display: flex; margin-bottom: 18px; }
            .avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 16px; margin-top: 2px; }
            .meta { margin-bottom: 4px; }
            .username { color: #f2f3f5; font-weight: 500; margin-right: 8px; }
            .bot .username::after { content: 'APP'; background: #5865f2; color: #fff; font-size: 10px; padding: 1px 4px; border-radius: 3px; margin-left: 5px; vertical-align: middle; }
            .timestamp { color: #949ba4; font-size: 12px; }
            .text { color: #dcddde; white-space: pre-wrap; line-height: 1.375rem; }
            .attachment { max-width: 400px; max-height: 400px; border-radius: 8px; margin-top: 5px; display: block; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📄 Transcrição de Ticket</h1>
            <div class="info">
                <strong>ID:</strong> ${channel.name} | 
                <strong>Servidor:</strong> ${guild.name} | 
                <strong>Fechado por:</strong> ${closerTag}
            </div>
        </div>
        <div class="chat-container">
            ${messagesHTML}
        </div>
    </body>
    </html>
    `;
};

module.exports = { generateTranscriptHTML };