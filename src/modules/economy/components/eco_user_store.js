const { 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    MessageFlags
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_user_store',

    async execute(interaction, client) {
        // 👇 CORREÇÃO: Usa deferReply para abrir um Pop-Up sem quebrar a API V2!
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const guildId = interaction.guild.id;

        try {
            const storeItems = await prisma.storeItem.findMany({
                where: { guildId: guildId },
                orderBy: { price: 'asc' } 
            });

            if (storeItems.length === 0) {
                const emptyText = new TextDisplayBuilder()
                    .setContent('## 🛒 Vitrine Hype\n\nPoxa, as prateleiras estão vazias no momento. A gerência ainda está abastecendo o estoque. Volte mais tarde!');
                
                const emptyContainer = new ContainerBuilder()
                    .setAccentColor(0x2b2d31) 
                    .addTextDisplayComponents(emptyText);

                return interaction.editReply({
                    components: [emptyContainer],
                    flags: [MessageFlags.IsComponentsV2]
                });
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('eco_user_store_buy')
                .setPlaceholder('Selecione um item para inspecionar/comprar...')
                .setMinValues(1)
                .setMaxValues(1);

            storeItems.forEach(item => {
                const limitDesc = item.description ? item.description.substring(0, 95) + '...' : 'Item disponível para compra.';
                
                const option = new StringSelectMenuOptionBuilder()
                    .setLabel(`${item.name} — 💰 R$ ${item.price}`)
                    .setDescription(limitDesc)
                    .setValue(item.id); 
                
                selectMenu.addOptions(option);
            });

            const rowMenu = new ActionRowBuilder().addComponents(selectMenu);
            
            const storeText = new TextDisplayBuilder()
                .setContent(`# 🛒 Vitrine Hype\nEscolha um item abaixo no menu para inspecionar os detalhes e realizar a compra com o saldo do seu **Cartão Hype**.`);
            
            const storeContainer = new ContainerBuilder()
                .setAccentColor(0x5865F2) 
                .addTextDisplayComponents(storeText)
                .addActionRowComponents(rowMenu);

            // Apenas envia o container V2 limpo!
            await interaction.editReply({
                components: [storeContainer],
                flags: [MessageFlags.IsComponentsV2]
            });

        } catch (error) {
            console.error('❌ Erro ao abrir a lojinha:', error);
            await interaction.editReply({ content: '❌ Erro ao carregar a vitrine da loja.' });
        }
    }
};