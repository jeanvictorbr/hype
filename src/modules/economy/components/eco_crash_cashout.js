const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'eco_crash_cashout_',

    async execute(interaction, client) {
        const ownerId = interaction.customId.replace('eco_crash_cashout_', '');

        if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: '❌ Deixe o piloto em paz, o foguetão não é seu!', flags: [MessageFlags.Ephemeral] });
        }

        const game = client.activeCrash?.get(ownerId);
        
        if (!game || game.status !== 'flying') {
            return interaction.reply({ content: '❌ Tarde demais! O jogo já terminou ou você já pulou.', flags: [MessageFlags.Ephemeral] });
        }

        // MARCA COMO SUCESSO (Isso quebra o Loop no outro arquivo imediatamente)
        game.status = 'cashed_out';
        client.activeCrash.set(ownerId, game);

        // Calcula os ganhos baseados no multiplicador do exato momento em que clicou
        const profit = Math.floor(game.bet * game.multiplier);

        // Paga o jogador
        await prisma.hypeUser.update({
            where: { id: ownerId },
            data: { hypeCash: { increment: profit } }
        });

        // Dá uma resposta efémera a confirmar (O ecrã principal vai atualizar no loop)
        await interaction.reply({ 
            content: `🪂 **Você saltou com segurança!** Garantiu um prémio de **${profit} HC**! O painel vai atualizar em instantes...`, 
            flags: [MessageFlags.Ephemeral] 
        });
    }
};