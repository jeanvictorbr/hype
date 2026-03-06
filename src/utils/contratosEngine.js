// src/utils/contratosEngine.js

const TAREFAS = {
    // 🎰 CASSINO
    tigrinho: [
        { id: 'play_tiger', desc: 'Gire a máquina do Tigrinho', min: 10, max: 40 },
        { id: 'win_tiger', desc: 'Ganhe prêmios no Tigrinho (Qualquer valor)', min: 3, max: 15 }
    ],
    crash: [
        { id: 'play_crash', desc: 'Aposte no Foguetão (Crash)', min: 5, max: 20 },
        { id: 'win_crash_2x', desc: 'Faça retiradas seguras acima de 2.0x no Crash', min: 2, max: 8 }
    ],
    mines: [
        { id: 'play_mines', desc: 'Jogue Campo Minado', min: 5, max: 25 },
        { id: 'win_mines', desc: 'Saia vivo do Campo Minado com lucro', min: 3, max: 10 }
    ],
    
    // 🔫 SUBMUNDO & CRIME
    roubo: [
        { id: 'try_roubo', desc: 'Tente roubar a carteira de pessoas na rua', min: 3, max: 10 },
        { id: 'success_roubo', desc: 'Tenha sucesso em roubos de rua', min: 1, max: 5 }
    ],
    assalto: [
        { id: 'join_heist', desc: 'Participe de Assaltos a Banco', min: 1, max: 3 }
    ],
    roleta: [
        { id: 'play_roleta', desc: 'Sente na mesa de Roleta Russa', min: 2, max: 6 },
        { id: 'win_roleta', desc: 'Sobreviva e vença na Roleta Russa', min: 1, max: 2 }
    ],

    // 🎭 SOCIAL E ROTINA
    interacoes: [
        { id: 'social_bater', desc: 'Arrume confusão (Socar, Chutar ou Bater)', min: 5, max: 15 },
        { id: 'social_amor', desc: 'Mostre afeto na cidade (Beijar, Abraçar)', min: 5, max: 15 }
    ],
    banco: [
        { id: 'deposito', desc: 'Faça depósitos de dinheiro no Banco Central', min: 2, max: 8 },
        { id: 'pix', desc: 'Faça transferências Pix para outros moradores', min: 1, max: 5 }
    ]
};

function gerarContratosDiarios() {
    const keys = Object.keys(TAREFAS);
    // Embaralha as categorias para pegar 3 tipos diferentes (Ex: 1 de Cassino, 1 de Crime, 1 Social)
    const categoriasSorteadas = keys.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    const contratos = [];

    for (const cat of categoriasSorteadas) {
        // Sorteia uma das missões dentro daquela categoria
        const taskObj = TAREFAS[cat][Math.floor(Math.random() * TAREFAS[cat].length)];
        
        // Sorteia a quantidade (Target) que o jogador tem de fazer
        const meta = Math.floor(Math.random() * (taskObj.max - taskObj.min + 1)) + taskObj.min;
        
        // Calcula uma recompensa baseada na dificuldade (Meta alta = + Dinheiro)
        const recompensaFixa = meta * (Math.floor(Math.random() * 5000) + 2000); 

        contratos.push({
            id: taskObj.id,
            desc: taskObj.desc,
            target: meta,
            progress: 0,
            reward: recompensaFixa,
            completed: false
        });
    }

    return contratos; // Retorna um array com as 3 missões geradas
}

module.exports = { gerarContratosDiarios };