const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'eco_tiger_spin_',

    async execute(interaction, client) {
        const parts = interaction.customId.replace('eco_tiger_spin_', '').split('_');
        const betAmount = parseInt(parts[0]);
        const ownerId = parts[1];

        if (interaction.user.id !== ownerId) return interaction.reply({ content: '❌ Esta máquina não é tua!', flags: [MessageFlags.Ephemeral] });

        await interaction.deferUpdate();

        const userProfile = await prisma.hypeUser.findUnique({ where: { id: ownerId } });
        if (!userProfile || userProfile.carteira < betAmount) {
            return interaction.followUp({ content: `❌ Não tem **R$ ${betAmount.toLocaleString('pt-BR')}** na carteira.`, flags: [MessageFlags.Ephemeral] });
        }

        await prisma.hypeUser.update({ where: { id: ownerId }, data: { carteira: { decrement: betAmount } } });

        const cassinoEngine = require('./cassino_tigrinho_engine');
        await cassinoEngine.run(interaction.channel, interaction.user, client, betAmount, false, interaction.message);
    }
};