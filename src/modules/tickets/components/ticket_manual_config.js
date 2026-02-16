const { prisma } = require('../../../core/database');

module.exports = {
    // 🚨 IMPORTANTE: O loader exige um ID exato para carregar o arquivo na memória.
    // Usamos este ID placeholder, mas a lógica real usa o prefixo abaixo.
    customId: 'ticket_manual_config_loader', 
    
    // O interactionCreate.js vai procurar por este prefixo
    customIdPrefix: 'ticket_manual_', 

    async execute(interaction, client) {
        // 1. Avisa o Discord que estamos processando (Evita "A interação falhou")
        await interaction.deferUpdate();

        const value = interaction.values[0];
        const isCat = interaction.customId === 'ticket_manual_cat';

        try {
            // 2. Atualiza no Banco
            await prisma.ticketConfig.upsert({
                where: { guildId: interaction.guild.id },
                create: { 
                    guildId: interaction.guild.id, 
                    ticketCategory: isCat ? value : null, 
                    logChannel: !isCat ? value : null,
                    staffRoles: [] 
                },
                update: { 
                    ticketCategory: isCat ? value : undefined,
                    logChannel: !isCat ? value : undefined
                }
            });

            // 3. Recarrega o Painel Principal (Hub) para mostrar a mudança
            const ticketHub = require('./ticket_config_hub');
            await ticketHub.execute(interaction, client);

        } catch (error) {
            console.error('Erro na config manual:', error);
            // Como usamos deferUpdate, não podemos usar reply normal se der erro
            await interaction.followUp({ content: '❌ Erro ao salvar configuração.', ephemeral: true });
        }
    }
};