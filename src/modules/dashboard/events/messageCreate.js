const { AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateProfileImage } = require('../../../utils/canvasProfile');
const { generateBlackjackTable } = require('../../../utils/canvasBlackjack');
const { generateRoletaImage } = require('../../../utils/canvasRoletaRussa');
const { generateCrashImage } = require('../../../utils/canvasCrash');
// Mapa global para guardar as mesas ativas por canal da Roleta Russa
const ActiveTables = new Map();
module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        // Ignora bots e mensagens sem o prefixo H (h ou H)
        if (message.author.bot || !message.content.toLowerCase().startsWith('h')) return;
        if (!client.activeRoleta) client.activeRoleta = ActiveTables;

        // Separa o comando dos argumentos
        const args = message.content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();
// ==========================================
        // 🎰 GAME: Tigrinho (htigrinho)
        // ==========================================
        if (command === 'tigrinho' || command === 'tiger') {
            const betInput = args[0];

            if (!betInput) return message.reply('❌ **Uso correto:** `htigrinho <valor>` ou `htigrinho all`.');

            const userId = message.author.id;
            let userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            if (!userProfile) return message.reply('❌ Ainda não tens um perfil registado.');

            let aposta = betInput.toLowerCase() === 'all' ? userProfile.carteira : parseInt(betInput.replace(/k/g, '000').replace(/\./g, ''));
            if (isNaN(aposta) || aposta <= 0) return message.reply('❌ Valor de aposta inválido.');
            if (userProfile.carteira < aposta) return message.reply(`❌ Não tens **R$ ${aposta.toLocaleString('pt-BR')}** na carteira!`);

            if (userProfile.lastGame && (Date.now() - new Date(userProfile.lastGame).getTime() < 5000)) {
                return message.reply('⏳ A máquina está a ser reiniciada! Aguarda 5 segundos.');
            }

            // Desconta o dinheiro da CARTEIRA
            await prisma.hypeUser.update({
                where: { id: userId },
                data: { carteira: { decrement: aposta }, lastGame: new Date() }
            });

// Dá uma indicação rápida e APAGA-A de seguida
            const loadingMsg = await message.reply('🎰 A montar a máquina do Tigrinho...');

            try {
                await loadingMsg.delete().catch(() => {});

                const cassinoEngine = require('../../economy/components/cassino_tigrinho_engine');
                
                // Passamos o CANAL diretamente. O Engine vai criar a mensagem visual pura!
                // (canal, autor, client, aposta, isAuto, mensagemAntiga)
                await cassinoEngine.run(message.channel, message.author, client, aposta, false, null);

            } catch (error) {
                console.error('Erro no Tigrinho Prefix:', error);
                message.channel.send('❌ Ocorreu um erro na máquina.').catch(() => {});
            }
        }
        // ==========================================
        // 💣 GAME: Mines (hmines)
        // ==========================================
        if (command === 'mines') {
            const betInput = args[0];

            if (!betInput) return message.reply('❌ **Uso correto:** `hmines <valor>` ou `hmines all`.');

            const userId = message.author.id;
            let userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            if (!userProfile) return message.reply('❌ Ainda não tens um perfil registado.');

            let betAmount = betInput.toLowerCase() === 'all' ? userProfile.carteira : parseInt(betInput.replace(/k/g, '000').replace(/\./g, ''));
            if (isNaN(betAmount) || betAmount <= 0) return message.reply('❌ Valor de aposta inválido.');
            if (userProfile.carteira < betAmount) return message.reply(`❌ Não tens **R$ ${betAmount.toLocaleString('pt-BR')}** na carteira!`);

            if (userProfile.lastGame && (Date.now() - new Date(userProfile.lastGame).getTime() < 5000)) {
                return message.reply('⏳ Estão a plantar as bombas! Aguarda 5 segundos.');
            }

            // Cobra a Aposta da CARTEIRA
            await prisma.hypeUser.update({
                where: { id: userId },
                data: { carteira: { decrement: betAmount }, lastGame: new Date() }
            });

            // Lógica do Grid
            const totalTiles = 20;
            const bombCount = 3;
            let grid = Array(totalTiles).fill('gem');
            for (let i = 0; i < bombCount; i++) { grid[i] = 'bomb'; }
            
            for (let i = grid.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [grid[i], grid[j]] = [grid[j], grid[i]];
            }

            if (!client.activeMines) client.activeMines = new Map();
            client.activeMines.set(userId, { bet: betAmount, bombs: bombCount, grid: grid, clicked: [], hits: 0 });

            // Importa as ferramentas da V2
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

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`eco_mines_cashout_${userId}`).setLabel('💰 Retirar Lucro (R$ 0)').setStyle(ButtonStyle.Success).setDisabled(true)
            );
            rows.push(actionRow);

            const { MessageFlags } = require('discord.js');
            return message.reply({ components: [container, ...rows], flags: [MessageFlags.IsComponentsV2] });
        }

        // ==========================================
        // 🔫 GAME: Roleta Russa (hroleta)
        // ==========================================
        if (command === 'roleta' || command === 'roletarussa') {
            const betInput = args[0];
            const canalId = message.channel.id;

            if (!betInput) return message.reply('❌ **Uso correto:** `hroleta <valor_entrada>` (Ex: `hroleta 5k`)');

            if (client.activeRoleta.has(canalId)) {
                return message.reply('❌ Já existe uma mesa de Roleta Russa aberta neste canal! Esperem o jogo acabar.');
            }

            let valorAposta = parseInt(betInput.replace(/k/g, '000').replace(/\./g, ''));
            if (isNaN(valorAposta) || valorAposta < 100) return message.reply('❌ A aposta mínima para abrir a mesa é de **R$ 100**.');

            const dono = message.author;
            
            // Verifica se o dono tem o valor (embora ele só pague ao clicar)
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: dono.id } });
            if (!userProfile || userProfile.carteira < valorAposta) {
                return message.reply(`❌ Você não tem **R$ ${valorAposta.toLocaleString('pt-BR')}** na carteira para garantires a tua cadeira.`);
            }

            const donoData = {
                id: dono.id,
                username: dono.username,
                avatarBuffer: dono.displayAvatarURL({ extension: 'png', size: 128 }),
                isDead: false
            };

            const mesa = {
                donoId: dono.id,
                valorAposta: valorAposta,
                pot: 0, 
                players: [donoData], 
                estado: 'lobby'
            };
            client.activeRoleta.set(canalId, mesa);

            const loadingMsg = await message.reply('🔫 A montar a mesa do submundo...');

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
                console.error('❌ Erro a gerar Lobby da Roleta:', error);
                client.activeRoleta.delete(canalId); 
                await loadingMsg.edit('❌ Erro a montar a mesa.');
            }
        }
        // ==========================================
        // 🎭 MÓDULO SOCIAL (Cooldown 20m por Comando)
        // ==========================================
        const gifs = {
            beijar: [
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnh1dWhnczlzNWpwbWE3M3g4M3U1Nm5iNzNpZDU2aHR3ODU4Z2pnMyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/11rWoZNpAKw8w/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN21nMGkwYzlyZXkwbDkzbXdxcjNsbjQwbmp5MnN5NW96ZTF2dXV0aCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/MQVpBqASxSlFu/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN21nMGkwYzlyZXkwbDkzbXdxcjNsbjQwbmp5MnN5NW96ZTF2dXV0aCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/G3va31oEEnIkM/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN21nMGkwYzlyZXkwbDkzbXdxcjNsbjQwbmp5MnN5NW96ZTF2dXV0aCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/zkppEMFvRX5FC/giphy.gif'
            ],
            tapa: [
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ2dzejhqM2tlNTlwbHJuZTFhd3FkajgwMmFlNTZwOHFrcnUybnVuZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Gf3AUz3eBNbTW/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ2dzejhqM2tlNTlwbHJuZTFhd3FkajgwMmFlNTZwOHFrcnUybnVuZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/vxvNnIYFcYqEE/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ2dzejhqM2tlNTlwbHJuZTFhd3FkajgwMmFlNTZwOHFrcnUybnVuZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Zau0yrl17uzdK/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ2dzejhqM2tlNTlwbHJuZTFhd3FkajgwMmFlNTZwOHFrcnUybnVuZiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/RXGNsyRb1hDJm/giphy.gif'
            ],
            abracar: [
                'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Mnp5MjdicWhsbzIwdjJzaGlidjd3bDhqNW5mc3lnc3hmbHdqOWx5NSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/od5H3PmEG5EVq/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3Mnp5MjdicWhsbzIwdjJzaGlidjd3bDhqNW5mc3lnc3hmbHdqOWx5NSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/m2GGGWxexjwqnHQnZI/giphy.gif',
                'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2w4cGE1Z3MzdHpxOXFxcDJiZ2xsMXU3NnVhbDF2ZTIxNW5uZ3FuNyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/m2GGGWxexjwqnHQnZI/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNTlrbmFheGhrNWpmaWRvNmJwc2hnMDN6NHJ6emlnZXRhZWV3a2EzNiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/GMFUrC8E8aWoo/giphy.gif'
            ],
            morder: [
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZzB4eGVleW9kOG53NzZsOTBsNWJtdHlta2V2NXdiMGRvZzJzY3F2aiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/OqQOwXiCyJAmA/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZzB4eGVleW9kOG53NzZsOTBsNWJtdHlta2V2NXdiMGRvZzJzY3F2aiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/lrMUMn9lnpaJDsvP0u/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZzB4eGVleW9kOG53NzZsOTBsNWJtdHlta2V2NXdiMGRvZzJzY3F2aiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/APdrBsVpWQmv6/giphy.gif'
            ],
            // 👇 NOVAS INTERAÇÕES ADICIONADAS
            chutar: [
                'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bXNtNHo4c2pkcmV0YTZhaHdmZGp0dGNubGszcGFzNmNsajI1NXd3cSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/u2LJ0n4lx6jF6/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3eXg4bzEwa3Q1NmJlbnFlYzlrbXJlM2g4cm55dm1xbjJkMW44cWcwMCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3IRa7BlrVTK1BBFWtx/giphy.gif'
            ],

            dancar: [
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTZ4YXBnOGw4czRhdXQwYmc3ZzlkeG5vdmdzdG1ldzZ6Mnc0dWZrYSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/j93ycvEyWlSIIg8AEl/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTZ4YXBnOGw4czRhdXQwYmc3ZzlkeG5vdmdzdG1ldzZ6Mnc0dWZrYSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Ut0KxC3gnIwcEpmTZW/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTZ4YXBnOGw4czRhdXQwYmc3ZzlkeG5vdmdzdG1ldzZ6Mnc0dWZrYSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/NtxYZwjMr0HOYbbfeG/giphy.gif'
            ],
            brindar: [
                'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3ZWdjZzVubXc1YWFrbjBxdG5pcHhqd2JhbjZjNHQ5Z3kyMWk0dXM5cCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o8doUgvKWu2JP0hvG/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3bXdvcWgyN3NzYzBnd243Zmo1Ymdpd2pmenA4emZhZHRtYWtkOTZkNSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/wy63WPXSamvFC/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3d3EzMTY1OXdiYXpxZ3Q2cGZ2aHgybmIwcmczaGJia3MyaXV6N29pciZlcD12MV9naWZzX3NlYXJjaCZjdD1n/YZjHGZdwdBMfS/giphy.gif'
            ],
            pat: [
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjYzYWx1bDFuampvb3NxMXllYXQ0OHVjOG5pbDZlZWJvZG9obTZuaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/5tmRHwTlHAA9WkVxTU/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjYzYWx1bDFuampvb3NxMXllYXQ0OHVjOG5pbDZlZWJvZG9obTZuaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/u9BxQbM5bxvwY/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjYzYWx1bDFuampvb3NxMXllYXQ0OHVjOG5pbDZlZWJvZG9obTZuaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/L2z7dnOduqEow/giphy.gif'
            ],
            socar: [
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYngwbjU1ODdrcGl3bzBnaDc5NzBoZHdpeTAzaXY3M2o2ODFub3MxcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/yo3TC0yeHd53G/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYngwbjU1ODdrcGl3bzBnaDc5NzBoZHdpeTAzaXY3M2o2ODFub3MxcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/11HeubLHnQJSAU/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYngwbjU1ODdrcGl3bzBnaDc5NzBoZHdpeTAzaXY3M2o2ODFub3MxcyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/arbHBoiUWUgmc/giphy.gif'
            ],
            cafune: [
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeGpvdmVlNnJ0amp1d2o5eG44ZmoxOTVuZ2dvYnU3bmUwdDJyeDM4MCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/SPCwSrGf9kVt6/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3OWRrb2t6M2F0NjJpZjNxNDkweWxjMGs5eDFsdnlrdTJqYmFqNWswNyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/NB0MtUxFyMmRi/giphy.gif'
            ]
        };

        const socialCommands = {
            'beijar': { verb: 'deu um beijo apaixonado em', type: 'beijar', emoji: '💋' },
            'tapa': { verb: 'deu um tapa bem dado na cara de', type: 'tapa', emoji: '🖐️' },
            'abracar': { verb: 'deu um abraço bem apertado em', type: 'abracar', emoji: '🫂' },
            'abraçar': { verb: 'deu um abraço bem apertado em', type: 'abracar', emoji: '🫂' },
            'morder': { verb: 'deu uma mordida em', type: 'morder', emoji: '🧛' },
            'pat': { verb: 'fez um carinho fofo na cabeça de', type: 'pat', emoji: '🥰' },
            'socar': { verb: 'deu um soco com toda a força na cara de', type: 'socar', emoji: '🥊' },
            'cafune': { verb: 'fez um cafuné gostoso em', type: 'cafune', emoji: '💆' },
            'cafuné': { verb: 'fez um cafuné gostoso em', type: 'cafune', emoji: '💆' },
            'chutar': { verb: 'deu um chute bem dado na canela de', type: 'chutar', emoji: '🥾' },
            'chute': { verb: 'deu um chute bem dado na canela de', type: 'chutar', emoji: '🥾' },
            'dancar': { verb: 'puxou para dançar com muito estilo', type: 'dancar', emoji: '💃' },
            'dançar': { verb: 'puxou para dançar com muito estilo', type: 'dancar', emoji: '💃' },
            'brindar': { verb: 'brindou uma taça de champanhe com', type: 'brindar', emoji: '🥂' }
        };

        if (socialCommands[command]) {
            const action = socialCommands[command];
            const authorId = message.author.id;
            const targetUser = message.mentions.users.first();

            // 1. Verificações Básicas
            if (!targetUser) return message.reply(`❌ Tem de mencionar alguém! Exemplo: \`h${command} @usuario\``);
            if (targetUser.id === authorId) return message.reply(`❌ Não pode fazer isso a vc mesmo(a)! Tente em outra pessoa!`);
            if (targetUser.bot) return message.reply(`😳 Eh lá... eu sou apenas um bot ! Mas agradeço a intenção.`);

            // 2. Busca o utilizador no Banco de Dados
            let userProfile = await prisma.hypeUser.findUnique({ where: { id: authorId } });
            
            // 3. Verifica Cooldown
            const columnString = 'last' + action.type.charAt(0).toUpperCase() + action.type.slice(1);
            const cooldownTime = 20 * 60 * 1000;
            if (userProfile && userProfile[columnString]) {
                const now = new Date().getTime();
                const lastTime = new Date(userProfile[columnString]).getTime();

                if (now - lastTime < cooldownTime) {
                    const timeLeft = Math.ceil((cooldownTime - (now - lastTime)) / 1000);
                    const minutes = Math.floor(timeLeft / 60);
                    const seconds = timeLeft % 60;
                    return message.reply(`⏳ **Descansa a mão!** Já usou o \`h${command}\` há pouco tempo.\nPode usá-lo de novo em **${minutes}m e ${seconds}s**.`);
                }
            }

// 💎 LÓGICA VIP (PROBABILIDADE & MULTIPLICADOR - PADRÃO ESCASSO)
            const vipLevel = userProfile?.vipLevel || 0;
            
            // Define o multiplicador manualmente (como no Cofre VIP)
            let vipMultiplier = 1.0;
            if (vipLevel === 1) vipMultiplier = 1.5;
            else if (vipLevel === 2) vipMultiplier = 2.0;
            else if (vipLevel === 3) vipMultiplier = 3.0;
            else if (vipLevel >= 4) vipMultiplier = 5.0;
            else if (vipLevel >= 5) vipMultiplier = 5.0;

            // Chance de falha diminui com VIP (VIP 3 ou superior nunca falha)
            const failChance = Math.max(0, 0.30 - (vipLevel * 0.10));
            const isSuccess = Math.random() > failChance; 

            // Recompensa Base (Baixa para dificultar: 150 a 500)
            const baseReward = Math.floor(Math.random() * (500 - 150 + 1)) + 150;
            const rewardAmount = isSuccess ? Math.floor(baseReward * vipMultiplier) : 0;
            // 4. Salva no Banco
            const updateData = { carteira: { increment: rewardAmount } };
            updateData[columnString] = new Date(); 
            
            const createData = { id: authorId, carteira: rewardAmount };
            createData[columnString] = new Date();

            await prisma.hypeUser.upsert({
                where: { id: authorId },
                update: updateData,
                create: createData
            });

            // 5. Mensagens de Esquiva (Falha)
            if (!isSuccess) {
                let failMsg = '';
                if (action.type === 'beijar') failMsg = `Opa! <@${targetUser.id}> fez um movimento de mestre e você acabou beijando o vento! 🌬️💋`;
                else if (action.type === 'tapa') failMsg = `<@${targetUser.id}> ativou o modo Instinto Superior e desviou do seu tapa com estilo! 💨✋`;
                else if (action.type === 'abracar') failMsg = `<@${targetUser.id}> deu um passinho pro lado e você abraçou o ar! Que abraço fantasmagórico... 👻🫂`;
                else if (action.type === 'morder') failMsg = `<@${targetUser.id}> foi mais rápido e você quase mordeu a própria língua! Cuidado com os dentes! 🦷🧛`;
                else if (action.type === 'pat') failMsg = `<@${targetUser.id}> deu uma de ninja e escapou do carinho! Fica pra próxima... 🐈💨`;
                else if (action.type === 'socar') failMsg = `UOU! <@${targetUser.id}> fez uma esquiva digna de cinema e o seu soco passou direto! 🥊🎥`;
                else if (action.type === 'cafune') failMsg = `<@${targetUser.id}> deu uma abaixadinha e você acabou fazendo cafuné no vazio! 💆‍♂️☁️`;

                return message.reply(`✨ **QUASE!**\n${failMsg}\n*(O tempo de descanso foi ativado, tente novamente em breve!)*`);
            }

            // 6. Sucesso
            const randomGif = gifs[action.type][Math.floor(Math.random() * gifs[action.type].length)];
            const attachment = new AttachmentBuilder(randomGif, { name: 'animacao.gif' });
            
            let extraMsg = vipLevel > 0 ? `\n💎 **Bónus VIP Nível ${vipLevel}:** \`x${vipMultiplier}\` Aplicado!` : '';

            return message.reply({ 
                content: `${action.emoji} | <@${authorId}> **${action.verb}** <@${targetUser.id}>!\n\n💸 **VOCÊ GANHOU:**  **R$ ${rewardAmount.toLocaleString('pt-BR')}** (Caiu na tua Carteira!)${extraMsg}`, 
                files: [attachment] 
            });
        }

// ==========================================
        // 📋 COMANDO: htempo / hcd (Painel Completo)
        // ==========================================
        if (command === 'tempo' || command === 'cd' || command === 'cooldowns') {
            const userId = message.author.id;
            let userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            
            if (!userProfile) {
                return message.reply('❌ Ainda não tens um perfil registado. Usa o `hcarteira` para começares a jogar!');
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
            
            // Bloco de Economia / Salários
            desc += makeLine('Diário', userProfile.lastDaily, dailyCD) + '\n';
            desc += makeLine('Semanal', userProfile.lastSemanal, semanalCD) + '\n';
            desc += makeLine('Mensal', userProfile.lastMensal, mensalCD) + '\n\n';
            desc += makeLine('Roubar', userProfile.lastRob, 10 * 60 * 1000) + '\n';
            
            // Bloco de Interações RP Antigas
            desc += makeLine('Beijar', userProfile.lastBeijar, socialCD) + '\n';
            desc += makeLine('Abraçar', userProfile.lastAbracar, socialCD) + '\n';
            desc += makeLine('Cafuné', userProfile.lastCafune, socialCD) + '\n';
            desc += makeLine('Socar', userProfile.lastSocar, socialCD) + '\n';
            desc += makeLine('Morder', userProfile.lastMorder, socialCD) + '\n';
            desc += makeLine('Tapa', userProfile.lastTapa, socialCD) + '\n';
            
            // 👇 NOVAS INTERAÇÕES ADICIONADAS AQUI
            desc += makeLine('Chutar', userProfile.lastChutar, socialCD) + '\n';
            desc += makeLine('Dançar', userProfile.lastDancar, socialCD) + '\n';
            desc += makeLine('Brindar', userProfile.lastBrindar, socialCD) + '\n';

            const embed = new EmbedBuilder()
                .setColor('#0000FF')
                .setAuthor({ name: `⏰ Cooldown's de ${message.author.username}` })
                .setDescription(desc)
                .setThumbnail('https://cdn-icons-png.flaticon.com/512/3103/3103306.png')
                .setFooter({ text: 'O tempo passa devagar, não é? ⏳', iconURL: message.author.displayAvatarURL({ dynamic: true }) });

            return message.reply({ embeds: [embed] });
        }

if (command === 'loja' || command === 'mercado') {
            const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
            const { generateShopCatalog } = require('../../../utils/canvasLoja');
            
            const loadingMsg = await message.reply('🔍 Entrando na Deep Web...');

            try {
                const imageBuffer = await generateShopCatalog();
                const attachment = new AttachmentBuilder(imageBuffer, { name: 'loja.png' });

                const select = new StringSelectMenuBuilder()
                    .setCustomId(`eco_shop_buy_${message.author.id}`)
                    .setPlaceholder('Escolha o item que deseja comprar...')
.addOptions(
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Colete Balístico')
                            .setDescription('R$ 10.000 - Imunidade a roubos (15min)')
                            .setEmoji('🛡️')
                            .setValue('colete'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Pé de Cabra')
                            .setDescription('R$ 10.000 - Buff de roubo (15min)')
                            .setEmoji('🔨')
                            .setValue('pecabra'),
                        new StringSelectMenuOptionBuilder()
                            .setLabel('Kit de Disfarce')
                            .setDescription('R$ 15.000 - 50% de desconto em 3 multas')
                            .setEmoji('🎭')
                            .setValue('disfarce')
                    );

                const row = new ActionRowBuilder().addComponents(select);

                await loadingMsg.delete().catch(() => {});
                return message.channel.send({ 
                    content: `📦 **Mercado Negro aberto para <@${message.author.id}>**`, 
                    files: [attachment], 
                    components: [row] 
                });

            } catch (error) {
                console.error(error);
                await loadingMsg.edit('❌ O fornecedor desapareceu nas sombras.');
            }
        }
 // ==========================================
        // 🎲 COMANDO: hap / hapostar (Sistema de Apostas)
        // ==========================================
        if (command === 'ap' || command === 'apostar') {
            const betValueStr = args[0]?.toLowerCase();
            
            // 1. Tenta pegar a menção normal (@usuario)
            let targetUser = message.mentions.users.first();

            // 2. Se não mencionou ninguém, verifica se está a RESPONDER a uma mensagem (A Mágica da UX)
            if (!targetUser && message.reference) {
                try {
                    const repliedMsg = await message.channel.messages.fetch(message.reference.messageId);
                    if (repliedMsg) targetUser = repliedMsg.author;
                } catch (e) {
                    // Ignora o erro se a mensagem original foi apagada
                }
            }

            if (!betValueStr) {
                return message.reply('❌ **Como usar:**\n1️⃣ `hap <valor>` - Cria uma aposta global no chat.\n2️⃣ `hap <valor> @usuario` (Ou responda à mensagem dele) - Desafia para 1v1.');
            }

            const userProfile = await prisma.hypeUser.findUnique({ where: { id: message.author.id } });
            if (!userProfile || userProfile.carteira <= 0) {
                return message.reply('❌ Você não tem dinheiro na carteira para apostar!');
            }

            let amount = 0;
            if (betValueStr === 'all' || betValueStr === 'tudo') {
                amount = userProfile.carteira;
            } else {
                // Converte "1k" para 1000, e filtra apenas números
                amount = parseInt(betValueStr.replace(/k/g, '000').replace(/[^\d]/g, ''));
            }

            if (isNaN(amount) || amount <= 0) return message.reply('❌ Valor de aposta inválido!');
            if (amount > userProfile.carteira) return message.reply(`❌ Você só tem **R$ ${userProfile.carteira.toLocaleString('pt-BR')}** na mão! Vá ao banco sacar mais se quiser apostar isso.`);

            // ==========================================
            // ⚔️ MODO 1: APOSTA 1v1 (Menção ou Resposta)
            // ==========================================
            if (targetUser) {
                if (targetUser.id === message.author.id) return message.reply('❌ Você não pode apostar contra si mesmo! Tá maluco?');
                if (targetUser.bot) return message.reply('🤖 Eu sou a banca, não um jogador. Tente outro.');

                const targetProfile = await prisma.hypeUser.findUnique({ where: { id: targetUser.id } });
                if (!targetProfile || targetProfile.carteira < amount) {
                    return message.reply(`❌ O <@${targetUser.id}> está falido! Ele não tem **R$ ${amount.toLocaleString('pt-BR')}** na carteira para cobrir a aposta.`);
                }

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('hap_accept').setLabel('Aceitar').setStyle(ButtonStyle.Success).setEmoji('✅'),
                    new ButtonBuilder().setCustomId('hap_deny').setLabel('Recusar').setStyle(ButtonStyle.Danger).setEmoji('✖️')
                );

                const msg = await message.reply({
                    content: `⚔️ **DESAFIO MORTAL!**\n<@${targetUser.id}>, o magnata <@${message.author.id}> te desafiou para um "Cara ou Coroa" apostando **R$ ${amount.toLocaleString('pt-BR')}** da carteira!\n\n⏳ Você tem **15 segundos** para aceitar ou correr.`,
                    components: [row]
                });

                // Filtro para garantir que só o alvo pode clicar nos botões
                const filter = i => i.user.id === targetUser.id;
                const collector = msg.createMessageComponentCollector({ filter, time: 15000 });

                collector.on('collect', async i => {
                    // Checagem anti-fraude: Verifica o saldo na hora exata do clique
                    const [p1, p2] = await Promise.all([
                        prisma.hypeUser.findUnique({ where: { id: message.author.id } }),
                        prisma.hypeUser.findUnique({ where: { id: targetUser.id } })
                    ]);

                    if (p1.carteira < amount) return i.reply({ content: `❌ <@${message.author.id}> gastou o dinheiro antes da aposta começar! Aposta anulada.`, flags: [MessageFlags.Ephemeral] });
                    if (p2.carteira < amount) return i.reply({ content: `❌ Você não tem mais esse dinheiro na carteira!`, flags: [MessageFlags.Ephemeral] });

                    if (i.customId === 'hap_deny') {
                        collector.stop('denied');
                        return i.update({ content: `💨 <@${targetUser.id}> amarelou e recusou a aposta de **R$ ${amount.toLocaleString('pt-BR')}**! A carteira dele está a salvo (mas o orgulho não).`, components: [] });
                    }

                    if (i.customId === 'hap_accept') {
                        collector.stop('accepted');
                        await i.deferUpdate();

                        // Desconta o dinheiro de ambos (Usando Transaction para ser à prova de falhas)
                        await prisma.$transaction([
                            prisma.hypeUser.update({ where: { id: message.author.id }, data: { carteira: { decrement: amount } } }),
                            prisma.hypeUser.update({ where: { id: targetUser.id }, data: { carteira: { decrement: amount } } })
                        ]);

                        const pot = amount * 2;
                        const winnerId = Math.random() < 0.5 ? message.author.id : targetUser.id;
                        const loserId = winnerId === message.author.id ? targetUser.id : message.author.id;

                        // Entrega o prêmio (pote completo) ao vencedor
                        await prisma.hypeUser.update({ where: { id: winnerId }, data: { carteira: { increment: pot } } });

                        const embed = new EmbedBuilder()
                            .setColor('#FEE75C')
                            .setTitle('🎲 RESULTADO: CARA OU COROA')
                            .setDescription(`A moeda girou no ar...\n\n🏆 **VENCEDOR:** <@${winnerId}>\n💸 **LEVOU:** R$ ${pot.toLocaleString('pt-BR')}\n\n💀 *<@${loserId}> perdeu R$ ${amount.toLocaleString('pt-BR')} nessa brincadeira.*`)
                            .setThumbnail('https://media.giphy.com/media/26n6WgBtzm9n5W1oY/giphy.gif');

                        await msg.edit({ content: '', embeds: [embed], components: [] });
                    }
                });

                collector.on('end', (collected, reason) => {
                    if (reason === 'time') {
                        // Remove os botões se o tempo passar e avisa
                        msg.edit({ content: `⏳ O tempo esgotou! <@${targetUser.id}> não respondeu a tempo e o desafio expirou.`, components: [] }).catch(()=>{});
                    }
                });

                return;
            }
            // 👇 NOVA TRAVA: Ignora os botões que são processados ao vivo (Coletores Inline)
                if (interaction.customId) {
                    const inlineIds = ['hap_', 'next_help', 'prev_help', 'page_indicator'];
                    if (inlineIds.some(id => interaction.customId.startsWith(id))) return;
                }            // ==========================================
            // 🌐 MODO 2: LOBBY GLOBAL (Sem Menção/Sem Resposta)
            // ==========================================
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('hap_join').setLabel('Entrar na Aposta').setStyle(ButtonStyle.Primary).setEmoji('🎲')
            );

            let participants = [message.author.id];
            let totalPot = amount;

            // Já tira o dinheiro inicial do criador para segurança
            await prisma.hypeUser.update({ where: { id: message.author.id }, data: { carteira: { decrement: amount } } });

            const embedLobby = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('🎲 MESA DE APOSTAS ABERTA!')
                .setDescription(`<@${message.author.id}> abriu um pote!\n\n💰 **Entrada:** R$ ${amount.toLocaleString('pt-BR')}\n🔥 **Prêmio Acumulado:** R$ ${totalPot.toLocaleString('pt-BR')}\n👥 **Jogadores:** ${participants.length}\n\n⏳ *A roleta roda em 30 segundos!*`)
                .setFooter({ text: 'Clique no botão abaixo para entrar e dobrar o prêmio!' });

            const msg = await message.reply({ embeds: [embedLobby], components: [row] });

            // Coletor de 30 segundos para o pessoal entrar
            const collector = msg.createMessageComponentCollector({ time: 30000 });

            collector.on('collect', async i => {
                if (i.customId === 'hap_join') {
                    if (participants.includes(i.user.id)) {
                        return i.reply({ content: '❌ Você já colocou seu dinheiro nesta mesa!', flags: [MessageFlags.Ephemeral] });
                    }

                    let pProfile = await prisma.hypeUser.findUnique({ where: { id: i.user.id } });
                    if (!pProfile || pProfile.carteira < amount) {
                        return i.reply({ content: `❌ Você não tem **R$ ${amount.toLocaleString('pt-BR')}** na carteira!`, flags: [MessageFlags.Ephemeral] });
                    }

                    // Desconta e adiciona o jogador ao lobby
                    await prisma.hypeUser.update({ where: { id: i.user.id }, data: { carteira: { decrement: amount } } });
                    
                    participants.push(i.user.id);
                    totalPot += amount;

                    embedLobby.setDescription(`<@${message.author.id}> abriu um pote!\n\n💰 **Entrada:** R$ ${amount.toLocaleString('pt-BR')}\n🔥 **Prêmio Acumulado:** R$ ${totalPot.toLocaleString('pt-BR')}\n👥 **Jogadores:** ${participants.length}\n\n⏳ *A roleta roda em breve!*`);
                    
                    await i.update({ embeds: [embedLobby] });
                }
            });

            collector.on('end', async () => {
                if (participants.length === 1) {
                    // Ninguém entrou, devolve o dinheiro ao criador da mesa
                    await prisma.hypeUser.update({ where: { id: message.author.id }, data: { carteira: { increment: amount } } });
                    return msg.edit({ content: '😔 A mesa fechou. Ninguém quis apostar e o seu dinheiro foi devolvido para a carteira.', embeds: [], components: [] }).catch(()=>{});
                }

                // Sorteia o Vencedor
                const winnerId = participants[Math.floor(Math.random() * participants.length)];
                const losers = participants.filter(id => id !== winnerId);
                
                // Entrega o Pote Gigante à carteira do vencedor
                await prisma.hypeUser.update({ where: { id: winnerId }, data: { carteira: { increment: totalPot } } });

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
                baseAmount = Math.floor(Math.random() * (25000 - 10000 + 1)) + 10000; // 10k a 25k
                embedColor = '#3498db';
            } else if (command === 'semanal') {
                cooldownTime = 7 * 24 * 60 * 60 * 1000;
                columnString = 'lastSemanal';
                nomePremio = 'Salário Semanal';
                baseAmount = Math.floor(Math.random() * (100000 - 50000 + 1)) + 50000; // 50k a 100k
                embedColor = '#57F287';
            } else if (command === 'mensal') {
                cooldownTime = 30 * 24 * 60 * 60 * 1000;
                columnString = 'lastMensal';
                nomePremio = 'Salário Mensal';
                baseAmount = Math.floor(Math.random() * (350000 - 200000 + 1)) + 200000; // 200k a 350k
                embedColor = '#FEE75C';
            }

            if (userProfile && userProfile[columnString]) {
                const now = new Date().getTime();
                const lastTime = new Date(userProfile[columnString]).getTime();

                if (now - lastTime < cooldownTime) {
                    const expireUnix = Math.floor((lastTime + cooldownTime) / 1000);
                    return message.reply(`⏳ **Calma lá, magnata!** Já recolheste o teu ${nomePremio}.\nPodes recolher de novo <t:${expireUnix}:R>.`);
                }
            }

// 💎 LÓGICA VIP (PADRÃO ESCASSO)
            const vipLevel = userProfile?.vipLevel || 0;
            
            let vipMultiplier = 1.0;
            if (vipLevel === 1) vipMultiplier = 1.5;
            else if (vipLevel === 2) vipMultiplier = 2.0;
            else if (vipLevel === 3) vipMultiplier = 3.0;
            else if (vipLevel >= 4) vipMultiplier = 5.0;
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

            let extraMsg = vipLevel > 0 ? `\n\n💎 **Bónus VIP Nível ${vipLevel}:** \`x${vipMultiplier}\` Aplicado!` : '';

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(`💰 ${nomePremio} Recolhido!`)
                .setDescription(`FFoi ao banco e levou a tua grana!\n\n💸 **Valor recebido:** R$ ${rewardAmount.toLocaleString('pt-BR')}${extraMsg}\n\n*(O dinheiro foi adicionado à tua carteira na mão. Cuidado com os roubos!)*`)
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

            return message.reply({ embeds: [embed] });
        }
        // ==========================================
        // 💸 COMANDO: hpix / hpagar / htransferir
        // ==========================================
        if (command === 'pix' || command === 'pagar' || command === 'transferir') {
            const targetUser = message.mentions.users.first();
            const amountStr = args[1]; // Exemplo de uso: hpix @usuario 5000

            if (!targetUser || !amountStr) {
                return message.reply('❌ **Uso correto:** `hpix @usuario <valor>` ou `hpix @usuario all`');
            }

            if (targetUser.id === message.author.id) {
                return message.reply('❌ Não podes fazer um Pix para ti mesmo!');
            }

            if (targetUser.bot) {
                return message.reply('❌ Bots não têm conta no Hype Bank.');
            }

            const senderId = message.author.id;
            const receiverId = targetUser.id;

            let senderProfile = await prisma.hypeUser.findUnique({ where: { id: senderId } });
            
            // Lê o valor ('all', 'k', ou número)
            let amount = parseInt(amountStr.replace(/k/g, '000').replace(/\./g, ''));
            if (amountStr.toLowerCase() === 'tudo' || amountStr.toLowerCase() === 'all') {
                amount = senderProfile?.hypeCash || 0;
            }

            if (isNaN(amount) || amount <= 0) {
                return message.reply('❌ Valor inválido para transferência.');
            }

            // Verifica se o dinheiro está no Cartão (Banco)
            if (!senderProfile || senderProfile.hypeCash < amount) {
                return message.reply(`❌ **Saldo Insuficiente!** Tu não tens **R$ ${amount.toLocaleString('pt-BR')}** no teu Cartão Hype.\nO teu saldo atual é **R$ ${(senderProfile?.hypeCash || 0).toLocaleString('pt-BR')}**.\n*(Usa o \`hdep\` para depositar o dinheiro da mão)*`);
            }

            const loadingMsg = await message.reply('🔄 A contactar o Banco Central e a verificar dados...');

            try {
                // Transação segura: Tira de um, coloca noutro. Se falhar, reverte tudo.
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

                // Gera um ID Único de Transação
                const txId = 'HYP-' + Math.random().toString(36).substring(2, 10).toUpperCase();
                
                // Gera o Comprovante Visual (Canvas)
                const { generatePixReceipt } = require('../../../utils/canvasPix');
                const imageBuffer = await generatePixReceipt(message.author, targetUser, amount, txId);
                const attachment = new AttachmentBuilder(imageBuffer, { name: 'comprovante_pix.png' });

                await loadingMsg.edit({
                    content: `✅ **PIX CONCLUÍDO!**\n<@${senderId}> transferiu **R$ ${amount.toLocaleString('pt-BR')}** diretamente para a conta de <@${receiverId}>.`,
                    files: [attachment]
                });

            } catch (error) {
                console.error('❌ Erro no PIX:', error);
                await loadingMsg.edit('❌ Ocorreu um erro no servidor do banco ao processar o teu Pix.');
            }
        }

// ==========================================
        // 🔫 COMANDO: hroubar (Assalto com Mercado Negro)
        // ==========================================
        if (command === 'roubar' || command === 'assaltar') {
            const authorId = message.author.id;
            const targetUser = message.mentions.users.first();

            if (!targetUser) return message.reply('❌ Precisas de mencionar a vítima! Exemplo: `hroubar @usuario`');
            if (targetUser.id === authorId) return message.reply('❌ Queres roubar a ti próprio? Vai ao psicólogo, não ao bot!');
            if (targetUser.bot) return message.reply('🤖 Roubar um bot? Eu não guardo notas de papel, só código!');

            let [ladrao, vitima] = await Promise.all([
                prisma.hypeUser.findUnique({ where: { id: authorId } }),
                prisma.hypeUser.findUnique({ where: { id: targetUser.id } })
            ]);

            if (!ladrao) ladrao = await prisma.hypeUser.create({ data: { id: authorId } });
            if (!vitima || vitima.carteira <= 0) {
                return message.reply(`💨 **Vácuo!** <@${targetUser.id}> não tem nem um centavo na carteira. Não vale o esforço!`);
            }

            const cooldownRoubo = 10 * 60 * 1000;
            if (ladrao.lastRob) {
                const diff = Date.now() - new Date(ladrao.lastRob).getTime();
                if (diff < cooldownRoubo) {
                    const expireUnix = Math.floor((new Date(ladrao.lastRob).getTime() + cooldownRoubo) / 1000);
                    return message.reply(`⏳ A polícia está de olho em ti! Espera até <t:${expireUnix}:R> para tentares outro assalto.`);
                }
            }
// 🛡️ VERIFICAÇÃO DO COLETE À PROVA DE BALAS (15 Minutos)
            if (vitima.coleteExp && new Date(vitima.coleteExp).getTime() > Date.now()) {
                // Aplica apenas o cooldown ao ladrão (Colete NÃO quebra, dura os 15 minutos inteiros)
                await prisma.hypeUser.update({ where: { id: authorId }, data: { lastRob: new Date() } });
                return message.reply(`🛡️ **ASSALTO BLOQUEADO!** Você tentou roubar <@${targetUser.id}>, mas ele está com um **Colete Balístico** ativo!\nO assalto falhou e a blindagem dele continua intacta. Fuja antes que a polícia chegue!`);
            }

            // 🪓 VERIFICAÇÃO DO PÉ DE CABRA
            let chanceSucesso = 0.45; // 45% Padrão
            let msgPeCabra = '';
            
            if (ladrao.peDeCabraExp && new Date(ladrao.peDeCabraExp).getTime() > Date.now()) {
                chanceSucesso += 0.15; // Sobe para 60%
                msgPeCabra = '\n🪓 *(Usou o teu Pé de Cabra para facilitar o roubo!)*';
            }

            const sorteio = Math.random();
            const sucesso = sorteio <= chanceSucesso;

            if (sucesso) {
                const porcentagemRoubada = Math.random() * (1.0 - 0.2) + 0.2;
                const valorFinal = Math.floor(vitima.carteira * porcentagemRoubada);

                await prisma.$transaction([
                    prisma.hypeUser.update({ where: { id: authorId }, data: { carteira: { increment: valorFinal }, lastRob: new Date() } }),
                    prisma.hypeUser.update({ where: { id: targetUser.id }, data: { carteira: { decrement: valorFinal } } })
                ]);

                const embed = new EmbedBuilder()
                    .setColor('#57F287')
                    .setTitle('🥷 ASSALTO BEM SUCEDIDO!')
                    .setDescription(`Passou a mão na carteira de <@${targetUser.id}> e fugiu num carro de fuga!${msgPeCabra}\n\n💸 **Levou:** R$ ${valorFinal.toLocaleString('pt-BR')}\n*(Dinheiro adicionado à tua carteira)*`)
                    .setThumbnail('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3Nndm9pZ3Nndm9pZ3Nndm9pZ3Nndm9pZ3Nndm9pZ3Nndm9pZ3Nn/3o7TKMGpxS5O7E6pW0/giphy.gif');

                return message.reply({ embeds: [embed] });

} else {
                // ==========================================
                // 🚨 SISTEMA DE MULTA & DISFARCE
                // ==========================================
                const multaBase = 50000;
                const multaPorcentagem = Math.floor(ladrao.carteira * 0.10);
                let multaFinal = Math.max(multaBase, multaPorcentagem);
                let msgDisfarce = '';

                // Verifica se o ladrão está disfarçado
                if (ladrao.disfarceUses > 0) {
                    multaFinal = Math.floor(multaFinal * 0.50); // Reduz 50%
                    const novosUsos = ladrao.disfarceUses - 1;

                    // Consome 1 uso do disfarce no banco de dados
                    await prisma.hypeUser.update({
                        where: { id: authorId },
                        data: { disfarceUses: novosUsos }
                    });

                    msgDisfarce = `\n\n🎭 **DISFARCE UTILIZADO:** Graças ao teu Kit de Disfarce, a polícia não te reconheceu totalmente! A multa foi reduzida em **50%**. (Usos restantes: **${novosUsos}**)`;
                }

                // Aplica o débito da multa e o cooldown
                await prisma.hypeUser.update({ 
                    where: { id: authorId }, 
                    data: { 
                        carteira: { decrement: ladrao.carteira >= multaFinal ? multaFinal : ladrao.carteira },
                        lastRob: new Date() 
                    } 
                });

                return message.reply(`🚨 **TE PEGARAM!** O alarme disparou e a polícia cercou o local. <@${targetUser.id}> fugiu e tiveste de pagar **R$ ${multaFinal.toLocaleString('pt-BR')}** de fiança para não seres preso!${msgDisfarce}`);
            }
        }

        // ==========================================
        // 🃏 GAME: Blackjack (hbj)
        // ==========================================
        if (command === 'blackjack' || command === 'bj') {
            const betInput = args[0];

            if (!betInput) return message.reply('❌ **Uso correto:** `hbj <valor>` ou `hbj all`.');

            const userId = message.author.id;
            let userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            if (!userProfile) return message.reply('❌ Ainda não tens um perfil registado. Usa o `hdiario` para começar!');

            let betAmount = betInput.toLowerCase() === 'all' ? userProfile.carteira : parseInt(betInput.replace(/k/g, '000').replace(/\./g, ''));
            if (isNaN(betAmount) || betAmount <= 0) return message.reply('❌ Valor de aposta inválido.');
            if (userProfile.carteira < betAmount) return message.reply(`❌ Não tens **R$ ${betAmount.toLocaleString('pt-BR')}** na carteira! (Vai ao banco sacar)`);

            if (userProfile.lastGame && (Date.now() - new Date(userProfile.lastGame).getTime() < 5000)) {
                return message.reply('⏳ Calma! O Agiota ainda está a baralhar as cartas. Aguarda 5 segundos.');
            }

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

            function calculateScore(hand) {
                let score = 0; let aces = 0;
                for (let card of hand) {
                    if (['J', 'Q', 'K'].includes(card.value)) score += 10;
                    else if (card.value === 'A') { score += 11; aces += 1; }
                    else score += parseInt(card.value);
                }
                while (score > 21 && aces > 0) { score -= 10; aces -= 1; }
                return score;
            }

            let deck = createDeck();
            let playerHand = [deck.pop(), deck.pop()];
            let dealerHand = [deck.pop(), deck.pop()];

            if (!client.activeBlackjack) client.activeBlackjack = new Map();
            client.activeBlackjack.set(userId, { bet: betAmount, deck, playerHand, dealerHand });

            const playerScore = calculateScore(playerHand);

            const imageBuffer = await generateBlackjackTable(playerHand, dealerHand, false);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'table.png' });

            const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setTitle('🃏 BLACKJACK HYPE')
                .setDescription(`**Jogador:** <@${userId}>\n**Aposta:** R$ ${betAmount.toLocaleString('pt-BR')}\n**Seus Pontos:** ${playerScore}`)
                .setImage('attachment://table.png');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`eco_bj_hit_${userId}`).setLabel('Pedir Carta').setStyle(ButtonStyle.Primary).setEmoji('🃏'),
                new ButtonBuilder().setCustomId(`eco_bj_stand_${userId}`).setLabel('Parar Mão').setStyle(ButtonStyle.Success).setEmoji('✋')
            );

            return message.reply({ embeds: [embed], components: [row], files: [attachment] });
        }

        // ==========================================
        // 🚀 GAME: Crash (hcrash)
        // ==========================================
        if (command === 'crash') {
            const betInput = args[0];

            if (!betInput) return message.reply('❌ **Uso correto:** `hcrash <valor>` ou `hcrash all`.');

            const userId = message.author.id;
            let userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            if (!userProfile) return message.reply('❌ Ainda não tens um perfil registado.');

            let betAmount = betInput.toLowerCase() === 'all' ? userProfile.carteira : parseInt(betInput.replace(/k/g, '000').replace(/\./g, ''));
            if (isNaN(betAmount) || betAmount <= 0) return message.reply('❌ Valor de aposta inválido.');
            if (userProfile.carteira < betAmount) return message.reply(`❌ Não tens **R$ ${betAmount.toLocaleString('pt-BR')}** na carteira!`);

            if (userProfile.lastGame && (Date.now() - new Date(userProfile.lastGame).getTime() < 5000)) {
                return message.reply('⏳ O foguetão ainda está a abastecer! Aguarda 5 segundos.');
            }

            await prisma.hypeUser.update({
                where: { id: userId },
                data: { carteira: { decrement: betAmount }, lastGame: new Date() }
            });

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

            const embed = new EmbedBuilder()
                .setColor('#FEE75C')
                .setTitle('🚀 CRASH HYPE')
                .setDescription(`**Piloto:** <@${userId}>\n**Aposta:** R$ ${betAmount.toLocaleString('pt-BR')}\n\n🟢 O foguetão está a subir! Pule antes que exploda!`)
                .setImage('attachment://crash.png');

            const cashoutBtn = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`eco_crash_cashout_${userId}`).setLabel('💰 PULAR DO FOGUETE').setStyle(ButtonStyle.Success)
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

                embed.setDescription(`**Piloto:** <@${userId}>\n**Aposta:** R$ ${betAmount.toLocaleString('pt-BR')}\n\n🟢 O foguetão está a subir! Pule antes que exploda!`);
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
            const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
            
            // 1. Avisa o utilizador que está a processar (porque agora vamos forçar a leitura do servidor todo)
            const msg = await message.reply({ content: '⏳ `Lendo a lista de habitantes e desenhando a galeria de Magnatas...`' });

            // 2. Busca os utilizadores diretamente ordenados pela riqueza no BANCO (hypeCash)
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
                // 👇 A CORREÇÃO DE OURO ESTÁ AQUI 👇
                // Força o bot a baixar todos os membros reais do servidor para a memória cache dele
                try { await message.guild.members.fetch(); } catch (e) { console.log('Aviso ao puxar membros no Rank.'); }
                
                // Agora sim, ele filtra corretamente sem deixar ninguém de fora
                sortedUsers = sortedUsers.filter(u => message.guild.members.cache.has(u.id)).slice(0, 30);
            } else {
                sortedUsers = sortedUsers.slice(0, 30);
            }

            if (sortedUsers.length === 0) return msg.edit({ content: '❌ Ninguém tem moedas depositadas no banco por aqui ainda...' });

            // Divide os 30 jogadores em páginas de 10
            const chunks = [];
            for (let i = 0; i < sortedUsers.length; i += 10) {
                chunks.push(sortedUsers.slice(i, i + 10));
            }

            let currentPage = 0;
            const rankTitle = isGlobal ? 'GLOBAL' : message.guild.name;

            // Função para renderizar a página específica ao vivo
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
                // 3. Envia a Primeira Página
                const firstAttachment = await renderPage(0);
                await msg.edit({ content: '', files: [firstAttachment], components: chunks.length > 1 ? [getRow(0)] : [] });

                // 4. Paginação (Avançar e Voltar)
                if (chunks.length > 1) {
                    const collector = msg.createMessageComponentCollector({ time: 60000 });
                    collector.on('collect', async i => {
                        if (i.user.id !== message.author.id) {
                            return i.reply({ content: '❌ Você não pode trocar a página deste ranking.', flags: [MessageFlags.Ephemeral] });
                        }

                        if (i.customId === 'rank_prev' && currentPage > 0) currentPage--;
                        if (i.customId === 'rank_next' && currentPage < chunks.length - 1) currentPage++;

                        await i.update({ content: '⏳ `Desenhando a nova página...`', files: [], components: [] });
                        
                        const newAttachment = await renderPage(currentPage);
                        await msg.edit({ content: '', files: [newAttachment], components: [getRow(currentPage)] });
                    });

                    collector.on('end', () => { msg.edit({ components: [] }).catch(()=>{}); });
                }
            } catch (error) {
                console.error(error);
                msg.edit({ content: '❌ Ocorreu um erro ao gerar o ranking visual.' }).catch(()=>{});
            }

            return;
        }
// ==========================================
        // 📖 COMANDO: hajuda / hhelp (Menu Paginado)
        // ==========================================
        if (command === 'ajuda' || command === 'help') {
            const pages = [
                new EmbedBuilder()
                    .setColor('#2b2d31')
                    .setTitle('📖 Ajuda - 🏦 Economia Básica')
                    .setDescription('**Prefixo Oficial:** `h`\nA base da economia. O teu dinheiro da mão fica na **Carteira**, o dinheiro seguro fica no **Banco**.')
                    .addFields(
                        { name: '💼 Gerenciamento', value: '`hcarteira (hc)` - Vê o saldo que tens em mãos.\n`hperfil` - Vê o teu nível VIP e status.\n`htempo (hcd)` - Verifica todos os teus tempos de recarga.' },
                        { name: '🏦 O Banco', value: '`hdepositar (hdep) <valor>` - Guarda no banco.\n`hdepall` - Guarda TUDO no banco rápido.\n`hsacar <valor>` - Tira dinheiro do banco.\n`hsacarall` - Tira TUDO do banco.\n`hpix @user <valor/all>` - Transfere dinheiro seguro para um amigo.' },
                        { name: '💰 Salários Fixos', value: '`hdiario` - Recolhe a tua mesada a cada 24h.\n`hsemanal` - Recolhe o teu salário a cada 7 dias.\n`hmensal` - O teu bónus massivo a cada 30 dias.' }
                    )
                    .setThumbnail(client.user.displayAvatarURL()),
                
                new EmbedBuilder()
                    .setColor('#FEE75C')
                    .setTitle('📖 Ajuda - 🎰 Cassino & Jogos')
                    .setDescription('Apostas arriscadas! Todos os jogos cobram o valor diretamente da tua **CARTEIRA** (dinheiro na mão).')
                    .addFields(
                        { name: '🐯 Máquinas', value: '`htigrinho <valor/all>` - Gira a slot machine do tigre.\n`hmines <valor/all>` - Campo minado. Retira o dinheiro antes de pisar na bomba!' },
                        { name: '🚀 Multiplicadores & Cartas', value: '`hcrash <valor/all>` - O foguetão sobe! Pula antes de explodir.\n`hbj <valor/all>` - Joga Blackjack (21) contra o Agiota do servidor.' },
                        { name: '🔫 Multiplayer', value: '`hroleta <valor>` - Abre uma mesa de Roleta Russa no chat (Mín. 2 a 6 jogadores).' }
                    )
                    .setThumbnail(client.user.displayAvatarURL()),

                new EmbedBuilder()
                    .setColor('#ED4245')
                    .setTitle('📖 Ajuda - 🎭 Social & Crime')
                    .setDescription('Movimenta o chat para ganhares pequenas quantias. Se tiveres VIP, ganhas com multiplicador!')
                    .addFields(
                        { name: '❤️ Amor & Carinho', value: '`hbeijar @user`\n`habracar @user`\n`hpat @user`\n`hcafune @user`' },
                        { name: '🥊 Porrada & Ódio', value: '`htapa @user`\n`hsocar @user`\n`hmorder @user`' },
                        { name: '🥷 Submundo', value: '`hroubar @user` - Tenta passar a mão na carteira de alguém. Se a polícia te apanhar, pagas multa alta!' }
                    )
                    .setThumbnail(client.user.displayAvatarURL()),

                new EmbedBuilder()
                    .setColor('#9b59b6')
                    .setTitle('📖 Ajuda - 🏆 Rankings & VIP')
                    .setDescription('Os comandos de ostentação. Vê quem domina a economia!')
                    .addFields(
                        { name: '📊 Pódio dos Ricos', value: '`hrank` - Ranking com os mais ricos **deste servidor**.\n`hrankglobal` - Ranking dos mais ricos de **todos os servidores**.' },
                        { name: '💎 Hype VIP', value: '`hvip` - Abre o teu painel VIP para pegar prêmios secretos e Lojinha.\n`/comprarvip` *(Comando Barra)* - Loja oficial para comprar VIP e Moedas com Pix real.' },
                        { name: '🧾 Outros', value: '`/extrato` *(Comando Barra)* - Vê o teu histórico de logs.' }
                    )
                    .setThumbnail(client.user.displayAvatarURL()),

                new EmbedBuilder()
                    .setColor('#000000')
                    .setTitle('📖 Ajuda - 👑 Staff & Developer')
                    .setDescription('Comandos Barra (`/`) de uso restrito à administração.')
                    .addFields(
                        { name: '⚙️ Sistemas Base', value: '`/hype` - Dashboard Principal do Bot.\n`/massrole` - Dá cargo em massa.\n`/locticket` - Envia o painel de Tickets.' },
                        { name: '🛠️ Economia Local (Staff)', value: '`/resetcooldowns` - Seta os cooldowns de alguém a 0.\n`/ranking` - Ranking de quem mais atendeu tickets.' },
                        { name: '💻 Modo Deus (Só Dono)', value: '`/devpanel` - Injeta dinheiro e gere a loja base.\n`/wipecooldowns` - Zera os tempos de TODO o servidor.\n`/wipeeconomy` - Deleta o saldo de TODO o servidor.' }
                    )
                    .setThumbnail(client.user.displayAvatarURL())
            ];

            let currentPage = 0;

            const getRow = (page) => {
                return new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev_help')
                        .setLabel('◀ Anterior')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === 0), // Desativa se estiver na primeira página
                    new ButtonBuilder()
                        .setCustomId('page_indicator')
                        .setLabel(`Página ${page + 1} de ${pages.length}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true), // Apenas decorativo
                    new ButtonBuilder()
                        .setCustomId('next_help')
                        .setLabel('Próxima ▶')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === pages.length - 1) // Desativa se estiver na última
                );
            };

            const helpMessage = await message.reply({
                embeds: [pages[currentPage]],
                components: [getRow(currentPage)]
            });

            // Cria um coletor que dura 2 minutos (120000ms)
            const collector = helpMessage.createMessageComponentCollector({
                filter: i => i.user.id === message.author.id, // Só quem executou o comando pode trocar de página
                time: 120000 
            });

            collector.on('collect', async i => {
                if (i.customId === 'prev_help') currentPage--;
                if (i.customId === 'next_help') currentPage++;

                await i.update({
                    embeds: [pages[currentPage]],
                    components: [getRow(currentPage)]
                });
            });

            // Quando o tempo acabar, remove os botões para limpar o servidor
            collector.on('end', () => {
                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('timeout').setLabel('Tempo Esgotado').setStyle(ButtonStyle.Secondary).setDisabled(true)
                );
                helpMessage.edit({ components: [disabledRow] }).catch(() => {});
            });

            return;
        }
        // ==========================================
        // 🚀 COMANDO: hperfil
        // ==========================================
        if (command === 'perfil') {
            const targetUser = message.mentions.users.first() || message.author;
            const isOwnProfile = targetUser.id === message.author.id; 

            const loadingMsg = await message.reply('🔍 A procurar perfil...');

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
                        new ButtonBuilder().setCustomId('eco_profile_bio').setLabel('Editar Bio').setStyle(ButtonStyle.Secondary).setEmoji('✏️'),
                        new ButtonBuilder().setCustomId('eco_profile_theme').setLabel('Temas de Perfil').setStyle(userData.vipLevel > 0 ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji('🎨').setDisabled(userData.vipLevel === 0) 
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
            if (!valorStr) return message.reply('❌ Você precisa dizer o valor! Exemplo: `hdepositar 100` ou `hdepositar tudo`');

            const user = await prisma.hypeUser.findUnique({ where: { id: message.author.id } });
            if (!user || user.carteira <= 0) return message.reply('❌ Não tens dinheiro na carteira para depositar.');

            let valor = parseInt(valorStr);
            if (valorStr.toLowerCase() === 'tudo' || valorStr.toLowerCase() === 'all') valor = user.carteira;

            if (isNaN(valor) || valor <= 0) return message.reply('❌ Valor inválido!');
            if (user.carteira < valor) return message.reply(`❌ Só tem **R$ ${user.carteira.toLocaleString('pt-BR')}** na carteira.`);

            await prisma.hypeUser.update({ where: { id: user.id }, data: { carteira: { decrement: valor }, hypeCash: { increment: valor } } });
            return message.reply(`✅ **Sucesso!** Você depositou **R$ ${valor.toLocaleString('pt-BR')}** no teu Cartão Hype! 🏦`);
        }

        if (command === 'depall') {
            const user = await prisma.hypeUser.findUnique({ where: { id: message.author.id } });
            if (!user || user.carteira <= 0) return message.reply('❌ Não tem nenhum dinheiro na carteira para depositar.');
            const valorTotal = user.carteira;

            await prisma.hypeUser.update({ where: { id: user.id }, data: { carteira: { decrement: valorTotal }, hypeCash: { increment: valorTotal } } });
            return message.reply(`✅ **Segurança Máxima!** Você depositou todo o teu dinheiro (**R$ ${valorTotal.toLocaleString('pt-BR')}**) no teu Cartão Hype! 🏦`);
        }

        if (command === 'sacar' || command === 'saque') {
            let valorStr = args[0];
            if (!valorStr) return message.reply('❌ Você precisa dizer o valor! Exemplo: `hsacar 100`');

            const user = await prisma.hypeUser.findUnique({ where: { id: message.author.id } });
            let valor = parseInt(valorStr);
            if (valorStr.toLowerCase() === 'tudo') valor = user?.hypeCash || 0;

            if (!user || isNaN(valor) || valor <= 0 || user.hypeCash < valor) {
                return message.reply(`❌ Saldo insuficiente no banco. Tem apenas **R$ ${(user?.hypeCash || 0).toLocaleString('pt-BR')}**.`);
            }

            await prisma.hypeUser.update({ where: { id: user.id }, data: { hypeCash: { decrement: valor }, carteira: { increment: valor } } });
            return message.reply(`✅ **Saque feito!** Retirou **R$ ${valor.toLocaleString('pt-BR')}** do banco. O dinheiro está na tua carteira. Cuidado nas ruas! 🔫`);
        }

        if (command === 'sacarall') {
            const user = await prisma.hypeUser.findUnique({ where: { id: message.author.id } });
            if (!user || user.hypeCash <= 0) return message.reply('❌ O seu banco está a zero. Não tem nada para sacar.');
            const valorTotal = user.hypeCash;

            await prisma.hypeUser.update({ where: { id: user.id }, data: { hypeCash: { decrement: valorTotal }, carteira: { increment: valorTotal } } });
            return message.reply(`✅ **Saque Total!** Retirou todo o seu dinheiro (**R$ ${valorTotal.toLocaleString('pt-BR')}**) do banco. Cuidado nas ruas! 🔫`);
        }

        // ==========================================
        // 🚀 COMANDO: hc / hcarteira
        // ==========================================
        if (command === 'c' || command === 'carteira') {
            const targetUser = message.mentions.users.first() || message.author;
            const loadingMsg = await message.reply('🔍 A abrir a carteira...');

            try {
                let userData = await prisma.hypeUser.findUnique({ where: { id: targetUser.id } });
                if (!userData) userData = await prisma.hypeUser.create({ data: { id: targetUser.id } });

                const { generateWalletImage } = require('../../../utils/canvasWallet');
                const imageBuffer = await generateWalletImage(targetUser, userData);
                const attachment = new AttachmentBuilder(imageBuffer, { name: 'wallet.png' });

                await loadingMsg.edit({ content: `Carteira de <@${targetUser.id}>`, files: [attachment] });
            } catch (err) {
                console.error(err);
                await loadingMsg.edit('❌ Erro ao gerar a carteira.');
            }
        }

        // ==========================================
        // 🚀 COMANDO: hvip
        // ==========================================
        if (command === 'vip') {
            const targetUser = message.mentions.users.first() || message.author;
            const guildId = message.guild.id;

            const loadingMsg = await message.reply('💳 A imprimir o Cartão Hype...');

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

                const { generateHypeCard } = require('../../../utils/canvasCard');
                const cardBuffer = await generateHypeCard(targetUser, userProfile.cardNumber, saldoFormatado, vipRealLevel, txtVip, txtValidade);
                
                const attachment = new AttachmentBuilder(cardBuffer, { name: 'hypecard.png' });
                const embed = new EmbedBuilder().setColor(colorAccent).setImage('attachment://hypecard.png');

                const components = [];
                if (targetUser.id === message.author.id) {
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('eco_user_store').setLabel('Lojinha Hype').setStyle(ButtonStyle.Primary).setEmoji('🛒'),
                        new ButtonBuilder().setCustomId('eco_user_daily').setLabel('Pegar Daily').setStyle(ButtonStyle.Success).setEmoji('🎁'),
                        new ButtonBuilder().setCustomId('eco_user_config').setLabel('Benefícios VIP').setStyle(ButtonStyle.Secondary).setEmoji('💎')
                    );
                    components.push(row);
                }

                await loadingMsg.edit({ content: `**Acesso VIP** de <@${targetUser.id}>`, embeds: [embed], files: [attachment], components: components });

            } catch (error) {
                console.error('❌ Erro ao abrir hvip:', error);
                await loadingMsg.edit('❌ Erro de sistema ao gerar o teu Cartão Hype. Tenta novamente.');
            }
        }
    }
};