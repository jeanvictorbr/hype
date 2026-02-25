const { SlashCommandBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateCrashImage } = require('../../../utils/canvasCrash');

// Gera o ponto de explosão com lógica de cassino (Risco Exponencial)
function getCrashPoint() {
    const r = Math.random();
    if (r < 0.05) return 1.00; // 5% de probabilidade de estourar instantaneamente (Azar extremo)
    const multiplier = 1.00 / (1.00 - r * 0.95);
    return parseFloat(multiplier.toFixed(2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crash')
        .setDescription('🚀 Suba no foguetão Hype e multiplique, mas pule antes que exploda!')
        .addIntegerOption(option => 
            option.setName('aposta')
                .setDescription('Quantas HypeCoins quer apostar?')
                .setRequired(true)
                .setMinValue(10)
        ),

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const betAmount = interaction.options.getInteger('aposta');

        try {
            const dbGuild = await prisma.guild.findUnique({ where: { id: guildId } });
            if (!dbGuild || !dbGuild.features.includes('CASSINO')) return interaction.editReply('❌ Cassino desativado.');

            const userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            if (!userProfile || userProfile.hypeCash < betAmount) return interaction.editReply('❌ Saldo insuficiente.');

            // Cobra Aposta
            await prisma.hypeUser.update({
                where: { id: userId },
                data: { hypeCash: { decrement: betAmount } }
            });

            // 1. PREPARA A SESSÃO DE JOGO
            const crashPoint = getCrashPoint();
            const gameState = { status: 'flying', multiplier: 1.00, crashPoint, bet: betAmount };
            
            if (!client.activeCrash) client.activeCrash = new Map();
            client.activeCrash.set(userId, gameState);

            // 2. GERA IMAGEM INICIAL
            let imageBuffer = await generateCrashImage(gameState.multiplier, gameState.status);
            let attachment = new AttachmentBuilder(imageBuffer, { name: 'crash.png' });

            const embed = new EmbedBuilder()
                .setColor('#FEE75C') // Amarelo
                .setTitle('🚀 CRASH HYPE')
                .setDescription(`**Piloto:** <@${userId}>\n**Aposta:** ${betAmount} HC\n\n🟢 O foguetão está a subir! Pule antes que exploda!`)
                .setImage('attachment://crash.png');

            const cashoutBtn = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`eco_crash_cashout_${userId}`).setLabel('💰 PULAR DO FOGUETE').setStyle(ButtonStyle.Success)
            );

            // Envia a mensagem pública e apaga a "pensar"
            const gameMessage = await interaction.channel.send({ embeds: [embed], components: [cashoutBtn], files: [attachment] });
            await interaction.deleteReply();

            // ==========================================
            // 3. O LOOP DO FOGUETÃO (A MÁGICA AO VIVO)
            // ==========================================
            let stepRate = 0.15; // Velocidade de subida inicial

            while (true) {
                // Espera 1.8 segundos entre cada frame para não levar block da API do Discord
                await new Promise(r => setTimeout(r, 1800));

                // Verifica se o jogador clicou no botão entretanto
                const currentGameState = client.activeCrash.get(userId);
                if (!currentGameState || currentGameState.status !== 'flying') break; // Ele saltou ou o jogo acabou!

                // Sobe o multiplicador de forma exponencial (fica mais rápido com o tempo)
                gameState.multiplier += stepRate;
                stepRate *= 1.3; 
                let currentMult = parseFloat(gameState.multiplier.toFixed(2));

                // VERIFICA O CRASH
                if (currentMult >= gameState.crashPoint) {
                    gameState.multiplier = gameState.crashPoint;
                    gameState.status = 'crashed';
                    client.activeCrash.set(userId, gameState); // Atualiza estado
                    break; 
                }

                // ATUALIZA A IMAGEM AO VIVO SE AINDA ESTIVER A VOAR
                imageBuffer = await generateCrashImage(gameState.multiplier, gameState.status);
                attachment = new AttachmentBuilder(imageBuffer, { name: 'crash.png' });

                embed.setDescription(`**Piloto:** <@${userId}>\n**Aposta:** ${betAmount} HC\n\n🟢 O foguetão está a subir! Pule antes que exploda!`);
                
                // Edita a mensagem com a nova imagem e anexo atualizado
                await gameMessage.edit({ embeds: [embed], components: [cashoutBtn], files: [attachment], attachments: [] }).catch(() => {});
            }

            // ==========================================
            // 4. FIM DE JOGO (CRASH OU SUCESSO)
            // ==========================================
            // O Loop parou. Vamos ver porquê.
            const finalState = client.activeCrash.get(userId) || gameState;
            client.activeCrash.delete(userId); // Limpa da memória

            imageBuffer = await generateCrashImage(finalState.multiplier, finalState.status);
            attachment = new AttachmentBuilder(imageBuffer, { name: 'crash.png' });

            if (finalState.status === 'crashed') {
                // PERDEU TUDO
                embed.setColor('#ED4245')
                     .setTitle('💥 FOGUETÃO DESTRUÍDO')
                     .setDescription(`**Piloto:** <@${userId}>\n**Aposta:** ${betAmount} HC\n**Perdeu:** 💸 -${betAmount} HC\n\nDemorou muito tempo! O foguetão explodiu em **${finalState.crashPoint}x**.`);
            } else if (finalState.status === 'cashed_out') {
                // SALTOU A TEMPO (Foi processado no botão)
                const profit = Math.floor(betAmount * finalState.multiplier);
                embed.setColor('#57F287')
                     .setTitle('💸 RETIRADA SEGURA!')
                     .setDescription(`**Piloto:** <@${userId}>\n**Aposta:** ${betAmount} HC\n**Lucro:** 💰 +${profit} HC\n\nSaltou do foguetão em **${finalState.multiplier.toFixed(2)}x** em segurança!`);
            }

            // Edita a última vez tirando os botões
            await gameMessage.edit({ embeds: [embed], components: [], files: [attachment], attachments: [] }).catch(() => {});

        } catch (error) {
            console.error('Erro Crash:', error);
        }
    }
};