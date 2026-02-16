const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_force_close',

    async execute(interaction, client) {
        await interaction.deferUpdate();

        const channelId = interaction.values[0]; // ID do ticket selecionado

        try {
            // 1. Deleta do Banco de Dados (O MAIS IMPORTANTE)
            // Isso libera o usuário para abrir novos tickets
            await prisma.activeTicket.delete({
                where: { channelId: channelId }
            }).catch(() => {}); // Ignora erro se já não existir

            // 2. Tenta deletar o canal no Discord (Se ele ainda existir)
            const channel = interaction.guild.channels.cache.get(channelId);
            if (channel) {
                await channel.delete('Force Close via Painel Admin').catch(err => {
                    console.error('Erro ao deletar canal físico:', err);
                });
            }

            // 3. Feedback visual (Recarrega a lista)
            const ticketManager = require('./ticket_active_manager');
            await ticketManager.execute(interaction, client);
            
            // Mensagem flutuante de confirmação
            await interaction.followUp({ 
                content: `✅ Ticket \`${channelId}\` limpo do sistema com sucesso!`, 
                flags: [MessageFlags.Ephemeral] 
            });

        } catch (error) {
            console.error('Erro no Force Close:', error);
            await interaction.followUp({ content: '❌ Erro ao forçar fechamento.', flags: [MessageFlags.Ephemeral] });
        }
    }
};