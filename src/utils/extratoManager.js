const { prisma } = require('../core/database');

/**
 * Adiciona uma nova transação ao Extrato Bancário
 * @param {string} userId O ID do Discord do jogador
 * @param {string} type 'IN' (Entrada de Dinheiro) ou 'OUT' (Saída de Dinheiro)
 * @param {number} amount Quantia de Dinheiro Movida
 * @param {string} description Texto explicativo (Ex: "Pix para @João", "Fiança Polícia")
 */
async function addTransaction(userId, type, amount, description) {
    try {
        if (!amount || amount <= 0) return; // Não guarda extratos zerados

        // Procura ou cria o utilizador
        let user = await prisma.hypeUser.findUnique({ where: { id: userId } });
        if (!user) user = await prisma.hypeUser.create({ data: { id: userId } });

        // Tenta puxar o histórico antigo
        let history = [];
        if (user.extratoData) {
            history = typeof user.extratoData === 'string' ? JSON.parse(user.extratoData) : user.extratoData;
        }

        // Cria a transação nova
        const newTx = {
            id: 'TX-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            type: type, // 'IN' ou 'OUT'
            amount: amount,
            description: description,
            createdAt: new Date().toISOString()
        };

        // Bota no topo da lista
        history.unshift(newTx);

        // Limita a 100 registos por jogador (para o banco de dados não explodir de tamanho)
        if (history.length > 100) history = history.slice(0, 100);

        // Salva
        await prisma.hypeUser.update({
            where: { id: userId },
            data: { extratoData: history }
        });

    } catch (e) {
        console.error('Erro a salvar Extrato:', e);
    }
}

/**
 * Pega as transações de um utilizador (com paginação)
 */
async function getTransactions(userId, page = 1, limit = 6) {
    try {
        const user = await prisma.hypeUser.findUnique({ where: { id: userId } });
        if (!user || !user.extratoData) return { data: [], totalPages: 1 };

        const history = typeof user.extratoData === 'string' ? JSON.parse(user.extratoData) : user.extratoData;
        
        const totalPages = Math.ceil(history.length / limit) || 1;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        return {
            data: history.slice(startIndex, endIndex),
            totalPages: totalPages
        };
    } catch (e) {
        return { data: [], totalPages: 1 };
    }
}

module.exports = { addTransaction, getTransactions };