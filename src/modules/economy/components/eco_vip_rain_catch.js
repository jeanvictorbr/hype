const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'eco_vip_rain_catch_',

    async execute(interaction, client) {
        const dropId = interaction.customId.replace('eco_vip_rain_catch_', '');
        const rain = client.activeRains?.get(dropId);

        // 1. Verifica se a chuva ainda existe
        if (!rain) {
            return interaction.reply({ 
                content: '❌ O vento levou as notas... A chuva já acabou ou já levaram tudo!', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // 2. Impede o jogador de pegar duas vezes na mesma chuva
        if (rain.participants.has(interaction.user.id)) {
            return interaction.reply({ 
                content: '⚠️ Tu já agarraste a tua nota! Deixa um pouco para os outros malandros.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // Adiciona o jogador à lista temporária de ganhadores
        rain.participants.add(interaction.user.id);

        // 3. Verifica se atingiu o limite de 5 pessoas
        if (rain.participants.size >= rain.max) {
            // Atingiu o limite! Vamos distribuir a grana
            client.activeRains.delete(dropId);
            
            const slice = Math.floor(rain.amount / rain.max);
            const winners = Array.from(rain.participants);
            
            // 🔥 ENTREGA OS R$ NA CARTEIRA (Dinheiro vivo na mão)
            for (const p of winners) {
                await prisma.hypeUser.upsert({ 
                    where: { id: p }, 
                    create: { id: p, carteira: slice }, // Cria conta com saldo na carteira
                    update: { carteira: { increment: slice } } // Incrementa saldo na carteira
                });
            }
            
            const winnersMentions = winners.map(w => `<@${w}>`).join(', ');
            
            // Edita a mensagem pública finalizando o evento
            await interaction.message.edit({
                content: `💸 **CHUVA ENCERRADA!** As notas acabaram. 💸\n\nO Patrão <@${rain.host}> bancou **R$ ${rain.amount.toLocaleString('pt-BR')}**!\n\n🏆 **Sortudos:** ${winnersMentions}\n💰 Cada um embolsou **R$ ${slice.toLocaleString('pt-BR')}** na carteira! Corram para o banco!`,
                components: [],
                files: [] // Remove o banner para limpar o chat após o fim
            });
            
            await interaction.reply({ 
                content: `✅ Boa! Foste rápido e garantiste **R$ ${slice.toLocaleString('pt-BR')}** da chuva!`, 
                flags: [MessageFlags.Ephemeral] 
            });
        } else {
            // Ainda não atingiu o limite de 5, apenas confirma a participação
            const faltam = rain.max - rain.participants.size;
            await interaction.reply({ 
                content: `✅ Pegaste uma nota no ar! Aguarda mais ${faltam} pessoa(s) para o prémio ser dividido.`, 
                flags: [MessageFlags.Ephemeral] 
            });
        }
    }
};