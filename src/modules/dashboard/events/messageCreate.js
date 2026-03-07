const { AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateProfileImage } = require('../../../utils/canvasProfile');
const { generateBlackjackTable } = require('../../../utils/canvasBlackjack');
const { generateRoletaImage } = require('../../../utils/canvasRoletaRussa');
const { generateCrashImage } = require('../../../utils/canvasCrash');
const { addTransaction } = require('../../../utils/extratoManager');

// Mapa global para guardar as mesas ativas por canal da Roleta Russa
const ActiveTables = new Map();


// ==========================================
// 🧠 MOTOR DE LEITURA DE APOSTAS HYPE
// ==========================================
function lerAposta(input, saldoCarteira) {
    if (!input) return 0;
    let str = input.toString().toLowerCase().trim();
    
    // Se ele quiser apostar tudo
    if (str === 'all' || str === 'tudo') return saldoCarteira;

    // Se o cara digitar "1,5k", trocamos a vírgula por ponto para o sistema entender
    str = str.replace(',', '.');

    let multiplicador = 1;
    // Identifica o sufixo e define o peso
    if (str.includes('kkk') || str.includes('b')) multiplicador = 1000000000; // Bilhões
    else if (str.includes('kk') || str.includes('m')) multiplicador = 1000000; // Milhões
    else if (str.includes('k')) multiplicador = 1000; // Milhares

    // Tira todas as letras, deixando só o número limpo
    let numeroLimpo = str.replace(/[a-z]/g, '');

    // Converte pra número decimal, multiplica e arredonda
    let valorFinal = Math.floor(parseFloat(numeroLimpo) * multiplicador);
    
    return isNaN(valorFinal) ? 0 : valorFinal;
}

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        // Ignora bots e mensagens sem o prefixo H (h ou H)
        if (message.author.bot || !message.content.toLowerCase().startsWith('h')) return;
        if (!client.activeRoleta) client.activeRoleta = ActiveTables;

        // Separa o comando dos argumentos
        const args = message.content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // 👇 MOTOR DO SINDICATO: Função Invisível que rastreia o progresso no fundo 👇
        const trackContract = async (userId, actionId, amount = 1) => {
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
                                // Paga a recompensa da missão silenciosamente na carteira
                                await prisma.hypeUser.update({ where: { id: userId }, data: { carteira: { increment: c.reward } } });
                                await addTransaction(userId, 'IN', c.reward, `Recompensa Sindicato: Contrato ${actionId}`);
                            }
                            atualizou = true;
                        }
                    }
                    if (atualizou) {
                        await prisma.hypeUser.update({ where: { id: userId }, data: { contratosData: contratos } });
                    }
                }
            } catch (e) {} // Falhas no tracker não afetam o jogo
        };
// ==========================================
        // ⏱️ SISTEMA DE ANTI-SPAM (GLOBAL COOLDOWN 5s)
        // ==========================================
        if (!client.globalCooldowns) client.globalCooldowns = new Map();
        
        const cooldownTime = 5000; // 5 segundos em milissegundos
        const userId = message.author.id;

        if (client.globalCooldowns.has(userId)) {
            const lastCmdTime = client.globalCooldowns.get(userId);
            const timeDiff = Date.now() - lastCmdTime;

            if (timeDiff < cooldownTime) {
                // Ele usou rápido demais. Vamos ver se é VIP 2 para perdoar o spam.
                const userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
                const vipLevel = userProfile?.vipLevel || 0;

                if (vipLevel < 2) {
                    const timeLeft = ((cooldownTime - timeDiff) / 1000).toFixed(1);
                    return message.reply(`⏳╺╸**Calma aí, apressado!** Aguarda mais **${timeLeft}s** para usares outro comando.\n*(💎 VIPs Prime ou superior não têm este delay!)*`).then(msg => {
                        // Apaga a mensagem de aviso após 3 segundos para não sujar o chat
                        setTimeout(() => msg.delete().catch(()=>{}), 3000);
                    });
                }
            }
        }

        // Se passou (esperou 5s ou é VIP 2+), atualiza o tempo do último uso na memória
        client.globalCooldowns.set(userId, Date.now());
        // ==========================================
        // ==========================================
        // 🧾 COMANDO: hextrato / historico (Extrato Bancário)
        // ==========================================
        if (command === 'extrato' || command === 'historico') {
            const { generateExtratoImage } = require('../../../utils/canvasExtrato');
            const { getTransactions } = require('../../../utils/extratoManager');
            
            const targetUser = message.mentions.users.first() || message.author;
            // Se for ver o extrato de outro, só admin pode
            if (targetUser.id !== message.author.id && !message.member.permissions.has('Administrator')) {
                return message.reply('❌╺╸O Sigilo Bancário não permite que veja o extrato de terceiros!');
            }

            const loadingMsg = await message.reply('🔍╺╸**A solicitar a ficha bancária...**');
            
            try {
                const { data, totalPages } = await getTransactions(targetUser.id, 1, 6);
                const buffer = await generateExtratoImage(targetUser, data, 1, totalPages);
                const attachment = new AttachmentBuilder(buffer, { name: 'extrato.png' });

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`extrato_prev_${targetUser.id}_1`).setLabel('Página Anterior').setStyle(ButtonStyle.Primary).setEmoji('⬅️').setDisabled(true),
                    new ButtonBuilder().setCustomId(`extrato_next_${targetUser.id}_1`).setLabel('Próxima Página').setStyle(ButtonStyle.Primary).setEmoji('➡️').setDisabled(totalPages <= 1)
                );

                await loadingMsg.edit({ content: '', files: [attachment], components: totalPages > 1 ? [row] : [] });
            } catch (e) {
                console.log(e);
                await loadingMsg.edit('❌ Falha ao imprimir o extrato.');
            }
            return;
        }

        // ==========================================
        // 🎰 GAME: Tigrinho (htigrinho)
        // ==========================================
        if (command === 'tigrinho' || command === 'tiger') {
            const betInput = args[0];

            if (!betInput) return message.reply('❌╺╸**Uso correto:** `htigrinho <valor>` ou `htigrinho all`.');

            const userId = message.author.id;
            let userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            if (!userProfile) return message.reply('❌╺╸**Ainda não tens um perfil registado.**');

            let aposta = lerAposta(betInput, userProfile.carteira);
            if (isNaN(aposta) || aposta <= 0) return message.reply('❌ **Valor de aposta inválido.**');
            
            // 👇 LIMITADOR DE APOSTAS: MÁXIMO 10 MILHÕES (10M)
            if (aposta > 10000000) aposta = 10000000;

            if (userProfile.carteira < aposta) return message.reply(`❌ Não tens **R$ ${aposta.toLocaleString('pt-BR')}** na carteira!`);

            if (userProfile.lastGame && (Date.now() - new Date(userProfile.lastGame).getTime() < 5000)) {
                return message.reply('⏳╺╸ **A máquina está a ser reiniciada! Aguarda 5 segundos.**');
            }

            // Desconta o dinheiro da CARTEIRA
            await prisma.hypeUser.update({
                where: { id: userId },
                data: { carteira: { decrement: aposta }, lastGame: new Date() }
            });

            // RASTREADOR: Jogou Tigrinho
            await trackContract(userId, 'play_tiger', 1);

            // Dá uma indicação rápida e APAGA-A de seguida
            const loadingMsg = await message.reply('🎰╺╸**A montar a máquina do Tigrinho...**');

            try {
                await loadingMsg.delete().catch(() => {});
                const cassinoEngine = require('../../economy/components/cassino_tigrinho_engine');
                await cassinoEngine.run(message.channel, message.author, client, aposta, false, null);
            } catch (error) {
                console.error('Erro no Tigrinho Prefix:', error);
                message.channel.send('❌╺╸**Ocorreu um erro na máquina.**').catch(() => {});
            }
        }
        
        // ==========================================
        // 💣 GAME: Mines (hmines)
        // ==========================================
        if (command === 'mines') {
            const betInput = args[0];
            if (!betInput) return message.reply('❌╺╸**Uso correto:** `hmines <valor>` ou `hmines all`.');

            const userId = message.author.id;
            let userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            if (!userProfile) return message.reply('❌╺╸**Ainda não tens um perfil registado.**');

            let betAmount = lerAposta(betInput, userProfile.carteira);
            if (isNaN(betAmount) || betAmount <= 0) return message.reply('❌╺╸**Valor de aposta inválido.**');
            
            // 👇 LIMITADOR DE APOSTAS: MÁXIMO 10 MILHÕES (10M)
            if (betAmount > 10000000) betAmount = 10000000;
            if (userProfile.carteira < betAmount) return message.reply(`❌╺╸Não tens **R$ ${betAmount.toLocaleString('pt-BR')}** na carteira!`);

            if (userProfile.lastGame && (Date.now() - new Date(userProfile.lastGame).getTime() < 5000)) {
                return message.reply('⏳╺╸**Estão a plantar as bombas! Aguarda 5 segundos.**');
            }

            await prisma.hypeUser.update({
                where: { id: userId },
                data: { carteira: { decrement: betAmount }, lastGame: new Date() }
            });

            await trackContract(userId, 'play_mines', 1);

            // Grid de 20 espaços (4x5) conforme o seu padrão
            const totalTiles = 20;
            const bombCount = 3;
            let grid = Array(totalTiles).fill('gem');
            for (let i = 0; i < bombCount; i++) { grid[i] = 'bomb'; }
            for (let i = grid.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [grid[i], grid[j]] = [grid[j], grid[i]];
            }

            if (!client.activeMines) client.activeMines = new Map();
            // Adicionamos 'scanned: []' para guardar o que a lanterna achar
            client.activeMines.set(userId, { bet: betAmount, bombs: bombCount, grid: grid, clicked: [], hits: 0, scanned: [] });

            const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');

            const header = new TextDisplayBuilder().setContent(`# 💣 MINES HYPE\nO campo minado de <@${userId}> começou!`);
            const stats = new TextDisplayBuilder().setContent(`**Aposta:** R$ ${betAmount.toLocaleString('pt-BR')}\n**Multiplicador:** 1.00x\n**Lucro Atual:** R$ 0`);

            const container = new ContainerBuilder()
                .setAccentColor(0x2b2d31)
                .addTextDisplayComponents(header)
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(stats);

            const rows = [];
            for (let r = 0; r < 4; r++) {
                const row = new ActionRowBuilder();
                for (let c = 0; c < 5; c++) {
                    const index = r * 5 + c;
                    row.addComponents(
                        new ButtonBuilder().setCustomId(`eco_mines_click_${index}_${userId}`).setStyle(ButtonStyle.Secondary).setEmoji('🔲')
                    );
                }
                rows.push(row);
            }

            // BOTÕES DE CONTROLE
            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`eco_mines_cashout_${userId}`)
                    .setLabel('💰 Retirar Lucro (R$ 0)')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId(`eco_mines_lanterna_${userId}`)
                    .setLabel('REVELAR')
                    .setEmoji('🔦')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(userProfile.invLanternas <= 0) // Só habilita se ele tiver o item
            );
            rows.push(actionRow);

            return message.reply({ components: [container, ...rows], flags: [MessageFlags.IsComponentsV2] });
        }

        // ==========================================
        // 🔫 GAME: Roleta Russa (hroleta)
        // ==========================================
        if (command === 'roleta' || command === 'roletarussa') {
            const betInput = args[0];
            const canalId = message.channel.id;

            if (!betInput) return message.reply('❌╺╸**Uso correto:** `hroleta <valor_entrada>` (Ex: `hroleta 5k`)');

            if (client.activeRoleta.has(canalId)) {
                return message.reply('❌╺╸Já existe uma mesa de Roleta Russa aberta neste canal! Esperem o jogo acabar.');
            }

            const dono = message.author;
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: dono.id } });
            
            let valorAposta = lerAposta(betInput, userProfile?.carteira || 0);
            if (isNaN(valorAposta) || valorAposta < 100) return message.reply('❌ A aposta mínima para abrir a mesa é de **R$ 100**.');

            // 👇 LIMITADOR DE APOSTAS: MÁXIMO 10 MILHÕES (10M)
            if (valorAposta > 10000000) valorAposta = 10000000;

            if (!userProfile || userProfile.carteira < valorAposta) {
                return message.reply(`❌╺╸Você não tem **R$ ${valorAposta.toLocaleString('pt-BR')}** na carteira para garantires a tua cadeira.`);
            }

            await prisma.hypeUser.update({
                where: { id: dono.id },
                data: { carteira: { decrement: valorAposta } }
            });

            const donoData = {
                id: dono.id,
                username: dono.username,
                avatarBuffer: dono.displayAvatarURL({ extension: 'png', size: 128 }),
                isDead: false
            };

            const mesa = {
                donoId: dono.id,
                valorAposta: valorAposta,
                pot: valorAposta, 
                players: [donoData], 
                estado: 'lobby'
            };
            client.activeRoleta.set(canalId, mesa);

            const loadingMsg = await message.reply('🔫╺╸**A montar a mesa do submundo...**');
            await trackContract(dono.id, 'play_roleta', 1);
            try {
                const imgBuffer = await generateRoletaImage('lobby', mesa.players, -1, mesa.pot);
                const attachment = new AttachmentBuilder(imgBuffer, { name: 'roleta.png' });

                const embed = new EmbedBuilder()
                    .setColor('#2a0404')
                    .setTitle('🔫 MESA DA MÁFIA ABERTA')
                    .setDescription(`**Aposta por Cadeira:** R$ ${valorAposta.toLocaleString('pt-BR')}\n\nQualquer pessoa com dinheiro na carteira pode entrar! Quando a mesa tiver entre 2 e 6 jogadores, o dono da mesa pode mandar girar o tambor.`)
                    .setImage('attachment://roleta.png');

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('eco_roleta_join').setLabel('Sentar e Pagar').setStyle(ButtonStyle.Success).setEmoji('💰'),
                    new ButtonBuilder().setCustomId('eco_roleta_start').setLabel('Girar Tambor (Dono)').setStyle(ButtonStyle.Danger).setEmoji('🔫')
                );

                await loadingMsg.edit({ content: '', embeds: [embed], files: [attachment], components: [row] });

            } catch (error) {
                console.error('❌╺╸Erro a gerar Lobby da Roleta:', error);
                client.activeRoleta.delete(canalId); 
                
                await prisma.hypeUser.update({
                    where: { id: dono.id },
                    data: { carteira: { increment: valorAposta } }
                });

                await loadingMsg.edit('❌╺╸Erro a montar a mesa. O seu dinheiro foi devolvido.');
            }
        }

        // ==========================================
        // 🎭 MÓDULO SOCIAL (Cooldown 20m por Comando)
        // ==========================================
        const gifs = {
            beijar: [
                'https://media.giphy.com/media/11rWoZNpAKw8w/giphy.gif',
                'https://media.giphy.com/media/MQVpBqASxSlFu/giphy.gif',
                'https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif',
                'https://media.giphy.com/media/zkppEMFvRX5FC/giphy.gif'
            ],
            tapa: [
                'https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif',
                'https://media.giphy.com/media/vxvNnIYFcYqEE/giphy.gif',
                'https://media.giphy.com/media/Zau0yrl17uzdK/giphy.gif',
                'https://media.giphy.com/media/RXGNsyRb1hDJm/giphy.gif'
            ],
            abracar: [
                'https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif',
                'https://media.giphy.com/media/m2GGGWxexjwqnHQnZI/giphy.gif',
                'https://media.giphy.com/media/GMFUrC8E8aWoo/giphy.gif'
            ],
            morder: [
                'https://media.giphy.com/media/OqQOwXiCyJAmA/giphy.gif',
                'https://media.giphy.com/media/lrMUMn9lnpaJDsvP0u/giphy.gif',
                'https://media.giphy.com/media/APdrBsVpWQmv6/giphy.gif'
            ],
            chutar: [
                'https://media.giphy.com/media/u2LJ0n4lx6jF6/giphy.gif',
                'https://media.giphy.com/media/3IRa7BlrVTK1BBFWtx/giphy.gif'
            ],
            dancar: [
                'https://media.giphy.com/media/j93ycvEyWlSIIg8AEl/giphy.gif',
                'https://media.giphy.com/media/Ut0KxC3gnIwcEpmTZW/giphy.gif',
                'https://media.giphy.com/media/NtxYZwjMr0HOYbbfeG/giphy.gif'
            ],
            brindar: [
                'https://media.giphy.com/media/3o8doUgvKWu2JP0hvG/giphy.gif',
                'https://media.giphy.com/media/wy63WPXSamvFC/giphy.gif',
                'https://media.giphy.com/media/YZjHGZdwdBMfS/giphy.gif'
            ],
            pat: [
                'https://media.giphy.com/media/5tmRHwTlHAA9WkVxTU/giphy.gif',
                'https://media.giphy.com/media/u9BxQbM5bxvwY/giphy.gif',
                'https://media.giphy.com/media/L2z7dnOduqEow/giphy.gif'
            ],
            socar: [
                'https://media.giphy.com/media/yo3TC0yeHd53G/giphy.gif',
                'https://media.giphy.com/media/11HeubLHnQJSAU/giphy.gif',
                'https://media.giphy.com/media/arbHBoiUWUgmc/giphy.gif'
            ],
            cafune: [
                'https://media.giphy.com/media/C93VmkaYCdRUGie1uG/giphy.gif',
                'https://media.giphy.com/media/NB0MtUxFyMmRi/giphy.gif'
            ]
        };

        const socialCommands = {
            'beijar': { verb: '**deu um beijo apaixonado em**', type: 'beijar', emoji: '💋' },
            'bj': { verb: '**deu um beijo apaixonado em**', type: 'beijar', emoji: '💋' },
            'tapa': { verb: '**deu um tapa bem dado na cara de**', type: 'tapa', emoji: '🖐️' },
            'abracar': { verb: '**deu um abraço bem apertado em**', type: 'abracar', emoji: '🫂' },
            'abç': { verb: '**deu um abraço bem apertado em**', type: 'abracar', emoji: '🫂' },
            'abraçar': { verb: '**deu um abraço bem apertado em**', type: 'abracar', emoji: '🫂' },
            'morder': { verb: '**deu uma mordida em**', type: 'morder', emoji: '🧛' },
            'pat': { verb: '**fez um carinho fofo na cabeça de**', type: 'pat', emoji: '🥰' },
            'socar': { verb: '**deu um soco com toda a força na cara de**', type: 'socar', emoji: '🥊' },
            'cafune': { verb: '**fez um cafuné gostoso em**', type: 'cafune', emoji: '💆' },
            'cafuné': { verb: '**fez um cafuné gostoso em**', type: 'cafune', emoji: '💆' },
            'caf': { verb: '**fez um cafuné gostoso em**', type: 'cafune', emoji: '💆' },
            'chutar': { verb: '**deu um chute bem dado na canela de**', type: 'chutar', emoji: '🥾' },
            'chute': { verb: '**deu um chute bem dado na canela de**', type: 'chutar', emoji: '🥾' },
            'dancar': { verb: '**puxou para dançar com muito estilo**', type: 'dancar', emoji: '💃' },
            'dançar': { verb: '**puxou para dançar com muito estilo**', type: 'dancar', emoji: '💃' },
            'brindar': { verb: '**brindou uma taça de champanhe com**', type: 'brindar', emoji: '🥂' }
        };

        if (socialCommands[command]) {
            const action = socialCommands[command];
            const authorId = message.author.id;
            const targetUser = message.mentions.users.first();

            if (!targetUser) return message.reply(`❌╺╸**Tem de mencionar alguém! Exemplo: \`h${command}** @usuario\``);
            if (targetUser.id === authorId) return message.reply(`❌╺╸**Não pode fazer isso a vc mesmo(a)! Tente em outra pessoa!**`);
            if (targetUser.bot) return message.reply(`😳╺╸**Eh lá... eu sou apenas um bot ! Mas agradeço a intenção.**`);

            let userProfile = await prisma.hypeUser.findUnique({ where: { id: authorId } });
            
            const columnString = 'last' + action.type.charAt(0).toUpperCase() + action.type.slice(1);
            const cooldownTime = 20 * 60 * 1000;
            if (userProfile && userProfile[columnString]) {
                const now = new Date().getTime();
                const lastTime = new Date(userProfile[columnString]).getTime();

                if (now - lastTime < cooldownTime) {
                    const timeLeft = Math.ceil((cooldownTime - (now - lastTime)) / 1000);
                    const minutes = Math.floor(timeLeft / 60);
                    const seconds = timeLeft % 60;
                    return message.reply(`⏳╺╸**Descansa a mão!** Já usou o \`h${command}\` há pouco tempo.\nPode usá-lo de novo em **${minutes}m e ${seconds}s**.`);
                }
            }

            const vipLevel = userProfile?.vipLevel || 0;
            let vipMultiplier = 1.0;
            if (vipLevel === 1) vipMultiplier = 1.5;
            else if (vipLevel === 2) vipMultiplier = 2.0;
            else if (vipLevel === 3) vipMultiplier = 3.0;
            else if (vipLevel >= 4) vipMultiplier = 5.0;

            const failChance = Math.max(0, 0.30 - (vipLevel * 0.10));
            const isSuccess = Math.random() > failChance; 

            const baseReward = Math.floor(Math.random() * (500 - 150 + 1)) + 150;
            const rewardAmount = isSuccess ? Math.floor(baseReward * vipMultiplier) : 0;

            const updateData = { carteira: { increment: rewardAmount } };
            updateData[columnString] = new Date(); 
            
            const createData = { id: authorId, carteira: rewardAmount };
            createData[columnString] = new Date();

            await prisma.hypeUser.upsert({
                where: { id: authorId },
                update: updateData,
                create: createData
            });

            if (['socar', 'chutar', 'tapa'].includes(action.type)) await trackContract(authorId, 'social_bater', 1);
            if (['beijar', 'abracar', 'cafune', 'pat'].includes(action.type)) await trackContract(authorId, 'social_amor', 1);

            if (!isSuccess) {
                return message.reply(`✨╺╸**QUASE!**\nEsquivou legal!\n*(O tempo de descanso foi ativado, tente novamente em breve!)*`);
            }

            // LANÇA NO EXTRATO
            await addTransaction(authorId, 'IN', rewardAmount, `Recompensa Social: ${action.type}`);

            const randomGif = gifs[action.type][Math.floor(Math.random() * gifs[action.type].length)];
            
            // AGORA MANDA O GIF COMO LINK DIRETO (MUITO MAIS LEVE, NÃO REBENTA A API DO DISCORD)
            let extraMsg = vipLevel > 0 ? `\n💎╺╸**Bónus VIP** Nível ${vipLevel}: \`x${vipMultiplier}\` Aplicado!` : '';

            return message.reply({ 
                content: `${action.emoji} ╺╸ <@${authorId}> **${action.verb}** <@${targetUser.id}>!\n\n💸╺╸**VOCÊ GANHOU:** R$ ${rewardAmount.toLocaleString('pt-BR')} (Caiu na tua Carteira!)${extraMsg}\n${randomGif}`
            });
        }

        // ==========================================
        // 📋 COMANDO: htempo / hcd (Painel Completo)
        // ==========================================
        if (command === 'tempo' || command === 'cd' || command === 'cooldowns') {
            const userId = message.author.id;
            let userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            
            if (!userProfile) {
                return message.reply('❌╺╸**Ainda não tens um perfil registado. Usa o `hcarteira` para começar a jogar!**');
            }

            const dailyCD = 24 * 60 * 60 * 1000;
            const semanalCD = 7 * 24 * 60 * 60 * 1000;
            const mensalCD = 30 * 24 * 60 * 60 * 1000;
            const socialCD = 20 * 60 * 1000;

            const makeLine = (name, lastDate, cooldownMs) => {
                if (!lastDate) return `• ✅ **${name}**: \`Disponível.\``;
                const lastTime = new Date(lastDate).getTime();
                if (Date.now() - lastTime >= cooldownMs) return `• ✅ **${name}**: \`Disponível.\``;
                const expireUnix = Math.floor((lastTime + cooldownMs) / 1000);
                return `• ⏰ **${name}**: <t:${expireUnix}:R>`; 
            };

            let desc = `Confira os **cooldown's** abaixo:\n\n`;
            
            desc += makeLine('Diário', userProfile.lastDaily, dailyCD) + '\n';
            desc += makeLine('Semanal', userProfile.lastSemanal, semanalCD) + '\n';
            desc += makeLine('Mensal', userProfile.lastMensal, mensalCD) + '\n\n';
            desc += makeLine('Roubar', userProfile.lastRob, 10 * 60 * 1000) + '\n';

            const embed = new EmbedBuilder()
                .setColor('#0000FF')
                .setAuthor({ name: `⏰ Cooldown's de ${message.author.username}` })
                .setDescription(desc)
                .setThumbnail('https://i.imgur.com/FYqoK6D.png')
                .setFooter({ text: 'O tempo nunca passou tão lento, concorda? ⏳', iconURL: message.author.displayAvatarURL({ dynamic: true }) });

            return message.reply({ embeds: [embed] });
        }

        if (command === 'loja' || command === 'mercado') {
            const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
            const { generateShopCatalog } = require('../../../utils/canvasLoja');
            
            const loadingMsg = await message.reply('🔍╺╸**Entrando na Deep Web...**');

            try {
                const imageBuffer = await generateShopCatalog();
                const attachment = new AttachmentBuilder(imageBuffer, { name: 'loja.png' });

                const select = new StringSelectMenuBuilder()
                    .setCustomId(`eco_shop_buy_${message.author.id}`)
                    .setPlaceholder('Escolha o item que deseja comprar...')
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Colete Balístico')
                            .setDescription('R$ 150.000 - Imunidade a roubos')
                            .setEmoji('🛡️')
                            .setValue('colete')
                    );

                const row = new ActionRowBuilder().addComponents(select);

                await loadingMsg.delete().catch(() => {});
                return message.channel.send({ 
                    content: `📦╺╸**Mercado Negro aberto para <@${message.author.id}>**`, 
                    files: [attachment], 
                    components: [row] 
                });

            } catch (error) {
                console.error(error);
                await loadingMsg.edit('❌╺╸**O fornecedor desapareceu nas sombras.**');
            }
        }

        // ==========================================
        // 🛠️ COMANDO ADMIN: havisoloja (Aviso da Loja VIP/Coins)
        // ==========================================
        if (command === 'avisoloja' || command === 'setupstore') {
            if (!message.member.permissions.has('Administrator')) {
                return message.reply('❌╺╸Apenas administradores da alta cúpula podem usar este comando.');
            }
            message.delete().catch(() => {});

            const embed = new EmbedBuilder()
                .setTitle('💎 CENTRAL DE VENDAS HYPE')
                .setDescription('> *O cofre do submundo está a ser abastecido...*\n\nEm breve, o nosso sistema de **Vendas Automáticas** estará 100% online.')
                .setColor('#facc15')
                .setImage('https://i.imgur.com/B94L2U9.gif');
            return message.channel.send({ embeds: [embed] });
        }

        // ==========================================
        // 🏎️ GAME: Corrida Clandestina (hcorrida)
        // ==========================================
        if (command === 'corrida' || command === 'race') {
            const betInput = args[0];
            const canalId = message.channel.id;

            if (!betInput) return message.reply('❌╺╸**Uso correto:** `hcorrida <valor_entrada>`');

            if (!client.activeRaces) client.activeRaces = new Map();
            if (client.activeRaces.has(canalId)) {
                return message.reply('❌╺╸Os carros já estão na pista neste canal!');
            }

            const dono = message.author;
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: dono.id } });
            
            let valorAposta = lerAposta(betInput, userProfile?.carteira || 0);
            if (isNaN(valorAposta) || valorAposta < 100) return message.reply('❌ A aposta mínima para o ingresso é de **R$ 100**.');

            if (valorAposta > 10000000) valorAposta = 10000000;

            if (!userProfile || userProfile.carteira < valorAposta) {
                return message.reply(`❌╺╸Você não tem **R$ ${valorAposta.toLocaleString('pt-BR')}** na carteira.`);
            }

            const raceData = {
                pot: 0,
                bets: { 'red': [], 'blue': [], 'green': [], 'yellow': [] },
                cars: [
                    { color: 'red', progress: 0, name: 'Vermelho' },
                    { color: 'blue', progress: 0, name: 'Azul' },
                    { color: 'green', progress: 0, name: 'Verde' },
                    { color: 'yellow', progress: 0, name: 'Amarelo' }
                ]
            };
            
            client.activeRaces.set(canalId, true);

            const { generateRaceImage } = require('../../../utils/canvasCorrida');
            let imgBuffer = await generateRaceImage('lobby', raceData.cars);
            let attachment = new AttachmentBuilder(imgBuffer, { name: 'corrida.png' });

            const rowLobby = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('race_bet_red').setLabel('Vermelho').setStyle(ButtonStyle.Danger).setEmoji('🔴'),
                new ButtonBuilder().setCustomId('race_bet_blue').setLabel('Azul').setStyle(ButtonStyle.Primary).setEmoji('🔵'),
                new ButtonBuilder().setCustomId('race_bet_green').setLabel('Verde').setStyle(ButtonStyle.Success).setEmoji('🟢'),
                new ButtonBuilder().setCustomId('race_bet_yellow').setLabel('Amarelo').setStyle(ButtonStyle.Secondary).setEmoji('🟡')
            );

            const formatLobbyText = (pot, corredores) => {
                return `# 🏎️ CORRIDA CLANDESTINA\nA garagem foi aberta por <@${dono.id}>!\n\n💰 **Ingresso:** R$ ${valorAposta.toLocaleString('pt-BR')}\n🔥 **Pote Acumulado:** R$ ${pot.toLocaleString('pt-BR')}\n👥 **Corredores:** ${corredores}\n\n⏳ *Escolha o seu carro abaixo! Os motores ligam em 30 segundos.*`;
            };

            const lobbyMsg = await message.reply({ 
                content: formatLobbyText(0, 0), 
                components: [rowLobby], 
                files: [attachment] 
            });

            const collector = lobbyMsg.createMessageComponentCollector({ time: 30000 });
            
            let allParticipants = [];
            let processingUsers = new Set(); 

            collector.on('collect', async i => {
                const colorBet = i.customId.replace('race_bet_', '');
                if (!['red', 'blue', 'green', 'yellow'].includes(colorBet)) return;

                if (allParticipants.includes(i.user.id) || processingUsers.has(i.user.id)) {
                    return i.reply({ content: '🏎️💨╺╸**Calma, piloto! Você já carimbou o seu ingresso!**', flags: [MessageFlags.Ephemeral] }).catch(()=>{});
                }

                processingUsers.add(i.user.id);
                await i.deferReply({ flags: [MessageFlags.Ephemeral] }).catch(()=>{}); 

                const pProfile = await prisma.hypeUser.findUnique({ where: { id: i.user.id } });
                if (!pProfile || pProfile.carteira < valorAposta) {
                    processingUsers.delete(i.user.id);
                    return i.editReply({ content: `❌ Você não tem **R$ ${valorAposta.toLocaleString('pt-BR')}** na carteira!` }).catch(()=>{});
                }

                await prisma.hypeUser.update({ where: { id: i.user.id }, data: { carteira: { decrement: valorAposta } } });
                raceData.bets[colorBet].push(i.user.id);
                allParticipants.push(i.user.id);
                raceData.pot += valorAposta;
                
                processingUsers.delete(i.user.id);

                await i.editReply({ content: `✅ **Transação Aprovada!** Você colocou **R$ ${valorAposta.toLocaleString('pt-BR')}** no carro **${colorBet.toUpperCase()}**.` }).catch(()=>{});
                await lobbyMsg.edit({ content: formatLobbyText(raceData.pot, allParticipants.length) }).catch(()=>{});
            });

            collector.on('end', async () => {
                if (allParticipants.length === 0) {
                    client.activeRaces.delete(canalId);
                    return lobbyMsg.edit({ content: '😔╺╸**A polícia chegou. A corrida foi cancelada por falta de pilotos.**', components: [], files: [], attachments: [] }).catch(()=>{});
                }

                let finished = false;
                let winner = null;
                let eventText = "🟢 LUZ VERDE! Os motores roncaram!";

                await lobbyMsg.edit({ components: [] }).catch(()=>{});

                while (!finished) {
                    await new Promise(r => setTimeout(r, 2500)); 

                    let highestProgress = 0;
                    
                    raceData.cars.forEach(car => {
                        let advance = Math.random() * 8; 
                        car.progress += advance;
                        if (car.progress >= 100) {
                            car.progress = 100;
                            finished = true;
                            if (!winner) winner = car; 
                        }
                        if (car.progress > highestProgress) highestProgress = car.progress;
                    });

                    imgBuffer = await generateRaceImage(finished ? 'finished' : 'racing', raceData.cars);
                    attachment = new AttachmentBuilder(imgBuffer, { name: 'corrida.png' });
                    
                    await lobbyMsg.edit({ content: `# 🏎️ CORRIDA CLANDESTINA\n💰 **Pote em Jogo:** R$ ${raceData.pot.toLocaleString('pt-BR')}`, files: [attachment], attachments: [] }).catch(()=>{});
                }

                const apostadoresGanhadores = raceData.bets[winner.color];
                let descFinal = `# 🏁 A BANDEIRA QUADRICULADA DESCEU!\n🏆 **CARRO VENCEDOR:** ${winner.name} (${winner.color.toUpperCase()})\n💰 **Pote Distribuído:** R$ ${raceData.pot.toLocaleString('pt-BR')}\n\n`;

                if (apostadoresGanhadores.length > 0) {
                    const premioPorCabeca = Math.floor(raceData.pot / apostadoresGanhadores.length);
                    descFinal += `**🎉 Magnatas Vencedores (Levaram R$ ${premioPorCabeca.toLocaleString('pt-BR')} cada):**\n`;
                    
                    for (const wp of apostadoresGanhadores) {
                        descFinal += `<@${wp}> `;
                        await prisma.hypeUser.update({ where: { id: wp }, data: { carteira: { increment: premioPorCabeca } } });
                        // LANÇA NO EXTRATO
                        await addTransaction(wp, 'IN', premioPorCabeca, `Lucro da Corrida Clandestina`);
                    }
                } else {
                    descFinal += `💀 **O Cassino Sorri!**\nNinguém acreditou no carro ${winner.name}. Todo o pote ficou com a Banca!`;
                }

                await lobbyMsg.edit({ content: descFinal }).catch(()=>{});
                client.activeRaces.delete(canalId);
            });
            return;
        }

        // ==========================================
        // 🏦 GAME: Assalto ao Banco (hassalto)
        // ==========================================
        if (command === 'assalto' || command === 'heist') {
            const betInput = args[0];
            const canalId = message.channel.id;

            if (!betInput) return message.reply('❌╺╸**Mete a marcha direito parça:** `hassalto <taxa_entrada>` (Ex: `hassalto 50k`)');

            if (!client.activeHeists) client.activeHeists = new Map();
            if (client.activeHeists.has(canalId)) return message.reply('❌╺╸Os bota tão patrulhando esse canal. Espera a poeira baixar.');

            const dono = message.author;
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: dono.id } });
            
            let valorAposta = lerAposta(betInput, userProfile?.carteira || 0);
            if (isNaN(valorAposta) || valorAposta < 500) return message.reply('❌ O caixinha pros esquipamento é no mínimo **R$ 500**.');
            if (valorAposta > 10000000) valorAposta = 10000000;

            if (!userProfile || userProfile.carteira < valorAposta) {
                return message.reply(`❌╺╸Tu tá liso, mano! Não tem **R$ ${valorAposta.toLocaleString('pt-BR')}** na carteira pra bancar a operação.`);
            }

            const getAvatarBuffer = async (user) => {
                try {
                    const url = user.displayAvatarURL({ extension: 'png', size: 128 });
                    const res = await require('axios').get(url, { responseType: 'arraybuffer' });
                    return Buffer.from(res.data);
                } catch(e) { return null; }
            };

            const donoAvatar = await getAvatarBuffer(dono);
            await prisma.hypeUser.update({ where: { id: dono.id }, data: { carteira: { decrement: valorAposta } } });

            const heistData = {
                liderId: dono.id,
                pot: valorAposta,
                players: [{ id: dono.id, name: dono.username, role: 'Cérebro', isDead: false, avatarBuffer: donoAvatar }]
            };
            
            client.activeHeists.set(canalId, true);

            const { generateHeistImage } = require('../../../utils/canvasAssalto');
            let imgBuffer = await generateHeistImage('lobby', heistData.players, heistData.pot);
            let attachment = new AttachmentBuilder(imgBuffer, { name: 'assalto.png' });

            const rowLobby = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('heist_join_atirador').setLabel('Atirador (Bala)').setStyle(ButtonStyle.Danger).setEmoji('🔫'),
                new ButtonBuilder().setCustomId('heist_join_hacker').setLabel('Hacker (Nerd)').setStyle(ButtonStyle.Primary).setEmoji('💻'),
                new ButtonBuilder().setCustomId('heist_join_piloto').setLabel('Piloto (Fuga)').setStyle(ButtonStyle.Secondary).setEmoji('🏎️'),
                new ButtonBuilder().setCustomId('heist_start').setLabel('METER MARCHA').setStyle(ButtonStyle.Success).setEmoji('▶️')
            );

            const formatLobbyMsg = () => {
                return `# 🏦 PLANEJAMENTO DA QUADRILHA\n<@${dono.id}> tá montando o bonde!\n\n💰 **Entrada:** R$ ${valorAposta.toLocaleString('pt-BR')}\n🔥 **Malote Atual:** R$ ${heistData.pot.toLocaleString('pt-BR')}\n👥 **Bonde [${heistData.players.length}/4]**\n\n*(Paga e entra no carro! Só o Líder arranca).*`;
            };

            const lobbyMsg = await message.reply({ content: formatLobbyMsg(), components: [rowLobby], files: [attachment] });

            const collector = lobbyMsg.createMessageComponentCollector({ time: 60000 });
            let isStarted = false;
            let processingUsers = new Set();

            collector.on('collect', async i => {
                const action = i.customId;

                if (action === 'heist_start') {
                    if (i.user.id !== dono.id) return i.reply({ content: '❌ Sai fora zé ruela, só o Chefe pode dar o sinal verde!', flags: [MessageFlags.Ephemeral] }).catch(()=>{});
                    if (heistData.players.length < 2) return i.reply({ content: '❌ Tá querendo ir sozinho? Arruma pelo menos +1 parceiro!', flags: [MessageFlags.Ephemeral] }).catch(()=>{});
                    
                    isStarted = true;
                    collector.stop('started');
                    return i.deferUpdate().catch(()=>{});
                }

                if (action.startsWith('heist_join_')) {
                    if (heistData.players.find(p => p.id === i.user.id) || processingUsers.has(i.user.id)) {
                        return i.reply({ content: '❌ Já tá no esquema, sossega o facho!', flags: [MessageFlags.Ephemeral] }).catch(()=>{});
                    }
                    if (heistData.players.length >= 4) {
                        return i.reply({ content: '❌ A van lotou pai! Fica pra próxima.', flags: [MessageFlags.Ephemeral] }).catch(()=>{});
                    }

                    processingUsers.add(i.user.id);
                    await i.deferReply({ flags: [MessageFlags.Ephemeral] }).catch(()=>{});

                    const pProfile = await prisma.hypeUser.findUnique({ where: { id: i.user.id } });
                    if (!pProfile || pProfile.carteira < valorAposta) {
                        processingUsers.delete(i.user.id);
                        return i.editReply({ content: `❌ Tu tá quebrado truta! Não tem **R$ ${valorAposta.toLocaleString('pt-BR')}** na mão!` }).catch(()=>{});
                    }

                    const roleSelected = action.split('_')[2]; 
                    const roleName = roleSelected.charAt(0).toUpperCase() + roleSelected.slice(1);

                    if (heistData.players.some(p => p.role === roleName)) {
                        processingUsers.delete(i.user.id);
                        return i.editReply({ content: `❌ O bonde já tem um ${roleName}! Pega outra função ae.` }).catch(()=>{});
                    }

                    await prisma.hypeUser.update({ where: { id: i.user.id }, data: { carteira: { decrement: valorAposta } } });
                    const pAvatar = await getAvatarBuffer(i.user);
                    heistData.players.push({ id: i.user.id, name: i.user.username, role: roleName, isDead: false, avatarBuffer: pAvatar });
                    heistData.pot += valorAposta;

                    imgBuffer = await generateHeistImage('lobby', heistData.players, heistData.pot);
                    attachment = new AttachmentBuilder(imgBuffer, { name: 'assalto.png' });

                    await lobbyMsg.edit({ content: formatLobbyMsg(), files: [attachment], attachments: [] }).catch(()=>{});
                    await i.editReply({ content: `✅ Entrou pro crime como **${roleName}**! Prepara a peça.` }).catch(()=>{});
                    processingUsers.delete(i.user.id);
                }
            });

            collector.on('end', async (collected, reason) => {
                if (reason !== 'started') {
                    for (const p of heistData.players) { await prisma.hypeUser.update({ where: { id: p.id }, data: { carteira: { increment: valorAposta } } }); }
                    client.activeHeists.delete(canalId);
                    return lobbyMsg.edit({ content: '🕒╺╸**Os bota passaram. Abortar missão!** O bonde desandou, dinheiro foi devolvido.', components: [], files: [], attachments: [] }).catch(()=>{});
                }

                heistData.players.forEach(p => trackContract(p.id, 'join_heist', 1));

                const sleep = ms => new Promise(r => setTimeout(r, ms));
                
                const getDecider = (turnIndex) => {
                    const vivos = heistData.players.filter(p => !p.isDead);
                    if (vivos.length === 0) return null;
                    return vivos[turnIndex % vivos.length];
                };

                const executePhase = async (phaseId, title, desc, turnIndex, optionsMap) => {
                    const decider = getDecider(turnIndex);
                    if (!decider) return false;

                    const row = new ActionRowBuilder();
                    for (const [id, opt] of Object.entries(optionsMap)) {
                        row.addComponents(new ButtonBuilder().setCustomId(id).setLabel(opt.label).setStyle(opt.style));
                    }

                    imgBuffer = await generateHeistImage(phaseId, heistData.players, heistData.pot);
                    attachment = new AttachmentBuilder(imgBuffer, { name: 'assalto.png' });

                    const fullText = `# ${title}\n${desc}\n\n🗣️ **A Responsabilidade é Tua:** Acorda <@${decider.id}> (${decider.role})! O bagulho tá tenso, decide a fita em 45s.`;
                    await lobbyMsg.edit({ content: fullText, components: [row], files: [attachment], attachments: [] }).catch(()=>{});

                    let chosenId = null;
                    try {
                        const filter = async (x) => {
                            if (!['opt1', 'opt2', 'opt3'].includes(x.customId)) return false;
                            if (x.user.id !== decider.id) return false; 
                            return true;
                        };

                        const i = await lobbyMsg.awaitMessageComponent({ filter, time: 45000 });
                        chosenId = i.customId;
                        await i.deferUpdate().catch(()=>{});
                    } catch(e) { 
                        const keys = Object.keys(optionsMap);
                        chosenId = keys[Math.floor(Math.random() * keys.length)]; 
                        await lobbyMsg.channel.send(`⚠️ <@${decider.id}> gelou na base! O bonde agiu no instinto de sobrevivência!`).catch(()=>{});
                    }

                    const choice = optionsMap[chosenId];
                    await lobbyMsg.edit({ components: [] }).catch(()=>{});

                    let actionImg1 = await generateHeistImage(choice.actionId, [], 0, 1);
                    await lobbyMsg.edit({ content: `⏳ *${decider.name} tá engatilhando a jogada...*`, files: [new AttachmentBuilder(actionImg1, {name:'action1.png'})], attachments: [] }).catch(()=>{});
                    await sleep(3500);

                    let actionImg2 = await generateHeistImage(choice.actionId, [], 0, 2);
                    await lobbyMsg.edit({ content: `🎬 *${choice.actionText}*`, files: [new AttachmentBuilder(actionImg2, {name:'action2.png'})], attachments: [] }).catch(()=>{});
                    await sleep(4000);

                    let roll = Math.floor(Math.random() * 100);
                    let oIdx = roll <= 15 ? 0 : roll <= 50 ? 1 : roll <= 70 ? 2 : roll <= 85 ? 3 : 4; 

                    const outcome = choice.outcomes[oIdx];
                    let outcomeText = outcome.text;

                    if (outcome.type === 'multiplier') {
                        heistData.pot = Math.floor(heistData.pot * outcome.value);
                    } else if (outcome.type === 'moneyLoss') {
                        const lost = Math.floor(heistData.pot * outcome.value);
                        heistData.pot = Math.max(0, heistData.pot - lost);
                        outcomeText = outcomeText.replace('{v}', `**R$ ${lost.toLocaleString('pt-BR')}**`);
                    } else if (outcome.type === 'death') {
                        const vivos = heistData.players.filter(p => !p.isDead);
                        const morto = vivos[Math.floor(Math.random() * vivos.length)];
                        if (morto) {
                            morto.isDead = true;
                            outcomeText = outcomeText.replace('{m}', `**${morto.name}**`);
                        }
                    }

                    await lobbyMsg.edit({ content: `# 🎬 CONFRONTO DIRETO:\n${outcomeText}` }).catch(()=>{});
                    await sleep(4500);

                    return !heistData.players.every(p => p.isDead);
                };

                const scenarioPool = {
                    fase1: [
                        { id: 'entrance', title: '🏦 F1: PORTA DA FRENTE', desc: 'Tá cheio de câmera e dois guarda...', options: {
                            'opt1': { label: 'Tiroteio de Cria', style: ButtonStyle.Danger, actionId: 'action_shoot', actionText: '🔫 Papoco comendo solto...', baseChance: 35, bonusRoles: ['Atirador'], outcomes: [
                                { text: "🤑 Achou o malote do carro forte na portaria!", type: "multiplier", value: 1.3 },
                                { text: "✅ Trocamo tiro, os bota recuou e entramo limpo.", type: "success" },
                                { text: "⚠️ Rasgou a bolsa do mano no tiroteio. Deixamo {v} nas escadas!", type: "moneyLoss", value: 0.15 },
                                { text: "❌ Deu merda! Um cana tava mocado e soltou o aço em {m}!", type: "death" },
                                { text: "❌ A ROTA brotou do bueiro atirando. F {m}.", type: "death" }
                            ]},
                            'opt2': { label: 'Hackear Câmeras', style: ButtonStyle.Primary, actionId: 'action_hack', actionText: '💻 Subindo bypass na rede...', baseChance: 35, bonusRoles: ['Hacker'], outcomes: [
                                { text: "🤑 Hacker dominou tudo! Apagou as câmera e transferiu um bônus!", type: "multiplier", value: 1.2 },
                                { text: "✅ Entramo igual fantasma. Sistema cego.", type: "success" },
                                { text: "⚠️ O alarme gritou. Queimamo {v} subornando o vigia.", type: "moneyLoss", value: 0.1 },
                                { text: "❌ A trava guilhotina cortou a perna de {m}! Preso.", type: "death" },
                                { text: "❌ Curto de alta tensão no painel! Fritou {m}.", type: "death" }
                            ]},
                            'opt3': { label: 'Disfarce de Rico', style: ButtonStyle.Secondary, actionId: 'action_disguise', actionText: '👔 Vestindo os terno...', baseChance: 40, bonusRoles: ['Cérebro'], outcomes: [
                                { text: "🤑 O gerente ofereceu champanhe e um extra!", type: "multiplier", value: 1.4 },
                                { text: "✅ Passamo parecendo milionário, ninguém viu.", type: "success" },
                                { text: "⚠️ Um guarda cresceu o olho. Pagamos {v}.", type: "moneyLoss", value: 0.2 },
                                { text: "❌ A arma caiu no chão! O guarda atirou no {m}!", type: "death" },
                                { text: "❌ A conta era falsa e fomos pegos. {m} rodou.", type: "death" }
                            ]}
                        }}
                    ]
                };

                let alive = true;
                const s1 = scenarioPool.fase1[0];

                if (alive) alive = await executePhase(s1.id, s1.title, s1.desc, 0, s1.options);

                const totalInvestido = valorAposta * heistData.players.length;

                if (!alive) {
                    imgBuffer = await generateHeistImage('final_jail', heistData.players, heistData.pot);
                    attachment = new AttachmentBuilder(imgBuffer, { name: 'assalto.png' });
                    await lobbyMsg.edit({ content: "🚨 TODO MUNDO PRESO! FIM DA LINHA.", files: [attachment], attachments: [] }).catch(()=>{});
                } else {
                    const vivos = heistData.players.filter(p => !p.isDead);
                    const mortos = heistData.players.filter(p => p.isDead);
                    const fatia = Math.floor(heistData.pot / vivos.length);

                    for (const v of vivos) {
                        await prisma.hypeUser.update({ where: { id: v.id }, data: { carteira: { increment: fatia } } });
                        // LANÇA NO EXTRATO
                        await addTransaction(v.id, 'IN', fatia, `Lucro da Cota do Assalto ao Banco`);
                    }

                    const resultType = heistData.pot > totalInvestido ? 'profit' : 'loss';
                    
                    imgBuffer = await generateHeistImage(`final_${resultType}`, heistData.players, heistData.pot);
                    attachment = new AttachmentBuilder(imgBuffer, { name: 'assalto.png' });
                    
                    await lobbyMsg.edit({ content: "🏦 ROUBO FINALIZADO!", files: [attachment], attachments: [] }).catch(()=>{});
                }

                client.activeHeists.delete(canalId);
            });
            return;
        }

        // ==========================================
        // 🎲 COMANDO: hap / hapostar / hbet / hcoinflip
        // ==========================================
        if (command === 'ap' || command === 'apostar' || command === 'coinflip' || command === 'bet') {
            const betValueStr = args.find(a => !a.startsWith('<@'))?.toLowerCase();
            
            let targetUser = message.mentions.users.first();

            if (!targetUser && message.reference) {
                try {
                    const repliedMsg = await message.channel.messages.fetch(message.reference.messageId);
                    if (repliedMsg) targetUser = repliedMsg.author;
                } catch (e) {}
            }

            if (!betValueStr) {
                return message.reply('❌╺╸**Como usar:**\n1️⃣ `hap <valor>` - Cria uma aposta global no chat.\n2️⃣ `hap <valor> @usuario` - Desafia para 1v1.');
            }

            const userProfile = await prisma.hypeUser.findUnique({ where: { id: message.author.id } });
            if (!userProfile || userProfile.carteira <= 0) return message.reply('❌╺╸**Você não tem dinheiro na carteira para apostar!**');

            let amount = lerAposta(betValueStr, userProfile.carteira);

            if (isNaN(amount) || amount <= 0) return message.reply('❌╺╸**Valor de aposta inválido!**');
            if (amount > 10000000) amount = 10000000;
            
            if (amount > userProfile.carteira) return message.reply(`❌╺╸Você só tem **R$ ${userProfile.carteira.toLocaleString('pt-BR')}** na mão!`);

            // ==========================================
            // ⚔️ MODO 1: APOSTA 1v1
            // ==========================================
            if (targetUser) {
                if (targetUser.id === message.author.id) return message.reply('❌╺╸**Você não pode apostar contra si mesmo! Tá maluco?**');
                if (targetUser.bot) return message.reply('🤖╺╸**Eu sou a banca, não um jogador. Tente outro.**');

                const targetProfile = await prisma.hypeUser.findUnique({ where: { id: targetUser.id } });
                if (!targetProfile || targetProfile.carteira < amount) {
                    return message.reply(`❌╺╸O <@${targetUser.id}> está falido! Ele não tem **R$ ${amount.toLocaleString('pt-BR')}**.`);
                }

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('hap_accept').setLabel('Aceitar').setStyle(ButtonStyle.Success).setEmoji('✅'),
                    new ButtonBuilder().setCustomId('hap_deny').setLabel('Recusar').setStyle(ButtonStyle.Danger).setEmoji('✖️')
                );

                const msg = await message.reply({
                    content: `⚔️ **DESAFIO MORTAL!**\n<@${targetUser.id}>, o magnata <@${message.author.id}> te desafiou para um "Cara ou Coroa" apostando **R$ ${amount.toLocaleString('pt-BR')}** da carteira!\n\n⏳ Você tem **15 segundos** para aceitar ou correr.`,
                    components: [row]
                });

                const collector = msg.createMessageComponentCollector({ time: 15000 });

                collector.on('collect', async i => {
                    if (i.user.id !== targetUser.id) return i.reply({ content: '👀╺╸**Fica na tua!**', flags: [MessageFlags.Ephemeral] });

                    const [p1, p2] = await Promise.all([
                        prisma.hypeUser.findUnique({ where: { id: message.author.id } }),
                        prisma.hypeUser.findUnique({ where: { id: targetUser.id } })
                    ]);

                    if (p1.carteira < amount) return i.reply({ content: `❌╺╸<@${message.author.id}> gastou o dinheiro antes da aposta começar! Aposta anulada.`, flags: [MessageFlags.Ephemeral] });
                    if (p2.carteira < amount) return i.reply({ content: `❌╺╸Você não tem mais esse dinheiro na carteira!`, flags: [MessageFlags.Ephemeral] });

                    if (i.customId === 'hap_deny') {
                        collector.stop('denied');
                        return i.update({ content: `💨╺╸<@${targetUser.id}> amarelou e recusou a aposta de **R$ ${amount.toLocaleString('pt-BR')}**! A carteira dele está a salvo (mas o orgulho não).`, components: [] });
                    }

                    if (i.customId === 'hap_accept') {
                        collector.stop('accepted');
                        await i.update({ content: `🪙 **A MOEDA ESTÁ NO AR!**\nApostas travadas. Aguardem o resultado...`, components: [] });

                        await prisma.$transaction([
                            prisma.hypeUser.update({ where: { id: message.author.id }, data: { carteira: { decrement: amount } } }),
                            prisma.hypeUser.update({ where: { id: targetUser.id }, data: { carteira: { decrement: amount } } })
                        ]);

                        // Delay dramático de 3 segundos
                        await new Promise(r => setTimeout(r, 3000));

                        const pot = amount * 2;
                        const winnerId = Math.random() < 0.5 ? message.author.id : targetUser.id;
                        const loserId = winnerId === message.author.id ? targetUser.id : message.author.id;

                        await prisma.hypeUser.update({ where: { id: winnerId }, data: { carteira: { increment: pot } } });

                        // LANÇA NO EXTRATO DO GANHADOR
                        await addTransaction(winnerId, 'IN', pot, `Aposta PvP Vencida contra @${loserId === message.author.id ? message.author.username : targetUser.username}`);

                        const embed = new EmbedBuilder()
                            .setColor('#FEE75C')
                            .setTitle('🪙 RESULTADO: COINFLIP (CARA OU COROA)')
                            .setDescription(`A moeda girou no ar...\n\n🏆 **VENCEDOR:** <@${winnerId}>\n💸 **LEVOU:** R$ ${pot.toLocaleString('pt-BR')}\n\n💀 *<@${loserId}> perdeu R$ ${amount.toLocaleString('pt-BR')} nessa brincadeira.*`)
                            .setThumbnail('https://media.giphy.com/media/26n6WgBtzm9n5W1oY/giphy.gif');

                        await msg.edit({ content: '', embeds: [embed], components: [] });
                    }
                });

                collector.on('end', (collected, reason) => {
                    if (reason === 'time') {
                        msg.edit({ content: `⏳╺╸**O tempo esgotou! <@${targetUser.id}> não respondeu a tempo e o desafio expirou.**`, components: [] }).catch(()=>{});
                    }
                });

                return;
            }
            
            if (typeof interaction !== 'undefined' && interaction.customId) {
                const inlineIds = ['hap_', 'next_help', 'prev_help', 'page_indicator'];
                if (inlineIds.some(id => interaction.customId.startsWith(id))) return;
            }            
            
            // ==========================================
            // 🌐 MODO 2: LOBBY GLOBAL
            // ==========================================
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('hap_join').setLabel('Entrar na Aposta').setStyle(ButtonStyle.Primary).setEmoji('🎲')
            );

            let participants = [message.author.id];
            let totalPot = amount;

            await prisma.hypeUser.update({ where: { id: message.author.id }, data: { carteira: { decrement: amount } } });

            const embedLobby = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('🎲 MESA DE APOSTAS ABERTA!')
                .setDescription(`<@${message.author.id}> abriu um pote!\n\n💰 **Entrada:** R$ ${amount.toLocaleString('pt-BR')}\n🔥 **Prêmio Acumulado:** R$ ${totalPot.toLocaleString('pt-BR')}\n👥 **Jogadores:** ${participants.length}\n\n⏳ *A roleta roda em 30 segundos!*`)
                .setFooter({ text: 'Clique no botão abaixo para entrar e dobrar o prêmio!' });

            const msg = await message.reply({ embeds: [embedLobby], components: [row] });

            const collector = msg.createMessageComponentCollector({ time: 30000 });

            collector.on('collect', async i => {
                if (i.customId === 'hap_join') {
                    if (participants.includes(i.user.id)) {
                        return i.reply({ content: '❌╺╸**Você já colocou seu dinheiro nesta mesa!**', flags: [MessageFlags.Ephemeral] });
                    }

                    let pProfile = await prisma.hypeUser.findUnique({ where: { id: i.user.id } });
                    if (!pProfile || pProfile.carteira < amount) {
                        return i.reply({ content: `❌╺╸Você não tem **R$ ${amount.toLocaleString('pt-BR')}** na carteira!`, flags: [MessageFlags.Ephemeral] });
                    }

                    await prisma.hypeUser.update({ where: { id: i.user.id }, data: { carteira: { decrement: amount } } });
                    
                    participants.push(i.user.id);
                    totalPot += amount;

                    embedLobby.setDescription(`<@${message.author.id}> abriu um pote!\n\n💰 **Entrada:** R$ ${amount.toLocaleString('pt-BR')}\n🔥 **Prêmio Acumulado:** R$ ${totalPot.toLocaleString('pt-BR')}\n👥 **Jogadores:** ${participants.length}\n\n⏳ *A roleta roda em breve!*`);
                    
                    await i.update({ embeds: [embedLobby] });
                }
            });

            collector.on('end', async () => {
                if (participants.length === 1) {
                    await prisma.hypeUser.update({ where: { id: message.author.id }, data: { carteira: { increment: amount } } });
                    return msg.edit({ content: '😔╺╸**A mesa fechou. Ninguém quis apostar e o seu dinheiro foi devolvido para a carteira.**', embeds: [], components: [] }).catch(()=>{});
                }

                // Efeito visual de giro
                await msg.edit({ content: '🪙 **A MOEDA ESTÁ NO AR...**\nCalculando vencedor e dividindo o pote!', embeds: [], components: [] }).catch(()=>{});
                
                // Delay de suspense
                await new Promise(r => setTimeout(r, 3500));

                const winnerId = participants[Math.floor(Math.random() * participants.length)];
                const losers = participants.filter(id => id !== winnerId);
                
                await prisma.hypeUser.update({ where: { id: winnerId }, data: { carteira: { increment: totalPot } } });

                // LANÇA NO EXTRATO DO GANHADOR GLOBAL
                await addTransaction(winnerId, 'IN', totalPot, `Pote Global Coinflip (${participants.length}x Jogadores)`);

                const losersText = losers.map(p => `<@${p}>`).join(', ');

                const winnerEmbed = new EmbedBuilder()
                    .setColor('#57F287')
                    .setTitle('🎰 APOSTA ENCERRADA!')
                    .setDescription(`A roleta parou!\n\n🏆 **O GRANDE VENCEDOR:** <@${winnerId}>\n💸 **FATUROU:** R$ ${totalPot.toLocaleString('pt-BR')}\n\n💀 **Perdedores (ficaram sem nada):**\n${losersText}`)
                    .setThumbnail('https://media.giphy.com/media/l41lZxzroU33typuU/giphy.gif');

                await msg.edit({ content: '', embeds: [winnerEmbed], components: [] }).catch(()=>{});
            });
            
            return;
        }
        
        // ==========================================
        // 💰 COMANDOS: hdiario / hsemanal / hmensal
        // ==========================================
        if (command === 'diario' || command === 'semanal' || command === 'mensal') {
            const { AttachmentBuilder } = require('discord.js');
            const { generateRewardImage } = require('../../../utils/canvasDaily');

            const userId = message.author.id;
            let userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            
            let cooldownTime;
            let columnString;
            let nomePremio;
            let baseAmount;
            let embedColor;

            if (command === 'diario') {
                cooldownTime = 24 * 60 * 60 * 1000;
                columnString = 'lastDaily';
                nomePremio = 'Salário Diário';
                baseAmount = Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000; 
                embedColor = '#3b82f6'; // Azul Neon
            } else if (command === 'semanal') {
                cooldownTime = 7 * 24 * 60 * 60 * 1000;
                columnString = 'lastSemanal';
                nomePremio = 'Salário Semanal';
                baseAmount = Math.floor(Math.random() * (100000 - 50000 + 1)) + 50000; 
                embedColor = '#10b981'; // Verde Neon
            } else if (command === 'mensal') {
                cooldownTime = 30 * 24 * 60 * 60 * 1000;
                columnString = 'lastMensal';
                nomePremio = 'Salário Mensal';
                baseAmount = Math.floor(Math.random() * (350000 - 200000 + 1)) + 200000; 
                embedColor = '#f59e0b'; // Dourado Neon
            }

            if (userProfile && userProfile[columnString]) {
                const now = new Date().getTime();
                const lastTime = new Date(userProfile[columnString]).getTime();

                if (now - lastTime < cooldownTime) {
                    const expireUnix = Math.floor((lastTime + cooldownTime) / 1000);
                    return message.reply(`⏳╺╸**Calma lá, magnata!** Já recolheu o seu ${nomePremio}.\nPode voltar a receber <t:${expireUnix}:R>.`);
                }
            }

            const vipLevel = userProfile?.vipLevel || 0;
            
            let vipMultiplier = 1.0;
            if (vipLevel === 1) vipMultiplier = 1.5;
            else if (vipLevel === 2) vipMultiplier = 2.0;
            else if (vipLevel === 3) vipMultiplier = 3.0;
            else if (vipLevel === 4) vipMultiplier = 5.0;
            else if (vipLevel >= 5) vipMultiplier = 6.0;

            const rewardAmount = Math.floor(baseAmount * vipMultiplier);

            const updateData = { carteira: { increment: rewardAmount } };
            updateData[columnString] = new Date();
            const createData = { id: userId, carteira: rewardAmount };
            createData[columnString] = new Date();

            await prisma.hypeUser.upsert({
                where: { id: userId },
                update: updateData,
                create: createData
            });

            // Regista a entrada de dinheiro no Extrato Bancário dele
            await addTransaction(userId, 'IN', rewardAmount, `Depósito de ${nomePremio}`);

            // Gera a imagem e envia!
            const buffer = await generateRewardImage(message.author, nomePremio, rewardAmount, vipMultiplier, embedColor);
            const attachment = new AttachmentBuilder(buffer, { name: 'pagamento.png' });

            return message.reply({ 
                content: `💸╺╸**Mala forte!** O teu dinheiro acabou de cair na carteira. Cuidado com as ruas!`, 
                files: [attachment] 
            });
        }
        
        // ==========================================
        // 💸 COMANDO: hpix / hpagar / htransferir
        // ==========================================
        if (command === 'pix' || command === 'pagar' || command === 'transferir') {
            const targetUser = message.mentions.users.first();
            const amountStr = args[1]; 

            if (!targetUser || !amountStr) {
                return message.reply('❌╺╸**Uso correto:** `hpix @usuario <valor>` ou `hpix @usuario all`');
            }

            if (targetUser.id === message.author.id) {
                return message.reply('❌╺╸**Não pode fazer um Pix para vc  mesmo!**');
            }

            if (targetUser.bot) {
                return message.reply('❌╺╸**Bots não têm conta no Hype Bank.**');
            }

            const senderId = message.author.id;
            const receiverId = targetUser.id;

            let senderProfile = await prisma.hypeUser.findUnique({ where: { id: senderId } });
            
            let amount = lerAposta(amountStr, senderProfile?.hypeCash || 0);

            if (isNaN(amount) || amount <= 0) {
                return message.reply('❌╺╸**Valor inválido para transferência.**');
            }

            if (!senderProfile || senderProfile.hypeCash < amount) {
                return message.reply(`❌╺╸**Saldo Insuficiente!** Tu não tens **R$ ${amount.toLocaleString('pt-BR')}** no teu Cartão Hype.\nO seu saldo atual é **R$ ${(senderProfile?.hypeCash || 0).toLocaleString('pt-BR')}**.\n*(Usa o \`hdep\` para depositar o dinheiro da mão)*`);
            }

            const loadingMsg = await message.reply('🔄╺╸**A contactar o Banco Central e a verificar dados...**');

            try {
                await prisma.$transaction([
                    prisma.hypeUser.update({
                        where: { id: senderId },
                        data: { hypeCash: { decrement: amount } }
                    }),
                    prisma.hypeUser.upsert({
                        where: { id: receiverId },
                        update: { hypeCash: { increment: amount } },
                        create: { id: receiverId, hypeCash: amount }
                    })
                ]);

                // RASTREADOR: Fez Pix
                await trackContract(senderId, 'pix', 1);

                const txId = 'HYP-' + Math.random().toString(36).substring(2, 10).toUpperCase();
                
                // Lança no Extrato de Quem Enviou
                await addTransaction(senderId, 'OUT', amount, `Pix enviado para @${targetUser.username}`);
                // Lança no Extrato de Quem Recebeu
                await addTransaction(receiverId, 'IN', amount, `Pix recebido de @${message.author.username}`);

                const { generatePixReceipt } = require('../../../utils/canvasPix');
                const imageBuffer = await generatePixReceipt(message.author, targetUser, amount, txId);
                const attachment = new AttachmentBuilder(imageBuffer, { name: 'comprovante_pix.png' });

                await loadingMsg.edit({
                    content: `✅╺╸**PIX CONCLUÍDO!**\n<@${senderId}> transferiu **R$ ${amount.toLocaleString('pt-BR')}** diretamente para a conta de <@${receiverId}>.`,
                    files: [attachment]
                });

            } catch (error) {
                console.error('❌╺╸Erro no PIX:', error);
                await loadingMsg.edit('❌╺╸Ocorreu um erro no servidor do banco ao processar o teu Pix.');
            }
        }

        // ==========================================
        // 🔫 COMANDO: hroubar (Assalto com Mercado Negro e Canvas)
        // ==========================================
        if (command === 'roubar' || command === 'assaltar') {
            const authorId = message.author.id;
            const targetUser = message.mentions.users.first();

            if (!targetUser) return message.reply('❌╺╸**Precisas de mencionar a vítima! Exemplo: `hroubar @usuario`**');
            if (targetUser.id === authorId) return message.reply('❌╺╸Queres roubar a ti próprio? Vai ao psicólogo, não ao bot!');
            if (targetUser.bot) return message.reply('🤖╺╸**Roubar um bot? Eu não guardo notas de papel, só código!**');

            let [ladrao, vitima] = await Promise.all([
                prisma.hypeUser.findUnique({ where: { id: authorId } }),
                prisma.hypeUser.findUnique({ where: { id: targetUser.id } })
            ]);

            if (!ladrao) ladrao = await prisma.hypeUser.create({ data: { id: authorId } });
            if (!vitima || vitima.carteira <= 0) {
                return message.reply(`💨╺╸**Vácuo!** <@${targetUser.id}> não tem nem um centavo na carteira de risco. Não vale o esforço!`);
            }

            const cooldownRoubo = 10 * 60 * 1000;
            if (ladrao.lastRob) {
                const diff = Date.now() - new Date(ladrao.lastRob).getTime();
                if (diff < cooldownRoubo) {
                    const expireUnix = Math.floor((new Date(ladrao.lastRob).getTime() + cooldownRoubo) / 1000);
                    return message.reply(`⏳╺╸A polícia está de olho em vc! Espera até <t:${expireUnix}:R> para tentar outro assalto.`);
                }
            }

            // RASTREADOR: Tentativa de Roubo
            await trackContract(authorId, 'try_roubo', 1);

            // 🛡️ VERIFICAÇÃO DO COLETE À PROVA DE BALAS (15 Minutos)
            if (vitima.coleteExp && new Date(vitima.coleteExp).getTime() > Date.now()) {
                await prisma.hypeUser.update({ where: { id: authorId }, data: { lastRob: new Date() } });
                return message.reply(`🛡️╺╸**ASSALTO BLOQUEADO!** Você tentou roubar <@${targetUser.id}>, mas ele está com um **Colete Balístico** ativo!\nO assalto falhou e a blindagem dele continua intacta. Fuja antes que a polícia chegue!`);
            }

            // 🪓 VERIFICAÇÃO DO PÉ DE CABRA
            let chanceSucesso = 0.45; // 45% Padrão
            let msgItemCanvas = '';
            
            if (ladrao.peDeCabraExp && new Date(ladrao.peDeCabraExp).getTime() > Date.now()) {
                chanceSucesso += 0.15; // Sobe para 60%
                msgItemCanvas = 'PÉ DE CABRA UTILIZADO: CHANCE DE SUCESSO AUMENTADA';
            }

            const sorteio = Math.random();
            const sucesso = sorteio <= chanceSucesso;

            const { AttachmentBuilder } = require('discord.js');
            const { generateRouboImage } = require('../../../utils/canvasRoubo');

            if (sucesso) {
                // RASTREADOR: Sucesso no Roubo
                await trackContract(authorId, 'success_roubo', 1);

                const porcentagemRoubada = Math.random() * (1.0 - 0.2) + 0.2;
                const valorFinal = Math.floor(vitima.carteira * porcentagemRoubada);

                await prisma.$transaction([
                    prisma.hypeUser.update({ where: { id: authorId }, data: { carteira: { increment: valorFinal }, lastRob: new Date() } }),
                    prisma.hypeUser.update({ where: { id: targetUser.id }, data: { carteira: { decrement: valorFinal } } })
                ]);

                // Regista no extrato dos dois
                await addTransaction(authorId, 'IN', valorFinal, `Assalto a @${targetUser.username}`);
                await addTransaction(targetUser.id, 'OUT', valorFinal, `Furtado por @${message.author.username}`);

                // Gera a imagem de Sucesso
                const buffer = await generateRouboImage(message.author, targetUser, true, valorFinal, msgItemCanvas);
                const attachment = new AttachmentBuilder(buffer, { name: 'roubo_sucesso.png' });

                return message.reply({ files: [attachment] });

            } else {
                // ==========================================
                // 🚨 SISTEMA DE MULTA & DISFARCE
                // ==========================================
                const multaBase = 50000;
                const multaPorcentagem = Math.floor(ladrao.carteira * 0.10);
                let multaFinal = Math.max(multaBase, multaPorcentagem);

                if (ladrao.disfarceUses > 0) {
                    multaFinal = Math.floor(multaFinal * 0.50); 
                    const novosUsos = ladrao.disfarceUses - 1;

                    await prisma.hypeUser.update({
                        where: { id: authorId },
                        data: { disfarceUses: novosUsos }
                    });

                    msgItemCanvas = `DISFARCE UTILIZADO: MULTA REDUZIDA PELA METADE (${novosUsos} USOS RESTANTES)`;
                }

                await prisma.hypeUser.update({ 
                    where: { id: authorId }, 
                    data: { 
                        carteira: { decrement: ladrao.carteira >= multaFinal ? multaFinal : ladrao.carteira },
                        lastRob: new Date() 
                    } 
                });

                // Regista no extrato do Ladrão
                await addTransaction(authorId, 'OUT', multaFinal, `Fiança Policial (Assalto Falho a @${targetUser.username})`);

                // Gera a imagem de Prisão
                const buffer = await generateRouboImage(message.author, targetUser, false, multaFinal, msgItemCanvas);
                const attachment = new AttachmentBuilder(buffer, { name: 'roubo_falho.png' });

                return message.reply({ files: [attachment] });
            }
        }

        // ==========================================
        // 🃏 GAME: Blackjack (hbj)
        // ==========================================
        if (command === 'blackjack' || command === 'black' || command === 'jack' || command === 'bj') {
            const betInput = args[0];

            if (!betInput) return message.reply('❌╺╸**Uso correto:** `hbj <valor>` ou `hbj all`.');

            const userId = message.author.id;
            let userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            if (!userProfile) return message.reply('❌╺╸Ainda não tens um perfil registado. Usa o `hdiario` para começar!');

            let betAmount = lerAposta(betInput, userProfile.carteira);
            if (isNaN(betAmount) || betAmount <= 0) return message.reply('❌╺╸Valor de aposta inválido.');
            
            // 👇 LIMITADOR DE APOSTAS: MÁXIMO 10 MILHÕES (10M)
            if (betAmount > 10000000) betAmount = 10000000;

            if (userProfile.carteira < betAmount) return message.reply(`❌╺╸Não tens **R$ ${betAmount.toLocaleString('pt-BR')}** na carteira! (Vai ao banco sacar)`);

            if (userProfile.lastGame && (Date.now() - new Date(userProfile.lastGame).getTime() < 5000)) {
                return message.reply('⏳╺╸Calma! O Agiota ainda está a baralhar as cartas. Aguarda 5 segundos.');
            }

            // Desconta o valor da aposta na hora
            await prisma.hypeUser.update({
                where: { id: userId },
                data: { carteira: { decrement: betAmount }, lastGame: new Date() }
            });

            function createDeck() {
                const suits = ['♠', '♥', '♦', '♣'];
                const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
                let deck = [];
                for (let s of suits) for (let v of values) deck.push({ suit: s, value: v });
                for (let i = deck.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [deck[i], deck[j]] = [deck[j], deck[i]];
                }
                return deck;
            }

            let deck = createDeck();
            let playerHand = [deck.pop(), deck.pop()];
            let dealerHand = [deck.pop(), deck.pop()];

            if (!client.activeBlackjack) client.activeBlackjack = new Map();
            client.activeBlackjack.set(userId, { bet: betAmount, deck, playerHand, dealerHand });

            // Importa as ferramentas do Canvas e do Discord
            const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            const { generateBlackjackTable, getHandScore } = require('../../../utils/canvasBlackjack');

            // 🎨 GERA A IMAGEM TOTALMENTE FORA DA EMBED
            const imageBuffer = await generateBlackjackTable(message.author, betAmount, playerHand, dealerHand, 'playing');
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'blackjack.png' });

            const playerScore = getHandScore(playerHand, false);
            const is21 = playerScore === 21;

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`eco_bj_hit_${userId}`).setLabel('Pedir Carta').setStyle(ButtonStyle.Primary).setEmoji('🃏').setDisabled(is21),
                new ButtonBuilder().setCustomId(`eco_bj_stand_${userId}`).setLabel('Parar Mão').setStyle(ButtonStyle.Success).setEmoji('✋')
            );

            // Envia apenas pingando o jogador e com a imagem de luxo
            return message.reply({ content: `<@${userId}>`, components: [row], files: [attachment] });
        }

        // ==========================================
        // 🚀 GAME: Crash (hcrash)
        // ==========================================
        if (command === 'crash') {
            const betInput = args[0];

            if (!betInput) return message.reply('❌╺╸**Uso correto:** `hcrash <valor>` ou `hcrash all`.');

            const userId = message.author.id;
            let userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            if (!userProfile) return message.reply('❌╺╸Ainda não tens um perfil registado.');

            let betAmount = lerAposta(betInput, userProfile.carteira);
            if (isNaN(betAmount) || betAmount <= 0) return message.reply('❌ Valor de aposta inválido.');
            
            // 👇 LIMITADOR DE APOSTAS: MÁXIMO 10 MILHÕES (10M)
            if (betAmount > 10000000) betAmount = 10000000;

            if (userProfile.carteira < betAmount) return message.reply(`❌ Não tens **R$ ${betAmount.toLocaleString('pt-BR')}** na carteira!`);

            if (userProfile.lastGame && (Date.now() - new Date(userProfile.lastGame).getTime() < 5000)) {
                return message.reply('⏳╺╸O **foguetão ainda está a abastecer! Aguarda 5 segundos.**');
            }

            await prisma.hypeUser.update({
                where: { id: userId },
                data: { carteira: { decrement: betAmount }, lastGame: new Date() }
            });

            // RASTREADOR: Jogou Crash
            await trackContract(userId, 'play_crash', 1);

            function getCrashPoint() {
                const r = Math.random();
                if (r < 0.05) return 1.00;
                const multiplier = 1.00 / (1.00 - r * 0.95);
                return parseFloat(multiplier.toFixed(2));
            }

            const crashPoint = getCrashPoint();
            const gameState = { status: 'flying', multiplier: 1.00, crashPoint, bet: betAmount };
            
            if (!client.activeCrash) client.activeCrash = new Map();
            client.activeCrash.set(userId, gameState);

            let imageBuffer = await generateCrashImage(gameState.multiplier, gameState.status);
            let attachment = new AttachmentBuilder(imageBuffer, { name: 'crash.png' });

            let currentProfit = Math.floor(betAmount * gameState.multiplier);

            const embed = new EmbedBuilder()
                .setColor('#FEE75C')
                .setTitle('🚀 CRASH HYPE')
                .setDescription(`**Piloto:** <@${userId}>\n**Aposta:** R$ ${betAmount.toLocaleString('pt-BR')}\n**Retorno Atual:** 💰 R$ ${currentProfit.toLocaleString('pt-BR')}\n\n🟢 O foguetão está a subir! Pule antes que exploda!`)
                .setImage('attachment://crash.png');

            const cashoutBtn = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`eco_crash_cashout_${userId}`).setLabel(`💰 PULAR (R$ ${currentProfit.toLocaleString('pt-BR')})`).setStyle(ButtonStyle.Success)
            );

            const gameMessage = await message.reply({ embeds: [embed], components: [cashoutBtn], files: [attachment] });

            let stepRate = 0.15;
            while (true) {
                await new Promise(r => setTimeout(r, 1800));
                
                const currentGameState = client.activeCrash.get(userId);
                if (!currentGameState || currentGameState.status !== 'flying') break;

                gameState.multiplier += stepRate;
                stepRate *= 1.3; 
                let currentMult = parseFloat(gameState.multiplier.toFixed(2));

                if (currentMult >= gameState.crashPoint) {
                    gameState.multiplier = gameState.crashPoint;
                    gameState.status = 'crashed';
                    client.activeCrash.set(userId, gameState);
                    break; 
                }

                imageBuffer = await generateCrashImage(gameState.multiplier, gameState.status);
                attachment = new AttachmentBuilder(imageBuffer, { name: 'crash.png' });

                currentProfit = Math.floor(betAmount * currentMult);

                embed.setDescription(`**Piloto:** <@${userId}>\n**Aposta:** R$ ${betAmount.toLocaleString('pt-BR')}\n**Retorno Atual:** 💰 R$ ${currentProfit.toLocaleString('pt-BR')}\n\n🟢 O foguetão está a subir! Pule antes que exploda!`);
                cashoutBtn.components[0].setLabel(`💰 PULAR (R$ ${currentProfit.toLocaleString('pt-BR')})`);

                await gameMessage.edit({ embeds: [embed], components: [cashoutBtn], files: [attachment], attachments: [] }).catch(() => {});
            }

            const finalState = client.activeCrash.get(userId) || gameState;
            client.activeCrash.delete(userId);

            imageBuffer = await generateCrashImage(finalState.multiplier, finalState.status);
            attachment = new AttachmentBuilder(imageBuffer, { name: 'crash.png' });

            if (finalState.status === 'crashed') {
                embed.setColor('#ED4245')
                     .setTitle('💥 FOGUETÃO DESTRUÍDO')
                     .setDescription(`**Piloto:** <@${userId}>\n**Aposta:** R$ ${betAmount.toLocaleString('pt-BR')}\n**Perdeu:** 💸 -R$ ${betAmount.toLocaleString('pt-BR')}\n\nDemorou muito tempo! O foguetão explodiu em **${finalState.crashPoint}x**.`);
            } else if (finalState.status === 'cashed_out') {
                const profit = Math.floor(betAmount * finalState.multiplier);
                
                // RASTREADOR: Ganhou mais de 2.0x no Crash
                if (finalState.multiplier >= 2.0) {
                    await trackContract(userId, 'win_crash_2x', 1);
                }
                
                // LANÇA O LUCRO NO EXTRATO
                await addTransaction(userId, 'IN', profit, `Lucro Crash (${finalState.multiplier.toFixed(2)}x)`);

                embed.setColor('#57F287')
                     .setTitle('💸 RETIRADA SEGURA!')
                     .setDescription(`**Piloto:** <@${userId}>\n**Aposta:** R$ ${betAmount.toLocaleString('pt-BR')}\n**Lucro Total:** 💰 +R$ ${profit.toLocaleString('pt-BR')}\n\nSaltou do foguetão em **${finalState.multiplier.toFixed(2)}x** em segurança!`);
            }

            await gameMessage.edit({ embeds: [embed], components: [], files: [attachment], attachments: [] }).catch(() => {});
        }
        
        // ==========================================
        // 🏆 COMANDOS: hrank / htop / hrankglobal
        // ==========================================
        if (command === 'rank' || command === 'top' || command === 'rankglobal') {
            const isGlobal = command === 'rankglobal';
            const { generateRankingImage } = require('../../../utils/canvasRanking');
            const axios = require('axios');
            
            const msg = await message.reply({ content: '⏳╺╸`**Lendo a lista de habitantes e desenhando a galeria de Magnatas...**`' });

            // Se for global, busca top 30 geral. Se for local, busca os 500 mais ricos (depois a gente filtra quem tá no server)
            const allUsersRaw = await prisma.hypeUser.findMany({ 
                where: { hypeCash: { gt: 0 } },
                orderBy: { hypeCash: 'desc' }, 
                take: isGlobal ? 30 : 500 
            });

            let sortedUsers = allUsersRaw.map(u => ({
                id: u.id,
                total: u.hypeCash || 0 
            }));

            if (!isGlobal) {
                try { await message.guild.members.fetch(); } catch (e) { console.log('Aviso ao puxar membros no Rank.'); }
                // Filtra para mostrar apenas as pessoas que estão neste servidor
                sortedUsers = sortedUsers.filter(u => message.guild.members.cache.has(u.id)).slice(0, 30);
            } else {
                sortedUsers = sortedUsers.slice(0, 30);
            }

            if (sortedUsers.length === 0) return msg.edit({ content: '❌ Ninguém tem moedas depositadas no banco por aqui ainda...' });

            const chunks = [];
            for (let i = 0; i < sortedUsers.length; i += 10) {
                chunks.push(sortedUsers.slice(i, i + 10));
            }

            let currentPage = 0;
            const rankTitle = isGlobal ? 'GLOBAL (Mundo)' : message.guild.name.toUpperCase();

            const renderPage = async (pageIndex) => {
                const pageData = chunks[pageIndex];
                const players = await Promise.all(pageData.map(async (u, idx) => {
                    const globalRank = (pageIndex * 10) + idx + 1;
                    
                    let username = 'Membro Desconhecido';
                    let avatarBuffer = null;
                    try {
                        const discordUser = await client.users.fetch(u.id);
                        if (discordUser) {
                            username = discordUser.username;
                            const url = discordUser.displayAvatarURL({ extension: 'png', size: 64 });
                            const res = await axios.get(url, { responseType: 'arraybuffer' });
                            avatarBuffer = Buffer.from(res.data);
                        }
                    } catch(e) {}

                    return { rank: globalRank, username, score: u.total, avatarBuffer };
                }));

                const buffer = await generateRankingImage(players, pageIndex + 1, chunks.length, rankTitle);
                return new AttachmentBuilder(buffer, { name: 'ranking.png' });
            };

            const getRow = (page) => {
                return new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('rank_prev').setLabel('Anterior').setStyle(ButtonStyle.Primary).setEmoji('⬅️').setDisabled(page === 0),
                    new ButtonBuilder().setCustomId('rank_next').setLabel('Próxima').setStyle(ButtonStyle.Primary).setEmoji('➡️').setDisabled(page === chunks.length - 1)
                );
            };

            try {
                const firstAttachment = await renderPage(0);
                await msg.edit({ content: '', files: [firstAttachment], components: chunks.length > 1 ? [getRow(0)] : [] });

                if (chunks.length > 1) {
                    const collector = msg.createMessageComponentCollector({ time: 60000 });
                    collector.on('collect', async i => {
                        if (i.user.id !== message.author.id) {
                            return i.reply({ content: '❌╺╸**Você não pode trocar a página deste ranking.**', flags: [MessageFlags.Ephemeral] });
                        }

                        if (i.customId === 'rank_prev' && currentPage > 0) currentPage--;
                        if (i.customId === 'rank_next' && currentPage < chunks.length - 1) currentPage++;

                        await i.update({ content: '⏳╺╸`**Desenhando a nova página...**`', files: [], components: [] });
                        
                        const newAttachment = await renderPage(currentPage);
                        await msg.edit({ content: '', files: [newAttachment], components: [getRow(currentPage)] });
                    });

                    collector.on('end', () => { msg.edit({ components: [] }).catch(()=>{}); });
                }
            } catch (error) {
                console.error(error);
                msg.edit({ content: '❌╺╸Ocorreu um erro ao gerar o ranking visual.' }).catch(()=>{});
            }

            return;
        }

        // ==========================================
        // 💼 COMANDO: hmala (Evento Exclusivo para Admins)
        // ==========================================
        if (command === 'mala' || command === 'maleta' || command === 'hmala') {
            if (!message.member.permissions.has('Administrator')) {
                return message.reply('❌╺╸Apenas a **Alta Cúpula (Admins)** pode iniciar o evento da Mala Criptografada!');
            }

            const prize = lerAposta(args[0], 0);
            const cost = lerAposta(args[1], 0);

            if (!prize || !cost || isNaN(prize) || isNaN(cost)) {
                return message.reply('📝╺╸**Uso correto:** `hmala <premio> <custo_por_tentativa>`\nExemplo: `hmala 50k 1k`');
            }

            const password = Math.floor(100 + Math.random() * 900).toString(); 
            const passNum = parseInt(password);
            const p0 = parseInt(password[0]);
            const p1 = parseInt(password[1]);
            const p2 = parseInt(password[2]);
            
            const { generateMalaImage } = require('../../../utils/canvasMala');
            const malaBuffer = await generateMalaImage(prize, cost);
            const attachment = new AttachmentBuilder(malaBuffer, { name: 'mala.png' });

            const msg = await message.channel.send({
                content: `🚨╺╸**ALERTA NO SUBMUNDO!** A Alta Cúpula soltou uma maleta trancada!\nValendo **R$ ${prize.toLocaleString('pt-BR')}**! Mandem senhas de **3 DÍGITOS** (Ex: 418) no chat para tentar abrir.`,
                files: [attachment]
            });

            const hintsProgressive = [
                `A soma de todos os 3 dígitos é **${p0 + p1 + p2}**.`,
                `A senha está **entre ${Math.max(100, passNum - 300)} e ${Math.min(999, passNum + 300)}**.`,
                `O primeiro dígito é **${p0 % 2 === 0 ? 'Par' : 'Ímpar'}**.`,
                `O último dígito é **${p2 % 2 === 0 ? 'Par' : 'Ímpar'}**.`,
                `A senha está **entre ${Math.max(100, passNum - 150)} e ${Math.min(999, passNum + 150)}**.`,
                `A soma do primeiro com o último dígito é **${p0 + p2}**.`,
                `O dígito do meio é **${p1 > 5 ? 'maior que 5' : 'menor ou igual a 5'}**.`,
                `A senha está mais fechada: **entre ${Math.max(100, passNum - 80)} e ${Math.min(999, passNum + 80)}**.`,
                `O primeiro dígito é exatamente **${p0}**.`,
                `A área de busca diminuiu: **entre ${Math.max(100, passNum - 30)} e ${Math.min(999, passNum + 30)}**.`,
                `O último dígito é exatamente **${p2}**.`,
                `Muito perto! A senha está **entre ${Math.max(100, passNum - 10)} e ${Math.min(999, passNum + 10)}**.`,
                `A soma dos dois últimos dígitos é **${p1 + p2}**.`,
                `O segundo dígito é exatamente **${p1}**. (Isso é um presente!)`,
                `SÉRIO? A senha está **entre ${Math.max(100, passNum - 3)} e ${Math.min(999, passNum + 3)}**.`,
                `A senha começa com **${p0}${p1}**. Falta literalmente só 1 número!`,
                `💻╺╸**ÚLTIMA DICA:** A senha inteira é **${password}**. Alguém digita isso logo pelo amor de Deus!`
            ];

            let currentHintIndex = 0;

            const hintInterval = setInterval(() => {
                if (currentHintIndex < hintsProgressive.length) {
                    message.channel.send(`💡╺╸**Dica do Hacker [${currentHintIndex + 1}/${hintsProgressive.length}]:** ${hintsProgressive[currentHintIndex]}`);
                    currentHintIndex++;
                }
            }, 15000); 

            const filter = m => /^\d{3}$/.test(m.content);
            const collector = message.channel.createMessageCollector({ filter, time: 5 * 60 * 1000 }); 

            collector.on('collect', async m => {
                const guess = m.content;
                const userId = m.author.id;

                const userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
                
                if (!userProfile || userProfile.hypeCash < cost) {
                    m.react('🏦').catch(()=>{}); 
                    return;
                }

                await prisma.hypeUser.update({
                    where: { id: userId },
                    data: { hypeCash: { decrement: cost } }
                });

                if (guess === password) {
                    collector.stop('won');
                    clearInterval(hintInterval);

                    await prisma.hypeUser.update({
                        where: { id: userId },
                        data: { hypeCash: { increment: prize } }
                    });
                    
                    // LANÇA A RECOMPENSA NO EXTRATO
                    await addTransaction(userId, 'IN', prize, `Prêmio Evento Maleta Criptografada`);

                    const winMsg = await m.reply('🔐╺╸`Criptografia quebrada! Autenticando e gerando o recibo de Magnata... Aguarde.`');
                    
                    const { generateMalaWinImage } = require('../../../utils/canvasMalaWin');
                    const winBuffer = await generateMalaWinImage(m.author, prize, password);
                    const winAttachment = new AttachmentBuilder(winBuffer, { name: 'vitoria.png' });

                    await winMsg.delete().catch(()=>{});
                    m.channel.send({
                        content: `🎉 <@${userId}> acabou de HACKEAR o sistema da Mala e levou a bolada para casa!`,
                        files: [winAttachment]
                    });

                } else {
                    m.react('❌').catch(()=>{});
                }
            });

            collector.on('end', (collected, reason) => {
                clearInterval(hintInterval);
                if (reason !== 'won') {
                    message.channel.send(`🚨╺╸**SISTEMA TRAVADO!**\nO tempo de hacking esgotou e a maleta bloqueou. A senha correta era **${password}**.`);
                }
            });

            return;
        }

 // ==========================================
        // 🛠️ COMANDO ADMIN: hsetupmanual (O Manual Definitivo do Jogador)
        // ==========================================
        if (command === 'setupmanual') {
            if (!message.member.permissions.has('Administrator')) return;

            await message.delete().catch(() => {}); 

            const { EmbedBuilder } = require('discord.js');

            const embeds = [
                new EmbedBuilder()
                    .setColor('#0059ff') // Azul Hype Padrão
                    .setTitle('📖 MANUAL TÁTICO - BEM-VINDO')
                    .setDescription('Bem-vindo ao submundo, truta. Aqui o dinheiro fala mais alto, a polícia não entra e só os espertos sobrevivem. Leia este guia com atenção para dominar a cidade e não falir no primeiro dia.\n\n> 🔑 **Prefixo Oficial:** `h` (Use antes de qualquer comando)\n> 💳 **Regra de Ouro:** O teu dinheiro de risco fica na **Carteira** (pronto para gastar, apostar ou ser roubado). O dinheiro intocável fica no **Banco**.')
                    .setFooter({ text: 'Sistema Hype •' }),

                new EmbedBuilder()
                    .setColor('#4ade80')
                    .setTitle('🏦 SISTEMA FINANCEIRO E SINDICATO')
                    .setDescription('Aprenda a recolher, lavar e movimentar o seu malote com segurança.')
                    .addFields(
                        { name: '💼 O Seu Bolso', value: '> `hcarteira` (ou `hc`) - Vê o saldo da sua mão e do banco.\n> `hperfil` - Mostra o seu RG, nível VIP, status e permite editar a Bio.\n> `hextrato` - Puxa a ficha de todas as suas transações na cidade.\n> `htempo` (ou `hcd`) - Mostra o tempo de recarga dos seus comandos.' },
                        { name: '💰 Renda e Contratos', value: '> `hdiario` - Pega a grana do dia (a cada 24h).\n> `hsemanal` - Bônus suado da semana.\n> `hmensal` - O grande malote mensal.\n> `hcontratos` - Cumpra as tarefas do Sindicato.\n> `hcontratos entregar` - Resgata a recompensa se concluir tudo!' },
                        { name: '🏧 Banco Central', value: '> `hdepositar <valor>` (ou `all`) - Guarda na conta (protege contra roubos).\n> `hsacar <valor>` (ou `all`) - Tira pro bolso pra poder apostar.\n> `hpix @usuario <valor>` - Transfere dinheiro limpo pra um parceiro.' },
                        { name: '🏆 A Elite', value: '> `hrank` - Pódio dos magnatas do servidor local.\n> `hrankglobal` - Pódio dos mais ricos de TODOS os servidores.' }
                    )
                    .setFooter({ text: 'Sistema Hype •' }),

                new EmbedBuilder()
                    .setColor('#FEE75C')
                    .setTitle('🎰 CASSINO HYPE - JOGOS SOLO')
                    .setDescription('Quer multiplicar a grana rápido? O Cassino cobra o valor direto da sua **CARTEIRA**. Limite de aposta: **R$ 10.000.000**.')
                    .addFields(
                        { name: '🐯 Máquina do Tigrinho', value: '> `htigrinho <valor>`\n> Gira a máquina. Se a sorte bater e os bônus alinharem, o Tigre paga pesadíssimo!' },
                        { name: '💣 Campo Minado (Mines)', value: '> `hmines <valor>`\n> Clica nos quadrados para achar os diamantes. \n> *Dica: Use a Lanterna Tática para escanear e ver as bombas antes de clicar!*' },
                        { name: '🚀 O Foguetão (Crash)', value: '> `hcrash <valor>`\n> O multiplicador sobe sem parar... Pula fora do foguete e saca o lucro antes que ele exploda!' },
                        { name: '🃏 Blackjack (21)', value: '> `hblackjack <valor>`\n> Desafia o Agiota no carteado. Pede carta pra chegar perto do 21, mas se passar você perde tudo.' }
                    )
                    .setFooter({ text: 'Sistema Hype •' }),

                new EmbedBuilder()
                    .setColor('#ef4444')
                    .setTitle('🔫 SUBMUNDO E INVENTÁRIO TÁTICO')
                    .setDescription('Chama os amigos pra call, compra equipamentos, aposta alto ou corre risco de vida e cadeia.')
                    .addFields(
                        { name: '🎒 Seu Equipamento (NOVO)', value: '> `hloja` - O Mercado Negro. Compra Colete, Pé de Cabra, Máscara ou Lanterna.\n> `hmochila` - Abre teu Inventário Tático visual e vê teus itens.\n> `husar <item>` - Prepara um item pra usar nas ruas.\n> `habrir maleta` - Abre a Maleta da Máfia se você tiver uma!' },
                        { name: '🏦 Assalto ao Banco (RPG)', value: '> `hassalto <valor>`\n> O maior evento da cidade! Reúna até 4 amigos, escolham papéis (Piloto, Hacker, Atirador) e tentem roubar o cofre.' },
                        { name: '🏎️ Corrida Clandestina', value: '> `hcorrida <valor>`\n> Abre um lobby. Apostem nos carros e assistam à disputa com nitro!' },
                        { name: '🔫 Roleta Russa', value: '> `hroleta <valor>`\n> 6 Cadeiras, 1 Bala. Sentem na mesa, girem o tambor e quem sobrar leva o prêmio!' },
                        { name: '🥷 Crime de Rua & PvP', value: '> `hroubar @usuario` - Tenta passar a mão na carteira (use disfarce ou pé de cabra).\n> `hap <valor> @usuario` - Desafia um rival pro X1 cara a cara.' }
                    )
                    .setFooter({ text: 'Sistema Hype •' }),

                new EmbedBuilder()
                    .setColor('#ec4899')
                    .setTitle('🎭 RELAÇÕES SOCIAIS E RP')
                    .setDescription('Interaja com a comunidade no chat. Fazer interações dá a chance de achar um troco perdido no chão!')
                    .addFields(
                        { name: '❤️ Romance & Carinho', value: '> `hbeijar @user` | `habracar @user` | `hcafune @user` | `hpat @user`' },
                        { name: '🥊 Porradaria & Treta', value: '> `hsocar @user` | `htapa @user` | `hchutar @user` | `hmorder @user`' },
                        { name: '🥂 Festas & Comemoração', value: '> `hdancar @user` | `hbrindar @user`' }
                    )
                    .setFooter({ text: 'Sistema Hype • ' }),

                new EmbedBuilder()
                    .setColor('#a855f7')
                    .setTitle('💎 HYPE VIP & OSTENTAÇÃO')
                    .setDescription('Para os donos da cidade. Benefícios exclusivos de quem patrocina o servidor.')
                    .addFields(
                        { name: '💳 Painel Black', value: '> `hvip` - Abre a gestão do seu Cartão VIP Black.\n> `/comprarvip` - Ver as tabelas e como adquirir VIP na cidade.' },
                        { name: '🎨 Customização Exclusiva', value: '> Troque a cor do seu Perfil (`hperfil`), mude o fundo, ganhe um ícone de luxo e salários astronômicos.' },
                        { name: '🔥 Ações de Chefe (Via Menu)', value: '> **💰 Chuva de Dinheiro:** Jogue grana no chat pra galera disputar aos tapas.\n> **🔇 Mordaça VIP:** Dê timeout (castigo) num rival chato pelo menu, entre varios outros beneficios.' }
                    )
                    .setFooter({ text: 'Sistema Hype • ' }),

  
            ];

            await message.channel.send({ embeds: embeds });
            return;
        }
      // ==========================================
        // 📖 COMAsNDO: hajuda / hhelp (Menu V2 Profissional)
        // ==========================================
        if (command === 'ajuda' || command === 'help') {
            const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, MessageFlags } = require('discord.js');

            const embeds = {
                home: new EmbedBuilder()
                    .setColor('#0059ff') // Azul Padrão Hype
                    .setTitle('📖 MANUAL TÁTICO - HYPE BOT')
                    .setDescription('Bem-vindo ao submundo, truta. Aqui o dinheiro fala mais alto, a polícia não entra e só os espertos sobrevivem.\n\nUse o **Menu de Seleção** abaixo para navegar pelas categorias do nosso sistema. Descubra como lavar dinheiro, usar o seu Inventário Tático, roubar bancos e ostentar o seu VIP na cidade.')
                    .setThumbnail(client.user.displayAvatarURL()),

                economia: new EmbedBuilder()
                    .setColor('#0059ff')
                    .setTitle('🏦 Hype Economy - Guia de Sobrevivência')
                    .setDescription('**Prefixo Oficial:** `h`\nAqui na cidade, o dinheiro move tudo. O teu dinheiro de risco fica na **Carteira**, o dinheiro intocável fica no **Banco**.')
                    .addFields(
                        { name: '💼 Gerenciamento Pessoal', value: '`hcarteira` (ou `hc`) - Vê o saldo que tens em mãos.\n`hperfil` - Vê o teu nível VIP, status e edita a tua bio.\n`hextrato` - Consulta as tuas últimas movimentações de grana limpa.\n`htempo` (ou `hcd`) - Verifica os tempos de recarga de tudo.' },
                        { name: '💰 Renda & Sindicato', value: '`hdiario` - Recolhe a tua grana a cada 24 horas.\n`hsemanal` - Bônus suado a cada 7 dias.\n`hmensal` - O grande malote a cada 30 dias.\n`hcontratos` - Cumpra tarefas para a máfia.\n`hcontratos entregar` - Resgata a sua Maleta da Máfia ao concluir missões.' },
                        { name: '🏧 Banco Central', value: '`hdepositar <valor>` (ou `hdep all`) - Guarda na conta (protegido contra roubos).\n`hsacar <valor>` (ou `hsacar all`) - Tira pro bolso.\n`hpix @usuario <valor>` - Transfere grana segura pra um truta.' }
                    ),

                cassino: new EmbedBuilder()
                    .setColor('#FEE75C')
                    .setTitle('🎰 Cassino Hype - Jogos Solo')
                    .setDescription('Apostas arriscadas! Todos os jogos cobram o valor diretamente da tua **CARTEIRA** (dinheiro na mão). Limite de aposta: 10 Milhões.')
                    .addFields(
                        { name: '🐯 O Famoso Tigrinho', value: '`htigrinho <valor>` (ou `all`) - Gira a máquina do tigre. Pode pagar até 10x se vier a cartinha de bônus!' },
                        { name: '💣 Campo Minado', value: '`hmines <valor>` (ou `all`) - Tenta achar os diamantes. \n*(Dica: Compre uma Lanterna Tática no Mercado Negro para escanear bombas antes de clicar!)*' },
                        { name: '🚀 Crash (O Foguetão)', value: '`hcrash <valor>` (ou `all`) - O multiplicador sobe... Pula antes que o foguete exploda na tua cara!' },
                        { name: '🃏 Blackjack (21)', value: '`hblackjack <valor>` (ou `all`) - Desafia o Agiota num carteado clássico. Chega perto do 21 sem estourar.' }
                    ),

                submundo: new EmbedBuilder()
                    .setColor('#ef4444')
                    .setTitle('🔫 Submundo - Inventário & Crime')
                    .setDescription('Aqui a parada fica séria. Chama os amigos pra call, compra equipamentos, aposta alto ou perde a vida tentando.')
                    .addFields(
                        { name: '🎒 Inventário Tático (NOVO)', value: '`hloja` - O Mercado Negro. Compra Colete, Pé de Cabra, Máscara ou Lanterna.\n`hmochila` - Abre teu Inventário visual e vê teus equipamentos.\n`husar <item>` - Prepara um item para a rua (ex: `husar colete`).\n`habrir maleta` - Abre a Maleta da Máfia (se tiver) e pega o dinheiro sujo.' },
                        { name: '🏦 Assalto ao Banco (RPG)', value: '`hassalto <valor>` - Reúne até 4 amigos, escolham papéis (Piloto, Hacker, Atirador) e tentem roubar o cofre com escolhas dinâmicas!' },
                        { name: '🏎️ Corrida Clandestina', value: '`hcorrida <valor>` - Abre um lobby, apostem nos carros (🔴🔵🟢🟡) e assistam à corrida com nitro e batidas!' },
                        { name: '🔫 Roleta Russa', value: '`hroleta <valor>` - Abre uma mesa (2 a 6 pessoas). Um revólver, uma bala. Quem sobrar leva o Pote Gigante!' },
                        { name: '🥷 Crime de Rua & PvP', value: '`hroubar @usuario` - Tenta passar a mão na carteira.\n`hap <valor> @usuario` - Desafia um rival pro X1 no Cara ou Coroa.' }
                    ),

                social: new EmbedBuilder()
                    .setColor('#9b59b6')
                    .setTitle('🎭 Interações Sociais & Ostentação')
                    .setDescription('Interage no chat para ganhar um troco extra e mostra a todos quem é que manda na cidade!')
                    .addFields(
                        { name: '🏆 Rankings de Riqueza', value: '`hrank` - Pódio dos magnatas do servidor local.\n`hrankglobal` - Pódio dos mais ricos de TODOS os servidores do Hype.' },
                        { name: '💎 Hype VIP', value: '`hvip` - Abre o painel do teu Cartão de Crédito Black (Personalize cores, resgate bônus, dê timeout nos outros).\n`/comprarvip` - Loja para adquirir benefícios REAIS.' },
                        { name: '❤️ Rolê de Casal (Ganha $)', value: '`hbeijar @user` | `habracar @user` | `hpat @user` | `hcafune @user`' },
                        { name: '🥊 Porradaria (Ganha $)', value: '`htapa @user` | `hsocar @user` | `hmorder @user` | `hchutar @user`' },
                        { name: '🥂 Festas (Ganha $)', value: '`hdancar @user` | `hbrindar @user`' }
                    ),

                admin: new EmbedBuilder()
                    .setColor('#000000')
                    .setTitle('👑 Administração & Staff')
                    .setDescription('Comandos restritos à Alta Cúpula e Controle do Servidor.')
                    .addFields(
                        { name: '💼 Sistema de Suporte', value: '`/locticket` - Envia o painel interativo de suporte.\n`/ranking` - Top atendimentos da Staff.' },
                        { name: '⚙️ Comandos de Gestão', value: '`/hype` - Dashboard Central (Configurar Canais, Auto-Voice).\n`/massrole` - Distribui um cargo em massa a todos.' },
                        { name: '🎁 Evento da Maleta', value: '`hmala <premio> <custo_tentativa>` - *(Staff)* Solta uma maleta criptografada no chat pra galera hackear a senha!' },
                        { name: '💻 Dev Panel (Dono)', value: '`/devpanel` - Painel Deus (Injeta dinheiro, gere VIPs).\n`/wipecooldowns` - Zera o delay de todos.\n`/wipeeconomy` - Reseta o dinheiro de todos.' }
                    )
            };

            const menuRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('help_select_menu')
                    .setPlaceholder('Escolha uma secção do manual...')
                    .addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Página Inicial')
                            .setDescription('Voltar à página de boas-vindas.')
                            .setValue('home')
                            .setEmoji('🏠'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Economia & Sindicato')
                            .setDescription('Trabalho, banco, transferências e contratos.')
                            .setValue('economia')
                            .setEmoji('🏦'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Cassino Solo')
                            .setDescription('Tigrinho, Crash, Mines e Blackjack.')
                            .setValue('cassino')
                            .setEmoji('🎰'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Submundo & Inventário')
                            .setDescription('Assalto, Mercado Negro, Mochila Tática e PvP.')
                            .setValue('submundo')
                            .setEmoji('🔫'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Interações Sociais & VIP')
                            .setDescription('Rankings, Comandos de RP e Ostentação VIP.')
                            .setValue('social')
                            .setEmoji('🎭'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Administração')
                            .setDescription('Comandos exclusivos para a Staff e Devs.')
                            .setValue('admin')
                            .setEmoji('👑')
                    )
            );

            const helpMsg = await message.reply({ embeds: [embeds.home], components: [menuRow] });
            const collector = helpMsg.createMessageComponentCollector({ time: 120000 });

            collector.on('collect', async i => {
                if (i.user.id !== message.author.id) {
                    return i.reply({ 
                        content: '👀╺╸**Sai pra lá curioso! Esse manual foi aberto pelo parceiro. Digita `hajuda` no chat pra abrir o seu!**', 
                        flags: [MessageFlags.Ephemeral] 
                    }).catch(()=>{});
                }
                const selectedCategory = i.values[0];
                await i.update({ embeds: [embeds[selectedCategory]], components: [menuRow] }).catch(()=>{});
            });

            collector.on('end', () => {
                menuRow.components[0].setDisabled(true).setPlaceholder('Tempo esgotado. Digite hajuda novamente.');
                helpMsg.edit({ components: [menuRow] }).catch(() => {});
            });

            return;
        }
        // ==========================================
        // 🚀 COMANDO: hperfil
        // ==========================================
        if (command === 'perfil') {
            const targetUser = message.mentions.users.first() || message.author;
            const isOwnProfile = targetUser.id === message.author.id; 

            const loadingMsg = await message.reply('🔍╺╸**A procurar perfil...**');

            try {
                let userData = await prisma.hypeUser.findUnique({ where: { id: targetUser.id } });
                if (!userData) userData = await prisma.hypeUser.create({ data: { id: targetUser.id } });

                let userRank = 'N/A';
                if (userData.hypeCash > 0) {
                    const usersAhead = await prisma.hypeUser.count({ where: { hypeCash: { gt: userData.hypeCash } } });
                    userRank = usersAhead + 1; 
                }

                const imageBuffer = await generateProfileImage(targetUser, userData, userRank);
                const attachment = new AttachmentBuilder(imageBuffer, { name: 'profile.png' });

                const embed = new EmbedBuilder().setColor('#2b2d31').setImage('attachment://profile.png');
                const components = [];
                
                if (isOwnProfile) {
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId(`eco_profile_bio_${targetUser.id}`).setLabel('Editar Bio').setStyle(ButtonStyle.Secondary).setEmoji('✏️'),
                        new ButtonBuilder().setCustomId(`btn_perfil_cor_${targetUser.id}`).setLabel('Cores de Perfil').setStyle(userData.vipLevel > 0 ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji('🎨').setDisabled(userData.vipLevel === 0) 
                    );
                    components.push(row);
                } else {
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('eco_rep_btn').setLabel('Dar +Curtida').setStyle(ButtonStyle.Success).setEmoji('⭐')
                    );
                    components.push(row);
                }

                await loadingMsg.edit({ content: `Perfil de <@${targetUser.id}>`, embeds: [embed], files: [attachment], components: components });
            } catch (err) {
                console.error(err);
                await loadingMsg.edit('❌ Erro ao gerar o perfil.');
            }
        }

        // ==========================================
        // 🚀 COMANDOS BANCÁRIOS (Depósitos e Saques)
        // ==========================================
        if (command === 'depositar' || command === 'dep') {
            let valorStr = args[0];
            if (!valorStr) return message.reply('❌╺╸**Você precisa dizer o valor! Exemplo: `hdepositar 100` ou `hdepositar tudo**`');

            const user = await prisma.hypeUser.findUnique({ where: { id: message.author.id } });
            if (!user || user.carteira <= 0) return message.reply('❌╺╸Não tens dinheiro na carteira para depositar.');

            let valor = lerAposta(valorStr, user.carteira);

            if (isNaN(valor) || valor <= 0) return message.reply('❌╺╸Valor inválido!');
            if (user.carteira < valor) return message.reply(`❌╺╸Só tem **R$ ${user.carteira.toLocaleString('pt-BR')}** na carteira.`);

            await prisma.hypeUser.update({ where: { id: user.id }, data: { carteira: { decrement: valor }, hypeCash: { increment: valor } } });
            
            // RASTREADOR: Depósito no Banco
            await trackContract(message.author.id, 'deposito', 1);
            
            return message.reply(`✅╺╸**Sucesso!** Você depositou **R$ ${valor.toLocaleString('pt-BR')}** no seu Cartão Hype! 🏦`);
        }

        if (command === 'depall') {
            const user = await prisma.hypeUser.findUnique({ where: { id: message.author.id } });
            if (!user || user.carteira <= 0) return message.reply('❌╺╸Não tem nenhum dinheiro na carteira para depositar.');
            const valorTotal = user.carteira;

            await prisma.hypeUser.update({ where: { id: user.id }, data: { carteira: { decrement: valorTotal }, hypeCash: { increment: valorTotal } } });
            
            // RASTREADOR: Depósito no Banco
            await trackContract(message.author.id, 'deposito', 1);

            return message.reply(`✅╺╸**Segurança Máxima!** Você depositou todo o seu dinheiro (**R$ ${valorTotal.toLocaleString('pt-BR')}**) no seu Cartão Hype! 🏦`);
        }

        if (command === 'sacar' || command === 'saque') {
            let valorStr = args[0];
            if (!valorStr) return message.reply('❌╺╸Você precisa dizer o valor! Exemplo: `hsacar 100`');

            const user = await prisma.hypeUser.findUnique({ where: { id: message.author.id } });
            
            let valor = lerAposta(valorStr, user?.hypeCash || 0);

            if (!user || isNaN(valor) || valor <= 0 || user.hypeCash < valor) {
                return message.reply(`❌╺╸Saldo insuficiente no banco. Tem apenas **R$ ${(user?.hypeCash || 0).toLocaleString('pt-BR')}**.`);
            }

            await prisma.hypeUser.update({ where: { id: user.id }, data: { hypeCash: { decrement: valor }, carteira: { increment: valor } } });
            return message.reply(`✅╺╸**Saque feito!** Retirou **R$ ${valor.toLocaleString('pt-BR')}** do banco. O dinheiro está na tua carteira. Cuidado nas ruas!╺╸🔫`);
        }

        if (command === 'sacarall') {
            const user = await prisma.hypeUser.findUnique({ where: { id: message.author.id } });
            if (!user || user.hypeCash <= 0) return message.reply('❌╺╸O seu banco está a zero. Não tem nada para sacar.');
            const valorTotal = user.hypeCash;

            await prisma.hypeUser.update({ where: { id: user.id }, data: { hypeCash: { decrement: valorTotal }, carteira: { increment: valorTotal } } });
            return message.reply(`✅╺╸**Saque Total!** Retirou todo o seu dinheiro (**R$ ${valorTotal.toLocaleString('pt-BR')}**) do banco. Cuidado nas ruas!╺╸🔫`);
        }

        // ==========================================
        // 🚀 COMANDO: hc / hcarteira
        // ==========================================
        if (command === 'c' || command === 'carteira') {
            const targetUser = message.mentions.users.first() || message.author;
            const loadingMsg = await message.reply('🔍╺╸**A abrir a carteira...**');

            try {
                let userData = await prisma.hypeUser.findUnique({ where: { id: targetUser.id } });
                if (!userData) userData = await prisma.hypeUser.create({ data: { id: targetUser.id } });

                const { generateWalletImage } = require('../../../utils/canvasWallet');
                const imageBuffer = await generateWalletImage(targetUser, userData);
                const attachment = new AttachmentBuilder(imageBuffer, { name: 'wallet.png' });

                await loadingMsg.edit({ content: `**💸╺╸Carteira de** <@${targetUser.id}>`, files: [attachment] });
            } catch (err) {
                console.error(err);
                await loadingMsg.edit('❌╺╸Erro ao gerar a carteira.');
            }
        }

        // ==========================================
        // 🚀 COMANDO: hvip
        // ==========================================
        if (command === 'vip') {
            const targetUser = message.mentions.users.first() || message.author;
            const guildId = message.guild.id;

            const loadingMsg = await message.reply('💳╺╸**A imprimir o Cartão Hype...**');

            try {
                let [userProfile, config] = await Promise.all([
                    prisma.hypeUser.findUnique({ where: { id: targetUser.id } }),
                    prisma.vipConfig.findUnique({ where: { guildId } })
                ]);

                if (!userProfile || !userProfile.cardNumber) {
                    const randomHex = () => Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0');
                    const newCardNumber = `HYPE-${randomHex()}-${randomHex()}`;
                    userProfile = await prisma.hypeUser.upsert({
                        where: { id: targetUser.id },
                        update: { cardNumber: newCardNumber },
                        create: { id: targetUser.id, cardNumber: newCardNumber }
                    });
                }

                const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
                let vipRealLevel = 0;
                let txtVip = "Membro Comum";
                let colorAccent = '#2b2d31'; 
                let txtValidade = "";

                if (member) {
                    if (userProfile.vipLevel >= 5) {
                        vipRealLevel = 5; txtVip = "⭐ VIP SUPREME"; colorAccent = '#ED4245'; 
                    } else if (userProfile.vipLevel === 4) {
                        vipRealLevel = 4; txtVip = "⭐ VIP ELITE"; colorAccent = '#FEE75C'; 
                    } else if (userProfile.vipLevel === 3 || (config?.roleVip3 && member.roles.cache.has(config.roleVip3))) {
                        vipRealLevel = 3; txtVip = "⭐ VIP EXCLUSIVE"; colorAccent = '#9b59b6'; 
                    } else if (userProfile.vipLevel === 2 || (config?.roleVip2 && member.roles.cache.has(config.roleVip2))) {
                        vipRealLevel = 2; txtVip = "⭐ VIP PRIME"; colorAccent = '#ffffff'; 
                    } else if (userProfile.vipLevel === 1 || (config?.roleVip1 && member.roles.cache.has(config.roleVip1))) {
                        vipRealLevel = 1; txtVip = "⭐ VIP BOOSTER"; colorAccent = '#ff85cd'; 
                    }
                }

                if (vipRealLevel > 0 && userProfile.vipExpiresAt) {
                    const now = new Date();
                    const expires = new Date(userProfile.vipExpiresAt);
                    const diffTime = expires - now;
                    const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diasRestantes > 0) {
                        txtValidade = `(Vence em ${diasRestantes} dias)`;
                    } else {
                        txtVip = "⚠️ Expirado"; colorAccent = '#ED4245'; txtValidade = "";
                    }
                } else if (vipRealLevel > 0) {
                    txtValidade = `(Plano Vitalício)`;
                }

                const saldoFormatado = (userProfile.hypeCash || 0).toLocaleString('pt-BR');

                const cColor1 = userProfile.customVipColor1 || null;
                const cColor2 = userProfile.customVipColor2 || null;

                const { generateHypeCard } = require('../../../utils/canvasCard');
                const cardBuffer = await generateHypeCard(targetUser, userProfile.cardNumber, saldoFormatado, vipRealLevel, txtVip, txtValidade, cColor1, cColor2);
                
                const attachment = new AttachmentBuilder(cardBuffer, { name: 'hypecard.png' });
                const embed = new EmbedBuilder().setColor(cColor1 || colorAccent).setImage('attachment://hypecard.png');

                const components = [];
                if (targetUser.id === message.author.id) {
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('eco_user_store').setLabel('Lojinha Hype').setStyle(ButtonStyle.Primary).setEmoji('🛒'),
                        new ButtonBuilder().setCustomId('btn_vip_cor').setLabel('🎨 Cor do Cartão VIP').setStyle(ButtonStyle.Success).setEmoji('🎁'),
                        new ButtonBuilder().setCustomId('eco_user_config').setLabel('Poderes VIP').setStyle(ButtonStyle.Secondary).setEmoji('💎')
                    );
                    components.push(row);
                }

                await loadingMsg.edit({ content: `**💎╺╸Acesso VIP** de <@${targetUser.id}>`, embeds: [embed], files: [attachment], components: components });

            } catch (error) {
                console.error('❌ Erro ao abrir hvip:', error);
                await loadingMsg.edit('❌ Erro de sistema ao gerar o teu Cartão Hype. Tenta novamente.');
            }
        }

 // ==========================================
        // 📋 COMANDO: hcontratos (Missões Diárias Canvas)
        // ==========================================
        if (command === 'contratos' || command === 'sindicato') {
            const userId = message.author.id;
            const { gerarContratosDiarios } = require('../../../utils/contratosEngine'); 
            const { generateContratosImage } = require('../../../utils/canvasContratos');

            let userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            if (!userProfile) userProfile = await prisma.hypeUser.create({ data: { id: userId } });

            const now = new Date();
            const lastDate = userProfile.lastContrato ? new Date(userProfile.lastContrato) : null;
            const isSameDay = lastDate && lastDate.getDate() === now.getDate() && lastDate.getMonth() === now.getMonth() && lastDate.getFullYear() === now.getFullYear();

            if (args[0] === 'entregar') {
                if (!userProfile.contratosData) return message.reply('❌╺╸Você não tem contratos ativos hoje.');
                const contratos = typeof userProfile.contratosData === 'string' ? JSON.parse(userProfile.contratosData) : userProfile.contratosData;
                const todosCompletos = contratos.every(c => c.completed);

                if (!todosCompletos) return message.reply('❌╺╸Você ainda não terminou todos os trabalhos de hoje. Vá terminar o serviço!');

                await prisma.hypeUser.update({
                    where: { id: userId },
                    data: { maletas: { increment: 1 }, contratosData: null }
                });
                return message.reply('💼╺╸**TRABALHO FEITO!** O Sindicato reconheceu seu esforço. Você recebeu **1x Maleta Criptografada**!\n*(Vá na `hmochila` para vê-la e use `habrir maleta` para resgatar seu pagamento)*');
            }

            if (!isSameDay || !userProfile.contratosData) {
                const novosContratos = gerarContratosDiarios();
                userProfile = await prisma.hypeUser.update({
                    where: { id: userId },
                    data: { contratosData: novosContratos, lastContrato: now }
                });
                await message.channel.send(`📞╺╸*O telefone toca...* "Temos novos serviços pra você hoje, <@${userId}>."`);
            }

            const loadingMsg = await message.reply('📋╺╸**A puxar a sua ficha no Sindicato...**');
            try {
                const contratos = typeof userProfile.contratosData === 'string' ? JSON.parse(userProfile.contratosData) : userProfile.contratosData;
                const imageBuffer = await generateContratosImage(message.author, contratos);
                const attachment = new AttachmentBuilder(imageBuffer, { name: 'contratos.png' });

                await loadingMsg.edit({ content: '', files: [attachment] });
            } catch (err) {
                console.error(err);
                await loadingMsg.edit('❌ Erro ao gerar a prancheta de contratos.');
            }
            return;
        }

        // ==========================================
        // 🎒 COMANDO: hmochila / hinventario (Canvas)
        // ==========================================
        if (command === 'mochila' || command === 'inv' || command === 'inventario') {
            const userId = message.author.id;
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            if (!userProfile) return message.reply('❌╺╸Você não tem perfil.');

            const loadingMsg = await message.reply('🎒╺╸**A abrir a mochila tática...**');
            try {
                const { generateMochilaImage } = require('../../../utils/canvasMochila');
                const imageBuffer = await generateMochilaImage(message.author, userProfile);
                const attachment = new AttachmentBuilder(imageBuffer, { name: 'mochila.png' });

                await loadingMsg.edit({ content: '', files: [attachment] });
            } catch (err) {
                console.error(err);
                await loadingMsg.edit('❌ Erro ao gerar a sua mochila visual.');
            }
            return;
        }
        // ==========================================
        // ⚔️ COMANDO: husar (Equipar itens da mochila)
        // ==========================================
        if (command === 'usar' || command === 'equipar') {
            const item = args[0]?.toLowerCase();
            if (!item) return message.reply('❌╺╸Especifique o item! Ex: `husar colete`, `husar pecabra`, `husar disfarce`');

            const userId = message.author.id;
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            if (!userProfile) return;

            if (item === 'colete') {
                if (userProfile.invColetes <= 0) return message.reply('❌╺╸Você não tem Coletes na mochila. Compre na `hloja`.');
                const exp = new Date(Date.now() + 15 * 60 * 1000);
                await prisma.hypeUser.update({
                    where: { id: userId },
                    data: { invColetes: { decrement: 1 }, coleteExp: exp }
                });
                return message.reply('🛡️╺╸**Colete Equipado!** Você está imune a roubos nos próximos 15 minutos.');
            }
if (item === 'lanterna') {
                if (userProfile.invLanternas <= 0) return message.reply('❌╺╸Você não tem Lanternas na mochila. Compre na `hloja`.');
                
                // Em vez de alterar o banco, apenas ensina o jogador a usar do jeito novo e correto!
                return message.reply('🔦╺╸A **Lanterna Tática** não precisa ser equipada aqui! Inicie um jogo de `hmines` e clique no botão azul **[ 🔦 REVELAR  ]** para gastar o item e rastrear os explosivos na hora.');
            
    // Define um status temporário no banco para o próximo jogo de mines
    await prisma.hypeUser.update({
        where: { id: userId },
        data: { 
            invLanternas: { decrement: 1 },
            activeLanterna: true // Adicione este booleano no prisma se quiser rastrear o uso
        }
    });
    return message.reply('🔦╺╸**Lanterna Tática Ligada!** No seu próximo `hmines`, 3 setores serão escaneados automaticamente.');
}

            if (item === 'pecabra' || item === 'pedecabra' || item === 'pe'| item === 'pédecabra'| item === 'pé'| item === 'cabra') {
                if (userProfile.invPedeCabra <= 0) return message.reply('❌╺╸Você não tem Pé de Cabra na mochila. Compre na `hloja`.');
                const exp = new Date(Date.now() + 15 * 60 * 1000);
                await prisma.hypeUser.update({
                    where: { id: userId },
                    data: { invPedeCabra: { decrement: 1 }, peDeCabraExp: exp }
                });
                return message.reply('🔨╺╸**Pé de Cabra em mãos!** Suas chances de sucesso em assaltos aumentaram em 15% por 15 minutos.');
            }

            if (item === 'disfarce') {
                if (userProfile.invDisfarces <= 0) return message.reply('❌╺╸Você não tem Kits de Disfarce na mochila. Compre na `hloja`.');
                await prisma.hypeUser.update({
                    where: { id: userId },
                    data: { invDisfarces: { decrement: 1 }, disfarceUses: { increment: 3 } }
                });
                return message.reply('🎭╺╸**Disfarce Colocado!** Você tem 50% de redução nas próximas **3 multas** policiais que sofrer.');
            }

            return message.reply('❌╺╸Item não reconhecido ou você digitou errado.');
        }

        // ==========================================
        // 🎁 COMANDO: habrir (Lootbox da Maleta)
        // ==========================================
        if (command === 'abrir') {
            const item = args[0]?.toLowerCase();
            if (item === 'maleta' || item === 'mala') {
                const userId = message.author.id;
                const userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
                if (!userProfile || userProfile.maletas <= 0) return message.reply('❌╺╸Você não tem Maletas do Sindicato na mochila. Use `hcontratos` para ganhar uma!');

                // Sistema de Sorteio (Lootbox)
                const roll = Math.random();
                let premioTxt = '';
                const updateData = { maletas: { decrement: 1 } };

                if (roll <= 0.01) { // 1% Mítico
                    updateData.hypeCash = { increment: 2000000 };
                    premioTxt = '✨ **MÍTICO!** R$ 2.000.000 limpos depositados no seu Banco Central!';
                } else if (roll <= 0.05) { // 4% Lendário
                    updateData.carteira = { increment: 1000000 };
                    premioTxt = '🌟 **LENDÁRIO!** R$ 1.000.000 vivos na Carteira!';
                } else if (roll <= 0.15) { // 10% Raro
                    updateData.carteira = { increment: 500000 };
                    premioTxt = '💎 **RARO!** R$ 500.000 entregues na sua Carteira!';
                } else if (roll <= 0.40) { // 25% Incomum (Itens da Loja)
                    updateData.invColetes = { increment: 2 };
                    updateData.invPedeCabra = { increment: 1 };
                    premioTxt = '📦 **INCOMUM!** Recebeu 2x Coletes Balísticos e 1x Pé de Cabra na mochila!';
                } else { // 60% Comum
                    const valor = Math.floor(Math.random() * (200000 - 50000 + 1)) + 50000;
                    updateData.hypeCash = { increment: valor };
                    premioTxt = `💵 **COMUM!** R$ ${valor.toLocaleString('pt-BR')} de dinheiro lavado para o seu Banco!`;
                }

                await prisma.hypeUser.update({ where: { id: userId }, data: updateData });

                return message.reply(`💼╺╸**MALETA ABERTA!**\nO código bateu e a tranca destravou. Você puxou de dentro:\n\n${premioTxt}`);
            } else {
                return message.reply('❌╺╸Especifique o que quer abrir. Ex: `habrir maleta`');
            }
        }
    }
};