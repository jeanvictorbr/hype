const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'eco_tiger_auto_',

    async execute(interaction, client) {
        const parts = interaction.customId.replace('eco_tiger_auto_', '').split('_');
        const betAmount = parseInt(parts[0]);
        const ownerId = parts[1];

        if (interaction.user.id !== ownerId) return interaction.reply({ content: '❌ Não toque na máquina!', flags: [MessageFlags.Ephemeral] });

        await interaction.deferUpdate();
        if (!client.activeTigers) client.activeTigers = new Map();

        // Cancela se já estiver ligado
        if (client.activeTigers.get(ownerId) === 'auto') {
            client.activeTigers.delete(ownerId);
            return interaction.followUp({ content: '🛑 Auto-Spin cancelado. A máquina vai parar.', flags: [MessageFlags.Ephemeral] });
        }

        const userProfile = await prisma.hypeUser.findUnique({ where: { id: ownerId } });
        if (!userProfile || userProfile.carteira < betAmount) {
            return interaction.followUp({ content: `❌ Sem dinheiro na carteira.`, flags: [MessageFlags.Ephemeral] });
        }

        client.activeTigers.set(ownerId, 'auto');
        await prisma.hypeUser.update({ where: { id: ownerId }, data: { carteira: { decrement: betAmount } } });

        const cassinoEngine = require('./cassino_tigrinho_engine');
        await cassinoEngine.run(interaction.channel, interaction.user, client, betAmount, true, interaction.message);
    }
};