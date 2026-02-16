const { prisma } = require('../../../core/database');
const { MessageFlags } = require('discord.js');

module.exports = {
    customId: 'ticket_rank_reset_confirm',

    async execute(interaction, client) {
        if (!interaction.member.permissions.has('Administrator')) return;

        // Limpa a tabela para esta guilda
        await prisma.staffStats.deleteMany({
            where: { guildId: interaction.guild.id }
        });

        // Feedback
        await interaction.reply({ content: '✅ **Ranking resetado com sucesso!**', flags: [MessageFlags.Ephemeral] });

        // Recarrega o painel de ranking (que agora estará vazio)
        const panel = require('./ticket_ranking_panel');
        // Hack: passamos uma "falsa interação" de botão para ele usar update em vez de reply na msg original
        // Mas como já demos reply ephemeral acima, podemos mandar uma nova mensagem ou deixar o usuário voltar manualmente.
        // O ideal aqui é enviar um novo painel limpo no lugar do aviso de perigo.
        
        // Vamos forçar a atualização da mensagem original onde estava o aviso
        await interaction.message.edit({ components: [], content: '🔄 Ranking reiniciado.' });
        
        // Chama o painel novamente para mostrar a lista vazia
        await panel.execute(interaction, client);
    }
};