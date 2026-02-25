const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');
const cassinoEngine = require('./cassino_tigrinho_engine');

module.exports = {
    customIdPrefix: 'eco_tigrinho_modal_',

    async execute(interaction, client) {
        const ownerId = interaction.customId.replace('eco_tigrinho_modal_', '');

        // Trava Final de Segurança
        if (interaction.user.id !== ownerId) return;

        // Pega o que o utilizador digitou
        const newBetText = interaction.fields.getTextInputValue('new_bet_amount');
        const newBetAmount = parseInt(newBetText);

        if (isNaN(newBetAmount) || newBetAmount < 10) {
            return interaction.reply({ content: '❌ Valor inválido. A aposta mínima é 10 HC.', flags: [MessageFlags.Ephemeral] });
        }

        // "Avisa" o Discord que vamos processar e permite editar a mensagem dos botões
        await interaction.deferUpdate(); 

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            // Verifica módulo Cassino
            const dbGuild = await prisma.guild.findUnique({ where: { id: guildId } });
            if (!dbGuild || !dbGuild.features.includes('CASSINO')) return;

            // Verifica Saldo
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            if (!userProfile || userProfile.hypeCash < newBetAmount) {
                return interaction.followUp({ content: `❌ Saldo insuficiente para apostar **${newBetAmount} HC**!`, flags: [MessageFlags.Ephemeral] });
            }

            // Desconta o NOVO dinheiro
            await prisma.hypeUser.update({
                where: { id: userId },
                data: { hypeCash: { decrement: newBetAmount } }
            });

            // Apaga os botões antigos da máquina anterior para não acumularem
            await interaction.message.edit({ components: [] }).catch(() => {});

            // Roda o motor do Cassino NOVAMENTE com o valor NOVO!
            await cassinoEngine.run(interaction, client, newBetAmount, userProfile.hypeCash - newBetAmount);

        } catch (error) {
            console.error('Erro na nova aposta do Tigrinho:', error);
        }
    }
};