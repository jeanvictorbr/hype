const { prisma } = require('../core/database');

async function addTransaction(userId, type, amount, description) {
    try {
        if (!amount || amount <= 0) return; 

        let user = await prisma.hypeUser.findUnique({ where: { id: userId } });
        if (!user) user = await prisma.hypeUser.create({ data: { id: userId } });

        let history = [];
        if (user.extratoData) {
            history = typeof user.extratoData === 'string' ? JSON.parse(user.extratoData) : user.extratoData;
        }

        const newTx = {
            id: 'TX-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            type: type, 
            amount: amount,
            description: description,
            createdAt: new Date().toISOString()
        };

        history.unshift(newTx);
        if (history.length > 100) history = history.slice(0, 100);

        await prisma.hypeUser.update({
            where: { id: userId },
            data: { extratoData: history }
        });
    } catch (e) {
        console.error('Erro a salvar Extrato:', e);
    }
}

async function getTransactions(userId, page = 1, limit = 6) {
    try {
        const user = await prisma.hypeUser.findUnique({ where: { id: userId } });
        if (!user || !user.extratoData) return { data: [], totalPages: 1 };

        const history = typeof user.extratoData === 'string' ? JSON.parse(user.extratoData) : user.extratoData;
        
        const totalPages = Math.ceil(history.length / limit) || 1;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        return { data: history.slice(startIndex, endIndex), totalPages: totalPages };
    } catch (e) {
        return { data: [], totalPages: 1 };
    }
}

module.exports = { addTransaction, getTransactions };