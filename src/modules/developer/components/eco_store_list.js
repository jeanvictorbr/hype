const { MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'eco_store_list_',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        
        const guildId = interaction.customId.replace('eco_store_list_', '');

        try {
            // Busca os itens desta guilda no banco de dados
            const items = await prisma.storeItem.findMany({ 
                where: { guildId: guildId } 
            });

            if (items.length === 0) {
                return interaction.editReply({ content: '❌ A Lojinha Hype deste servidor está vazia. Crie itens no botão "Criar Item".' });
            }

            // Monta a lista bonitinha
            let listaTexto = "";
            items.forEach((item, index) => {
                listaTexto += `**${index + 1}. ${item.name}**\n💰 Preço: **${item.price} HC**\n🏷️ Cargo Entregue: <@&${item.roleId}>\n\n`;
            });

            const header = new TextDisplayBuilder().setContent('## 📋 Itens da Lojinha Hype\nAbaixo estão todos os itens cadastrados que os jogadores podem comprar com HypeCash.');
            const list = new TextDisplayBuilder().setContent(listaTexto);

            const container = new ContainerBuilder()
                .setAccentColor(0x5865F2)
                .addTextDisplayComponents(header)
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(list);

            await interaction.editReply({ 
                components: [container], 
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] 
            });

        } catch (error) {
            console.error('❌ Erro ao listar itens da loja:', error);
            await interaction.editReply({ content: '❌ Erro ao buscar os itens no banco de dados.' });
        }
    }
};