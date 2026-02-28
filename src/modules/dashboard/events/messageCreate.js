const { AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateProfileImage } = require('../../../utils/canvasProfile');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        // Ignora bots e mensagens sem o prefixo Z (z ou Z)
        if (message.author.bot || !message.content.toLowerCase().startsWith('z')) return;

        // Separa o comando dos argumentos
        const args = message.content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

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
            pat: [
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjYzYWx1bDFuampvb3NxMXllYXQ0OHVjOG5pbDZlZWJvZG9obTZuaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/5tmRHwTlHAA9WkVxTU/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjYzYWx1bDFuampvb3NxMXllYXQ0OHVjOG5pbDZlZWJvZG9obTZuaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/u9BxQbM5bxvwY/giphy.gif',
                'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjYzYWx1bDFuampvb3NxMXllYXQ0OHVjOG5pbDZlZWJvZG9obTZuaCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/L2z7dnOduqEow/giphy.gif'
            ],
            // 👇 NOVOS GIFS AQUI
            socar: [
                'https://media1.tenor.com/m/6a42QGaaXikAAAAC/anime-punch.gif',
                'https://media.giphy.com/media/l1J3G5lf06vi58EIE/giphy.gif',
                'https://media1.tenor.com/m/xY2SjK0L6pIAAAAC/punch-anime.gif'
            ],
            cafune: [
                'https://media1.tenor.com/m/E6fMkQRZBdYAAAAC/anime-pat.gif',
                'https://media1.tenor.com/m/N41zKIGXCGQAAAAC/anime-head-pat.gif'
            ]
        };

        const socialCommands = {
            'beijar': { verb: 'deu um beijo apaixonado em', type: 'beijar', emoji: '💋' },
            'tapa': { verb: 'deu um tapa bem dado na cara de', type: 'tapa', emoji: '🖐️' },
            'abracar': { verb: 'deu um abraço bem apertado em', type: 'abracar', emoji: '🫂' },
            'morder': { verb: 'deu uma mordida em', type: 'morder', emoji: '🧛' },
            'pat': { verb: 'fez um carinho fofo na cabeça de', type: 'pat', emoji: '🥰' },
            'socar': { verb: 'deu um soco com toda a força na cara de', type: 'socar', emoji: '🥊' },
            'cafune': { verb: 'fez um cafuné gostoso em', type: 'cafune', emoji: '💆' }
        
        };

        if (socialCommands[command]) {
            const action = socialCommands[command];
            const authorId = message.author.id;
            const targetUser = message.mentions.users.first();

            // 1. Verificações Básicas
            if (!targetUser) return message.reply(`❌ Tens de mencionar alguém! Exemplo: \`z${command} @usuario\``);
            if (targetUser.id === authorId) return message.reply(`❌ Não podes fazer isso a ti mesmo(a)! Dá isso a outra pessoa!`);
            if (targetUser.bot) return message.reply(`😳 Eh lá... eu sou apenas um bot de sistema! Mas agradeço a intenção.`);

            // 2. Busca o utilizador no Banco de Dados
            let userProfile = await prisma.hypeUser.findUnique({ where: { id: authorId } });
            
            // 3. Define qual a coluna de cooldown com base no comando dinamicamente
            // Ex: beijar -> lastBeijar, tapa -> lastTapa
            const columnString = 'last' + action.type.charAt(0).toUpperCase() + action.type.slice(1);
            
            // 4. Verifica o Cooldown Seguro (20 Minutos APENAS para este comando)
            const cooldownTime = 20 * 60 * 1000;
            if (userProfile && userProfile[columnString]) {
                const now = new Date().getTime();
                const lastTime = new Date(userProfile[columnString]).getTime();

                if (now - lastTime < cooldownTime) {
                    const timeLeft = Math.ceil((cooldownTime - (now - lastTime)) / 1000);
                    // UX Melhorada: Mostra o tempo formatado em Minutos e Segundos
                    const minutes = Math.floor(timeLeft / 60);
                    const seconds = timeLeft % 60;
                    return message.reply(`⏳ **Descansa a mão!** Já usaste o \`z${command}\` há pouco tempo.\nPodes usá-lo de novo em **${minutes}m e ${seconds}s**.`);
                }
            }

            // 5. RNG (Probabilidade: 70% chance de dar certo)
            const isSuccess = Math.random() > 0.30; 
            const rewardAmount = isSuccess ? Math.floor(Math.random() * (350000 - 100000 + 1)) + 100000 : 0;

            // 6. Prepara os dados para salvar no Banco dinamicamente apenas na coluna certa
            const updateData = { carteira: { increment: rewardAmount } };
            updateData[columnString] = new Date(); 
            
            const createData = { id: authorId, carteira: rewardAmount };
            createData[columnString] = new Date();

            await prisma.hypeUser.upsert({
                where: { id: authorId },
                update: updateData,
                create: createData
            });

            // 7. Mensagens de Falha (Se o RNG bater nos 30%)
            if (!isSuccess) {
                let failMsg = '';
                if (action.type === 'beijar') failMsg = `<@${targetUser.id}> virou a cara e deixou-te no vácuo! Que vergonha... 🥶`;
                else if (action.type === 'tapa') failMsg = `<@${targetUser.id}> é o próprio Matrix e desviou do teu tapa! 🕶️`;
                else if (action.type === 'abracar') failMsg = `<@${targetUser.id}> deu um passo para trás e recusou o teu abraço! 🛑`;
                else if (action.type === 'morder') failMsg = `<@${targetUser.id}> esquivou-se e tu mordeste a própria língua! 🦷`;
                else if (action.type === 'pat') failMsg = `<@${targetUser.id}> bateu na tua mão e não quis carinho! ✋`;

                return message.reply(`❌ **FALHOU!**\n${failMsg}`);
            }

            // 8. Sucesso! Anexa a Imagem e envia fora do embed
            const randomGif = gifs[action.type][Math.floor(Math.random() * gifs[action.type].length)];
            const { AttachmentBuilder } = require('discord.js');
            const attachment = new AttachmentBuilder(randomGif, { name: 'animacao.gif' });

            return message.reply({ 
                content: `${action.emoji} | <@${authorId}> **${action.verb}** <@${targetUser.id}>!\n\n💸 **SOCIAL REWARD:** Ganhaste **R$ ${rewardAmount.toLocaleString('pt-BR')}** (Caiu na tua Carteira!)`, 
                files: [attachment] 
            });
        }
        // ==========================================
        // 📋 COMANDO: zwork / zcd (Painel Completo)
        // ==========================================
        if (command === 'work' || command === 'cd' || command === 'cooldowns') {
            const userId = message.author.id;
            let userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            
            if (!userProfile) {
                return message.reply('❌ Ainda não tens um perfil registado. Usa o `zcarteira` para começares a jogar!');
            }

            // Tempos de Cooldown Exatos (em milissegundos)
            const dailyCD = 24 * 60 * 60 * 1000;         // 24 horas
            const semanalCD = 7 * 24 * 60 * 60 * 1000;   // 7 dias
            const mensalCD = 30 * 24 * 60 * 60 * 1000;   // 30 dias
            const socialCD = 20 * 60 * 1000;             // 20 minutos

            // Função que gera a formatação visual (Disponível vs Tempo Restante)
            const makeLine = (name, lastDate, cooldownMs) => {
                if (!lastDate) return `• ✅ **${name}**: \`Disponível.\``;
                const lastTime = new Date(lastDate).getTime();
                
                if (Date.now() - lastTime >= cooldownMs) {
                    return `• ✅ **${name}**: \`Disponível.\``;
                }
                
                // Transforma em Timestamp Nativo do Discord para atualizar sozinho na tela
                const expireUnix = Math.floor((lastTime + cooldownMs) / 1000);
                return `• ⏰ **${name}**: <t:${expireUnix}:R>`; 
            };

            // Construção da lista de forma elegante e dividida
            let desc = `Confira os **cooldown's** abaixo:\n\n`;
            
            // Bloco de Economia / Salários
            desc += makeLine('Diário', userProfile.lastDaily, dailyCD) + '\n';
            desc += makeLine('Semanal', userProfile.lastSemanal, semanalCD) + '\n';
            desc += makeLine('Mensal', userProfile.lastMensal, mensalCD) + '\n\n';
            desc += makeLine('Roubar', userProfile.lastRob, 10 * 60 * 1000) + '\n';
            
            // Bloco de Interações RP
            desc += makeLine('Beijar', userProfile.lastBeijar, socialCD) + '\n';
            desc += makeLine('Abraçar', userProfile.lastAbracar, socialCD) + '\n';
            desc += makeLine('Cafuné', userProfile.lastCafune, socialCD) + '\n';
            desc += makeLine('Socar', userProfile.lastSocar, socialCD) + '\n';
            desc += makeLine('Morder', userProfile.lastMorder, socialCD) + '\n';
            desc += makeLine('Tapa', userProfile.lastTapa, socialCD) + '\n';

            // Montagem do Embed Final
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
                .setColor('#9b59b6') // Roxo Premium
                .setAuthor({ name: `⏰ Cooldown's de ${message.author.username}` })
                .setDescription(desc)
                .setThumbnail('https://cdn-icons-png.flaticon.com/512/3103/3103306.png') // Ícone de Ampulheta
                .setFooter({ 
                    text: 'O tempo passa devagar, não é? ⏳', 
                    iconURL: message.author.displayAvatarURL({ dynamic: true }) 
                });

            return message.reply({ embeds: [embed] });
        }
  // ==========================================
        // 💰 COMANDOS: zdiario / zsemanal / zmensal (Salários)
        // ==========================================
        if (command === 'diario' || command === 'semanal' || command === 'mensal') {
            const userId = message.author.id;
            let userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            
            let cooldownTime;
            let columnString;
            let nomePremio;
            let rewardAmount;
            let embedColor;

            // Define as regras dinamicamente com base no comando digitado
            if (command === 'diario') {
                cooldownTime = 24 * 60 * 60 * 1000; // 24 horas
                columnString = 'lastDaily';         // Usa a mesma coluna do painel VIP
                nomePremio = 'Salário Diário';
                rewardAmount = Math.floor(Math.random() * (105000 - 50000 + 1)) + 50000; // 50k a 105k
                embedColor = '#3498db'; // Azul
            } else if (command === 'semanal') {
                cooldownTime = 7 * 24 * 60 * 60 * 1000; // 7 dias
                columnString = 'lastSemanal';
                nomePremio = 'Salário Semanal';
                rewardAmount = Math.floor(Math.random() * (400000 - 200000 + 1)) + 200000; // 200k a 400k
                embedColor = '#57F287'; // Verde
            } else if (command === 'mensal') {
                cooldownTime = 30 * 24 * 60 * 60 * 1000; // 30 dias
                columnString = 'lastMensal';
                nomePremio = 'Salário Mensal';
                rewardAmount = Math.floor(Math.random() * (650000 - 400000 + 1)) + 400000; // 400k a 650k
                embedColor = '#FEE75C'; // Dourado
            }

            // Verifica o Cooldown (Usando a Tag de contagem regressiva nativa)
            if (userProfile && userProfile[columnString]) {
                const now = new Date().getTime();
                const lastTime = new Date(userProfile[columnString]).getTime();

                if (now - lastTime < cooldownTime) {
                    const expireUnix = Math.floor((lastTime + cooldownTime) / 1000);
                    return message.reply(`⏳ **Calma lá, magnata!** Já recolheste o teu ${nomePremio}.\nPodes recolher de novo <t:${expireUnix}:R>.`);
                }
            }

            // Salva na Base de Dados e Adiciona o Dinheiro
            const updateData = { carteira: { increment: rewardAmount } };
            updateData[columnString] = new Date();
            const createData = { id: userId, carteira: rewardAmount };
            createData[columnString] = new Date();

            await prisma.hypeUser.upsert({
                where: { id: userId },
                update: updateData,
                create: createData
            });

            // Envia Embed Ostentação
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(`💰 ${nomePremio} Recolhido!`)
                .setDescription(`Foste ao banco e levantaste a tua grana!\n\n💸 **Valor recebido:** R$ ${rewardAmount.toLocaleString('pt-BR')}\n*(O dinheiro foi adicionado à tua carteira na mão. Cuidado com os roubos!)*`)
                .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

            return message.reply({ embeds: [embed] });
        }
        // ==========================================
        // 🔫 COMANDO: zroubar (Assalto a Jogadores)
        // ==========================================
        if (command === 'roubar' || command === 'assaltar') {
            const authorId = message.author.id;
            const targetUser = message.mentions.users.first();

            // 1. Verificações de Segurança
            if (!targetUser) return message.reply('❌ Precisas de mencionar a vítima! Exemplo: `zroubar @usuario`');
            if (targetUser.id === authorId) return message.reply('❌ Queres roubar a ti próprio? Vai ao psicólogo, não ao bot!');
            if (targetUser.bot) return message.reply('🤖 Roubar um bot? Eu não guardo notas de papel, só código!');

            // 2. Busca dados de ambos
            let [ladrao, vitima] = await Promise.all([
                prisma.hypeUser.findUnique({ where: { id: authorId } }),
                prisma.hypeUser.findUnique({ where: { id: targetUser.id } })
            ]);

            if (!ladrao) ladrao = await prisma.hypeUser.create({ data: { id: authorId } });
            if (!vitima || vitima.carteira <= 0) {
                return message.reply(`💨 **Vácuo!** <@${targetUser.id}> não tem nem um centavo na carteira. Não vale o esforço!`);
            }

            // 3. Cooldown de Roubo (10 minutos para não virar spam)
            const cooldownRoubo = 10 * 60 * 1000;
            if (ladrao.lastRob) {
                const diff = Date.now() - new Date(ladrao.lastRob).getTime();
                if (diff < cooldownRoubo) {
                    const expireUnix = Math.floor((new Date(ladrao.lastRob).getTime() + cooldownRoubo) / 1000);
                    return message.reply(`⏳ A polícia está de olho em ti! Espera até <t:${expireUnix}:R> para tentares outro assalto.`);
                }
            }

            // 4. Lógica de Sucesso (45% de chance)
            const sorteio = Math.random();
            const sucesso = sorteio <= 0.45;

            if (sucesso) {
                // Rouba entre 20% a 100% do que está na mão da vítima
                const porcentagemRoubada = Math.random() * (1.0 - 0.2) + 0.2;
                const valorFinal = Math.floor(vitima.carteira * porcentagemRoubada);

                await prisma.$transaction([
                    prisma.hypeUser.update({ where: { id: authorId }, data: { carteira: { increment: valorFinal }, lastRob: new Date() } }),
                    prisma.hypeUser.update({ where: { id: targetUser.id }, data: { carteira: { decrement: valorFinal } } })
                ]);

                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setColor('#57F287')
                    .setTitle('🥷 ASSALTO BEM SUCEDIDO!')
                    .setDescription(`Tu passaste a mão na carteira de <@${targetUser.id}> e fugiste num carro de fuga!\n\n💸 **Levaste:** R$ ${valorFinal.toLocaleString('pt-BR')}\n*(Dinheiro adicionado à tua carteira)*`)
                    .setThumbnail('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3Nndm9pZ3Nndm9pZ3Nndm9pZ3Nndm9pZ3Nndm9pZ3Nndm9pZ3Nn/3o7TKMGpxS5O7E6pW0/giphy.gif');

                return message.reply({ embeds: [embed] });

            } else {
                // FALHOU! Paga multa de 10% do que o ladrão tem na mão ou 50k (o que for maior)
                const multaBase = 50000;
                const multaPorcentagem = Math.floor(ladrao.carteira * 0.10);
                const multaFinal = Math.max(multaBase, multaPorcentagem);

                await prisma.hypeUser.update({ 
                    where: { id: authorId }, 
                    data: { 
                        carteira: { decrement: ladrao.carteira >= multaFinal ? multaFinal : ladrao.carteira },
                        lastRob: new Date() 
                    } 
                });

                return message.reply(`🚨 **TE PEGARAM!** O alarme disparou e a polícia chegou a tempo. <@${targetUser.id}> conseguiu fugir e tu tiveste de pagar **R$ ${multaFinal.toLocaleString('pt-BR')}** de fiança para sair da esquadra!`);
            }
        }
        // ==========================================
        // 🚀 COMANDO: zperfil
        // ==========================================
        if (command === 'perfil') {
            const targetUser = message.mentions.users.first() || message.author;
            const isOwnProfile = targetUser.id === message.author.id; // Verifica se é o próprio perfil

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

                const embed = new EmbedBuilder()
                    .setColor('#2b2d31')
                    .setImage('attachment://profile.png');

                const components = [];
                
                // 👇 LÓGICA DE BOTÕES ADICIONADA AQUI!
                if (isOwnProfile) {
                    // Botões de Editar para o dono do perfil
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('eco_profile_bio').setLabel('Editar Bio').setStyle(ButtonStyle.Secondary).setEmoji('✏️'),
                        new ButtonBuilder().setCustomId('eco_profile_theme').setLabel('Temas de Perfil').setStyle(userData.vipLevel > 0 ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji('🎨').setDisabled(userData.vipLevel === 0) 
                    );
                    components.push(row);
                } else {
                    // Botão de Dar Fama para amigos
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('eco_rep_btn').setLabel('Dar +Reputação').setStyle(ButtonStyle.Success).setEmoji('⭐')
                    );
                    components.push(row);
                }

                // Edita a mensagem incluindo a array de components (os botões)
                await loadingMsg.edit({ 
                    content: `Perfil de <@${targetUser.id}>`, 
                    embeds: [embed], 
                    files: [attachment],
                    components: components 
                });
            } catch (err) {
                console.error(err);
                await loadingMsg.edit('❌ Erro ao gerar o perfil.');
            }
        }

        // ==========================================
        // 🚀 COMANDO: zdepositar
        // ==========================================
        if (command === 'depositar' || command === 'dep') {
            let valorStr = args[0];
            if (!valorStr) return message.reply('❌ Tu precisas de dizer o valor! Exemplo: `zdepositar 100` ou `zdepositar tudo`');

            const user = await prisma.hypeUser.findUnique({ where: { id: message.author.id } });
            if (!user || user.carteira <= 0) return message.reply('❌ Não tens dinheiro na carteira para depositar.');

            let valor = parseInt(valorStr);
            if (valorStr.toLowerCase() === 'tudo' || valorStr.toLowerCase() === 'all') {
                valor = user.carteira;
            }

            if (isNaN(valor) || valor <= 0) return message.reply('❌ Valor inválido!');
            if (user.carteira < valor) return message.reply(`❌ Só tens **R$ ${user.carteira}** na carteira.`);

            await prisma.hypeUser.update({
                where: { id: user.id },
                data: { carteira: { decrement: valor }, hypeCash: { increment: valor } }
            });

            return message.reply(`✅ **Sucesso!** Tu depositaste **R$ ${valor}** no teu Cartão Hype! 🏦`);
        }
// ==========================================
        // 🚀 COMANDO: zc / zcarteira
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

                // 🔥 IMAGEM ENVIADA PURA POR FORA!
                await loadingMsg.edit({ 
                    content: `Carteira de <@${targetUser.id}>`, 
                    files: [attachment] 
                });
            } catch (err) {
                console.error(err);
                await loadingMsg.edit('❌ Erro ao gerar a carteira.');
            }
        }
        // ==========================================
        // 🚀 COMANDO: zdepall (Depositar Tudo Rápido)
        // ==========================================
        if (command === 'depall') {
            const user = await prisma.hypeUser.findUnique({ where: { id: message.author.id } });
            
            if (!user || user.carteira <= 0) {
                return message.reply('❌ Não tens nenhum dinheiro na carteira para depositar.');
            }

            const valorTotal = user.carteira;

            await prisma.hypeUser.update({
                where: { id: user.id },
                data: { 
                    carteira: { decrement: valorTotal }, 
                    hypeCash: { increment: valorTotal } 
                }
            });

            return message.reply(`✅ **Segurança Máxima!** Tu depositaste todo o teu dinheiro (**R$ ${valorTotal.toLocaleString('pt-BR')}**) no teu Cartão Hype! 🏦`);
        }
        // ==========================================
        // 🚀 COMANDO: zsacarall (Sacar Tudo Rápido)
        // ==========================================
        if (command === 'sacarall') {
            const user = await prisma.hypeUser.findUnique({ where: { id: message.author.id } });
            
            if (!user || user.hypeCash <= 0) {
                return message.reply('❌ O teu banco está a zeros. Não tens nada para sacar.');
            }

            const valorTotal = user.hypeCash;

            await prisma.hypeUser.update({
                where: { id: user.id },
                data: { 
                    hypeCash: { decrement: valorTotal }, 
                    carteira: { increment: valorTotal } 
                }
            });

            return message.reply(`✅ **Saque Total!** Retiraste todo o teu dinheiro (**R$ ${valorTotal.toLocaleString('pt-BR')}**) do banco. Cuidado nas ruas! 🔫`);
        }
        // ==========================================
        // 🚀 COMANDO: zvip
        // ==========================================
        if (command === 'vip') {
            // Permite ver o próprio cartão ou o de um amigo
            const targetUser = message.mentions.users.first() || message.author;
            const guildId = message.guild.id;

            const loadingMsg = await message.reply('💳 A imprimir o Cartão Hype...');

            try {
                // 1. Busca os dados no Banco
                let [userProfile, config] = await Promise.all([
                    prisma.hypeUser.findUnique({ where: { id: targetUser.id } }),
                    prisma.vipConfig.findUnique({ where: { guildId } })
                ]);

                // 2. Geração do Cartão (Caso a pessoa seja nova e não tenha)
                if (!userProfile || !userProfile.cardNumber) {
                    const randomHex = () => Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0');
                    const newCardNumber = `HYPE-${randomHex()}-${randomHex()}`;

                    userProfile = await prisma.hypeUser.upsert({
                        where: { id: targetUser.id },
                        update: { cardNumber: newCardNumber },
                        create: { id: targetUser.id, cardNumber: newCardNumber }
                    });
                }

                // 3. Verificação do Nível VIP e Cargos
                const member = await message.guild.members.fetch(targetUser.id).catch(() => null);
                let vipRealLevel = 0;
                let txtVip = "Membro Comum";
                let colorAccent = '#2b2d31'; 
                let txtValidade = "";

                if (member) {
                    if (userProfile.vipLevel >= 5) {
                        vipRealLevel = 5; txtVip = "⭐ VIP SUPREME"; colorAccent = '#ED4245'; // Vermelho
                    } else if (userProfile.vipLevel === 4) {
                        vipRealLevel = 4; txtVip = "⭐ VIP ELITE"; colorAccent = '#FEE75C'; // Dourado
                    } else if (userProfile.vipLevel === 3 || (config?.roleVip3 && member.roles.cache.has(config.roleVip3))) {
                        vipRealLevel = 3; txtVip = "⭐ VIP EXCLUSIVE"; colorAccent = '#9b59b6'; // Roxo
                    } else if (userProfile.vipLevel === 2 || (config?.roleVip2 && member.roles.cache.has(config.roleVip2))) {
                        vipRealLevel = 2; txtVip = "⭐ VIP PRIME"; colorAccent = '#ffffff'; // Branco
                    } else if (userProfile.vipLevel === 1 || (config?.roleVip1 && member.roles.cache.has(config.roleVip1))) {
                        vipRealLevel = 1; txtVip = "⭐ VIP BOOSTER"; colorAccent = '#ff85cd'; // Rosa
                    }
                }

                // 4. Calcular a Validade do Plano
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

                // 5. Gera a Arte Visual do Cartão
                const { generateHypeCard } = require('../../../utils/canvasCard');
                const cardBuffer = await generateHypeCard(
                    targetUser,
                    userProfile.cardNumber,
                    saldoFormatado,
                    vipRealLevel,
                    txtVip,
                    txtValidade
                );
                
                const attachment = new AttachmentBuilder(cardBuffer, { name: 'hypecard.png' });
                const embed = new EmbedBuilder().setColor(colorAccent).setImage('attachment://hypecard.png');

                // 6. Botões (Mostra apenas se o utilizador estiver a ver o seu próprio VIP)
                const components = [];
                if (targetUser.id === message.author.id) {
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('eco_user_store').setLabel('Lojinha Hype').setStyle(ButtonStyle.Primary).setEmoji('🛒'),
                        new ButtonBuilder().setCustomId('eco_user_daily').setLabel('Pegar Daily').setStyle(ButtonStyle.Success).setEmoji('🎁'),
                        new ButtonBuilder().setCustomId('eco_user_config').setLabel('Benefícios VIP').setStyle(ButtonStyle.Secondary).setEmoji('💎')
                    );
                    components.push(row);
                }

                // Substitui a mensagem de loading pelo resultado final
                await loadingMsg.edit({
                    content: `Acesso VIP de <@${targetUser.id}>`,
                    embeds: [embed],
                    files: [attachment],
                    components: components
                });

            } catch (error) {
                console.error('❌ Erro ao abrir zvip:', error);
                await loadingMsg.edit('❌ Erro de sistema ao gerar o teu Cartão Hype. Tenta novamente.');
            }
        }
        // ==========================================
        // 🚀 COMANDO: zsacar
        // ==========================================
        if (command === 'sacar' || command === 'saque') {
            let valorStr = args[0];
            if (!valorStr) return message.reply('❌ Tu precisas de dizer o valor! Exemplo: `zsacar 100`');

            const user = await prisma.hypeUser.findUnique({ where: { id: message.author.id } });
            let valor = parseInt(valorStr);

            if (valorStr.toLowerCase() === 'tudo') valor = user?.hypeCash || 0;

            if (!user || isNaN(valor) || valor <= 0 || user.hypeCash < valor) {
                return message.reply(`❌ Saldo insuficiente no banco. Tens **R$ ${user?.hypeCash || 0}**.`);
            }

            await prisma.hypeUser.update({
                where: { id: user.id },
                data: { hypeCash: { decrement: valor }, carteira: { increment: valor } }
            });

            return message.reply(`✅ **Saque feito!** Retiraste **R$ ${valor}** do banco. O dinheiro está na tua carteira. Cuidado nas ruas! 🔫`);
        }
    }
};