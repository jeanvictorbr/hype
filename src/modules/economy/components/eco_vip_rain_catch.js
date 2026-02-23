const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'eco_vip_rain_catch_',

    async execute(interaction, client) {
        const dropId = interaction.customId.replace('eco_vip_rain_catch_', '');
        const rain = client.activeRains?.get(dropId);

        if (!rain) return interaction.reply({ content: '❌ A chuva já acabou ou já levaram tudo!', flags: [MessageFlags.Ephemeral] });

        if (rain.participants.has(interaction.user.id)) {
            return interaction.reply({ content: '⚠️ Você já agarrou a sua nota! Deixe para os outros.', flags: [MessageFlags.Ephemeral] });
        }

        // Adiciona o jogador à lista de ganhadores
        rain.participants.add(interaction.user.id);

        if (rain.participants.size >= rain.max) {
            // Atingiu o limite de 5 pessoas! Distribui o dinheiro!
            client.activeRains.delete(dropId);
            
            const slice = Math.floor(rain.amount / rain.max);
            const winners = Array.from(rain.participants);
            
            // Entrega as moedas (O Upsert garante que se o cara for novo, a conta é criada)
            for (const p of winners) {
                await prisma.hypeUser.upsert({ 
                    where: { id: p }, 
                    create: { id: p, hypeCash: slice },
                    update: { hypeCash: { increment: slice } }
                });
            }
            
            const winnersMentions = winners.map(w => `<@${w}>`).join(', ');
            
            await interaction.message.edit({
                content: `💸 **CHUVA ENCERRADA!** O dinheiro acabou. 💸\n\nO Dono do Baile <@${rain.host}> bancou **${rain.amount} HC**!\n\n🏆 **Vencedores:** ${winnersMentions}\n💰 Cada um embolsou **${slice} HC** direto na conta!`,
                components: []
            });
            
            await interaction.reply({ content: `✅ Boa! Você foi rápido e garantiu **${slice} HC** da chuva!`, flags: [MessageFlags.Ephemeral] });
        } else {
            // Ainda faltam pessoas, apenas avisa que ele está dentro
            const faltam = rain.max - rain.participants.size;
            await interaction.reply({ content: `✅ Você apanhou uma nota! Aguarde mais ${faltam} pessoa(s) para o prêmio ser dividido.`, flags: [MessageFlags.Ephemeral] });
        }
    }
};