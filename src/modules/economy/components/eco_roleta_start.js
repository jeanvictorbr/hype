const { AttachmentBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateRoletaImage } = require('../../../utils/canvasRoletaRussa');
// Importa o mapa de mesas ativas para saber quem está a jogar
const { ActiveTables } = require('../commands/roletarussa');

// Função auxiliar para fazer o bot "esperar" uns segundos para criar suspense
const sleep = ms => new Promise(r => setTimeout(r, ms));

module.exports = {
    customId: 'eco_roleta_start',

    async execute(interaction) {
        const canalId = interaction.channel.id;
        const mesa = ActiveTables.get(canalId);

        // ==========================================
        // 1. VERIFICAÇÕES DE SEGURANÇA
        // ==========================================
        if (!mesa) return interaction.reply({ content: '❌ A mesa já não existe ou o jogo já acabou.', flags: [MessageFlags.Ephemeral] });
        
        if (mesa.donoId !== interaction.user.id) {
            return interaction.reply({ content: '❌ Apenas o dono da mesa (quem a abriu) pode ordenar que o tambor gire!', flags: [MessageFlags.Ephemeral] });
        }

        if (mesa.players.length < 2) {
            return interaction.reply({ content: '❌ Precisas de pelo menos 2 jogadores sentados para jogar!', flags: [MessageFlags.Ephemeral] });
        }

        if (mesa.estado !== 'lobby') {
            return interaction.reply({ content: '❌ A porta já está trancada, o jogo já começou.', flags: [MessageFlags.Ephemeral] });
        }

        // ==========================================
        // 2. INÍCIO DA ANIMAÇÃO E BLOQUEIO DA MESA
        // ==========================================
        mesa.estado = 'playing';
        
        // Segura a interação e limpa os botões para mais ninguém entrar
        await interaction.deferUpdate();
        await interaction.editReply({ components: [] });

        try {
            let alivePlayers = mesa.players.filter(p => !p.isDead);

            // ==========================================
            // 3. O LOOP DA MORTE
            // ==========================================
            // O jogo continua até sobrar apenas 1 gajo vivo
            while (alivePlayers.length > 1) {
                
                // Escolhe um dos sobreviventes aleatoriamente para ser a vítima desta ronda
                const randomAliveIndex = Math.floor(Math.random() * alivePlayers.length);
                const vitima = alivePlayers[randomAliveIndex];
                
                // Descobre em que cadeira (0 a 5) ele está sentado no Canvas
                const targetIndexCanvas = mesa.players.findIndex(p => p.id === vitima.id);

                // --- FRAME 1: A GIRAR A ARMA ---
                let imgBuffer = await generateRoletaImage('spinning', mesa.players, targetIndexCanvas, mesa.pot);
                let attachment = new AttachmentBuilder(imgBuffer, { name: 'roleta.png' });
                let embed = new EmbedBuilder()
                    .setColor('#f59e0b') // Laranja/Aviso
                    .setImage('attachment://roleta.png');
                
                await interaction.editReply({ embeds: [embed], files: [attachment], attachments: [] });
                
                // Suspense de 3 segundos enquanto a arma roda...
                await sleep(3000); 

                // --- FRAME 2: BANG! (ELIMINADO) ---
                vitima.isDead = true; // Marca o gajo como morto
                
                imgBuffer = await generateRoletaImage('shoot', mesa.players, targetIndexCanvas, mesa.pot);
                attachment = new AttachmentBuilder(imgBuffer, { name: 'roleta.png' });
                embed = new EmbedBuilder()
                    .setColor('#ef4444') // Vermelho Sangue
                    .setImage('attachment://roleta.png');

                await interaction.editReply({ embeds: [embed], files: [attachment], attachments: [] }).catch(() => {});
                
                // Deixa a foto da vítima riscada no ecrã por 2.5 segundos para a malta rir
                await sleep(2500); 

                // Atualiza a lista para o loop ver quem sobrou
                alivePlayers = mesa.players.filter(p => !p.isDead);
            }

            // ==========================================
            // 4. TEMOS UM VENCEDOR!
            // ==========================================
            const vencedor = alivePlayers[0];
            const winnerIndexCanvas = mesa.players.findIndex(p => p.id === vencedor.id);

            // Paga a fortuna toda ao sobrevivente!
            await prisma.hypeUser.update({
                where: { id: vencedor.id },
                data: { hypeCash: { increment: mesa.pot } }
            });

            // --- FRAME FINAL: VITÓRIA ---
            const finalImgBuffer = await generateRoletaImage('winner', mesa.players, winnerIndexCanvas, mesa.pot);
            const finalAttachment = new AttachmentBuilder(finalImgBuffer, { name: 'roleta.png' });
            const finalEmbed = new EmbedBuilder()
                .setColor('#fef08a') // Dourado
                .setTitle('👑 TEMOS UM SOBREVIVENTE!')
                .setDescription(`**${vencedor.username}** foi o último a ficar de pé e fugiu com a mala de **${mesa.pot.toLocaleString('pt-BR')} HypeCoins**!`)
                .setImage('attachment://roleta.png');

            await interaction.editReply({ embeds: [finalEmbed], files: [finalAttachment], attachments: [] }).catch(() => {});

            // ==========================================
            // 5. LIMPEZA
            // ==========================================
            // Apaga a mesa da memória para poderem jogar de novo no canal
            ActiveTables.delete(canalId);

        } catch (error) {
            console.error('❌ Erro no loop da Roleta:', error);
            // Se algo crashar (ex: canal apagado), liberta a mesa para não bugar o servidor
            ActiveTables.delete(canalId);
        }
    }
};