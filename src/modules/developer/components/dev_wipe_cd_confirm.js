const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'dev_wipe_cd_confirm',

    async execute(interaction) {
        const ownerIds = process.env.OWNER_ID ? process.env.OWNER_ID.split(',') : [];
        if (!ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ Acesso Negado.', flags: [MessageFlags.Ephemeral] });
        }

        await interaction.deferUpdate();

        try {
            // Executa o "Wipe" nos tempos: Define tudo para nulo em TODAS as linhas!
            const result = await prisma.hypeUser.updateMany({
                data: {
                    lastDaily: null,
                    lastSemanal: null,
                    lastMensal: null,
                    lastVipDaily: null,
                    lastRob: null,
                    lastGame: null,
                    lastBeijar: null,
                    lastTapa: null,
                    lastAbracar: null,
                    lastMorder: null,
                    lastPat: null,
                    lastSocar: null,
                    lastCafune: null,
                    lastAnnounce: null,
                    lastTimeout: null,
                    lastBlackout: null,
                    lastMoneyRain: null,
                    banRequestsCount: 0,
                    banRequestReset: null
                }
            });

            await interaction.editReply({
                content: `✅ **PURIFICAÇÃO CONCLUÍDA!**\nOs cooldowns de **${result.count} jogadores** foram completamente apagados da base de dados. Todo o servidor já pode coletar os prêmios novamente! 🚀`,
                components: []
            });

        } catch (error) {
            console.error('❌ Erro no wipecooldowns:', error);
            await interaction.editReply({ 
                content: '❌ Ocorreu um erro crítico ao tentar limpar os cooldowns do banco de dados.', 
                components: [] 
            });
        }
    }
};