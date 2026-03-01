const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'dev_wipe_confirm',

    async execute(interaction) {
        // Dupla verificação de segurança no botão
        const ownerIds = process.env.OWNER_ID ? process.env.OWNER_ID.split(',') : [];
        if (!ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ Acesso Negado.', flags: [MessageFlags.Ephemeral] });
        }

        await interaction.deferUpdate();

        try {
            // Executa o "Wipe" Universal: Define Carteira e Banco para zero em todas as linhas
            const result = await prisma.hypeUser.updateMany({
                data: {
                    carteira: 0,
                    hypeCash: 0
                }
            });

            await interaction.editReply({
                content: `✅ **O APOCALIPSE FINANCEIRO ACONTECEU!**\nO saldo de **${result.count} jogadores** foi completamente reduzido a cinzas (R$ 0 na Carteira e no Banco). A economia do servidor recomeça agora!`,
                components: []
            });

        } catch (error) {
            console.error('❌ Erro no wipeeconomy:', error);
            await interaction.editReply({ 
                content: '❌ Ocorreu um erro crítico ao tentar limpar a base de dados.', 
                components: [] 
            });
        }
    }
};