const { prisma } = require('../core/database');

async function trackContract(userId, actionId, amount = 1) {
    try {
        const userDB = await prisma.hypeUser.findUnique({ where: { id: userId } });
        if (userDB && userDB.contratosData) {
            let contratos = typeof userDB.contratosData === 'string' ? JSON.parse(userDB.contratosData) : userDB.contratosData;
            let atualizou = false;
            
            for (let c of contratos) {
                if (c.id === actionId && !c.completed && c.progress < c.target) {
                    c.progress += amount;
                    if (c.progress >= c.target) {
                        c.progress = c.target;
                        c.completed = true;
                        // Paga a recompensa invisivelmente direto na carteira
                        await prisma.hypeUser.update({ where: { id: userId }, data: { carteira: { increment: c.reward } } });
                    }
                    atualizou = true;
                }
            }
            if (atualizou) {
                await prisma.hypeUser.update({ where: { id: userId }, data: { contratosData: contratos } });
            }
        }
    } catch (e) {
        console.error("❌ Erro no Tracker do Sindicato:", e);
    }
}

module.exports = { trackContract };