const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    // Escuta qualquer um dos 3 Select Menus
    customIdPrefix: 'eco_set_vip_role_',

    async execute(interaction, client) {
        await interaction.deferUpdate();

        // O customId chega assim: eco_set_vip_role_1_123456789
        const parts = interaction.customId.split('_');
        const nivel = parts[4]; // Vai ser '1', '2' ou '3'
        const guildId = parts[5];
        
        // Se values[0] for undefined, significa que o admin desmarcou a opção (quer apagar o cargo)
        const roleId = interaction.values.length > 0 ? interaction.values[0] : null;

        try {
            // Prepara a atualização dinâmica dependendo do nível que ele escolheu
            let updateData = {};
            if (nivel === '1') updateData.roleVip1 = roleId;
            if (nivel === '2') updateData.roleVip2 = roleId;
            if (nivel === '3') updateData.roleVip3 = roleId;

            // Salva na Base de Dados
            await prisma.vipConfig.upsert({
                where: { guildId: guildId },
                update: updateData,
                create: { guildId: guildId, ...updateData }
            });

            // Re-renderiza a mensagem chamando o próprio ficheiro do painel para a pessoa ver a mudança na hora!
            const painelCommand = client.components.get('eco_manage_vip_roles_');
            if (painelCommand) {
                // Modificamos temporariamente o customId da interação para fingir que ele clicou no botão de abrir o painel
                interaction.customId = `eco_manage_vip_roles_${guildId}`;
                await painelCommand.execute(interaction, client);
            }

        } catch (error) {
            console.error('❌ Erro ao salvar cargo VIP:', error);
            await interaction.followUp({ content: '❌ Erro ao guardar o cargo na base de dados.', flags: [MessageFlags.Ephemeral] });
        }
    }
};