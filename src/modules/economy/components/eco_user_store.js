const { 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    MessageFlags,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_user_store',

    async execute(interaction, client) {
        await interaction.deferUpdate();

        const guildId = interaction.guild.id;

        try {
            const storeItems = await prisma.storeItem.findMany({
                where: { guildId: guildId },
                orderBy: { price: 'asc' } 
            });

            const rowBack = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('eco_return_main')
                    .setLabel('Voltar para o Cartão')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('↩️')
            );

            if (storeItems.length === 0) {
                const emptyText = new TextDisplayBuilder()
                    .setContent('## 🛒 Vitrine Hype\n\nPoxa, as prateleiras estão vazias no momento. A gerência ainda está abastecendo o estoque. Volte mais tarde!');
                
                const emptyContainer = new ContainerBuilder()
                    .setAccentColor(0x2b2d31) 
                    .addTextDisplayComponents(emptyText)
                    .addActionRowComponents(rowBack); // Adicionado botão de voltar quando vazio

                return interaction.editReply({
                    components: [emptyContainer],
                    flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
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
                    .setLabel(`${item.name} — 💰 ${item.price} HC`)
                    .setDescription(limitDesc)
                    .setValue(item.id); 
                
                selectMenu.addOptions(option);
            });

            const rowMenu = new ActionRowBuilder().addComponents(selectMenu);
            
            const storeText = new TextDisplayBuilder()
                .setContent(`# 🛒 Vitrine Hype\nEscolha um item abaixo no menu para inspecionar os detalhes e realizar a compra com o seu **HypeCash**.`);
            
            const storeContainer = new ContainerBuilder()
                .setAccentColor(0x5865F2) 
                .addTextDisplayComponents(storeText)
                .addActionRowComponents(rowMenu)
                .addActionRowComponents(rowBack); // Adicionado botão de voltar embaixo do menu

            await interaction.editReply({
                components: [storeContainer],
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral]
            });

        } catch (error) {
            console.error('❌ Erro ao abrir a lojinha:', error);
        }
    }
};