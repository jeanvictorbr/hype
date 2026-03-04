const { prisma } = require('../core/database');

function startVoiceFarming(client) {
    console.log('🎙️ [SISTEMA] Motor de Farm em Call iniciado (Permitido sozinho, 5k/5min)!');

    // "Caderninho" na memória do bot para garantir que ninguém passa dos 500k por dia
    const dailyLimits = new Map();

    // Roda exatamente a cada 5 minutos
    setInterval(async () => {
        const now = new Date();
        // Pega a data e a hora no fuso horário do Brasil
        const dateString = now.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
        const hour = parseInt(now.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", hour12: false }));

        // 🛡️ REGRA 1: Só funciona entre as 08:00 e as 21:59 (Até às 22h)
        if (hour < 8 || hour >= 22) return;

        const coinsToGive = 5000;
        const maxDaily = 500000;

        // Varre todos os servidores em que o bot está
        client.guilds.cache.forEach(guild => {
            // Pega todos os canais de voz (isVoiceBased() pega calls normais e de palco)
            const voiceChannels = guild.channels.cache.filter(c => c.isVoiceBased());

            voiceChannels.forEach(channel => {
                // Ignora o canal AFK (para a galera não farmar a dormir lá)
                if (guild.afkChannelId === channel.id) return;

                // Pega as pessoas reais na call (ignora bots de música, etc)
                const realMembers = channel.members.filter(m => !m.user.bot);

                realMembers.forEach(async member => {
                    const voice = member.voice;
                    
                    // 🛡️ REGRA 2: Não pode estar mutado (nem no próprio fone, nem mutado por um Admin)
                    if (voice.selfMute || voice.serverMute) return;

                    // 🛡️ REGRA 3: Controle do Limite Máximo (500k por dia)
                    let userLimit = dailyLimits.get(member.id);
                    
                    // Se mudou de dia ou ele ainda não farmou hoje, zera a conta dele
                    if (!userLimit || userLimit.date !== dateString) {
                        userLimit = { date: dateString, amount: 0 };
                    }

                    // Se já farmou os 500k de hoje, o bot simplesmente ignora e não paga mais
                    if (userLimit.amount >= maxDaily) return; 

                    // Garante que não ultrapassa os 500k na última entrega
                    const amountToAdd = (userLimit.amount + coinsToGive > maxDaily) 
                                        ? (maxDaily - userLimit.amount) 
                                        : coinsToGive;

                    try {
                        // Atualiza o limite do utilizador na memória
                        userLimit.amount += amountToAdd;
                        dailyLimits.set(member.id, userLimit);

                        // Faz o PIX silencioso direto na carteira do jogador
                        await prisma.hypeUser.upsert({
                            where: { id: member.id },
                            update: { carteira: { increment: amountToAdd } },
                            create: { id: member.id, carteira: amountToAdd }
                        });
                    } catch (error) {
                        console.error(`Erro ao pagar farm de call ao utilizador ${member.id}:`, error);
                    }
                });
            });
        });
    }, 5 * 60 * 1000); // 5 Minutos cravados
}

module.exports = { startVoiceFarming };