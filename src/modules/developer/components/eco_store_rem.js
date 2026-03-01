const { ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'eco_store_rem_',

    async execute(interaction) {
        const guildId = interaction.customId.replace('eco_store_rem_', '');
        
        // Vai buscar os itens do servidor atual ao Banco de Dados
        const items = await prisma.storeItem.findMany({ where: { guildId } });

        if (items.length === 0) {
            return interaction.reply({ 
                content: '❌ A loja deste servidor está vazia. Não há itens para remover.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // Cria as opções para o Menu (Limite do Discord é 25)
        const options = items.slice(0, 25).map(item => ({
            label: item.name,
            description: `Preço: R$ ${item.price.toLocaleString('pt-BR')} | ID: ${item.id.slice(0, 8)}...`,
            value: item.id,
            emoji: '📦'
        }));

        const selectMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`eco_store_del_${guildId}`)
                .setPlaceholder('Selecione o item para DELETAR...')
                .addOptions(options)
        );

        await interaction.reply({
            content: '⚠️ **MODO DE DESTRUIÇÃO:**\nSelecione o item que deseja remover permanentemente da loja deste servidor. *Esta ação não pode ser desfeita.*',
            components: [selectMenu],
            flags: [MessageFlags.Ephemeral]
        });
    }
};