const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');
const cassinoEngine = require('./cassino_tigrinho_engine');

module.exports = {
    customIdPrefix: 'eco_tigrinho_replay_',

    async execute(interaction, client) {
        // Extrai a Aposta e o ID do dono a partir do CustomId do botão
        // Exemplo: eco_tigrinho_replay_50_123456789012345678
        const parts = interaction.customId.replace('eco_tigrinho_replay_', '').split('_');
        const betAmount = parseInt(parts[0]);
        const ownerId = parts[1];

        // 🛡️ NOVA TRAVA ANTI-ROUBO BLINDADA
        if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: '❌ Este botão não lhe pertence! Digite `/tigrinho` para jogar na sua própria máquina.', flags: [MessageFlags.Ephemeral] });
        }

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        await interaction.deferUpdate();

        try {
            const dbGuild = await prisma.guild.findUnique({ where: { id: guildId } });
            if (!dbGuild || !dbGuild.features.includes('CASSINO')) return;

            const userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            if (!userProfile || userProfile.hypeCash < betAmount) {
                return interaction.followUp({ content: `❌ Saldo insuficiente. Faltam-lhe HypeCoins para tentar recuperar o prejuízo!`, flags: [MessageFlags.Ephemeral] });
            }

            // Desconta o dinheiro
            await prisma.hypeUser.update({
                where: { id: userId },
                data: { hypeCash: { decrement: betAmount } }
            });

            // Remove os botões da mensagem antiga
            await interaction.message.edit({ components: [] }).catch(() => {});

            // Roda o motor do Cassino NOVAMENTE!
            await cassinoEngine.run(interaction, client, betAmount, userProfile.hypeCash - betAmount);

        } catch (error) {
            console.error('Erro no Replay do Tigrinho:', error);
        }
    }
};