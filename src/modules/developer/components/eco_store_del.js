const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'eco_store_del_',

    async execute(interaction) {
        // Pega no ID do item que selecionaste no menu
        const itemId = interaction.values[0];

        try {
            // Elimina o item do banco de dados
            const deletedItem = await prisma.storeItem.delete({
                where: { id: itemId }
            });

            // Atualiza a mensagem na hora e remove o menu de seleção
            await interaction.update({
                content: `🗑️ ✅ O item **"${deletedItem.name}"** foi completamente apagado da base de dados. Já não aparecerá na loja do servidor!`,
                components: [] 
            });

        } catch (error) {
            console.error('Erro ao deletar item da loja:', error);
            await interaction.reply({ 
                content: '❌ Ocorreu um erro ao tentar remover o item. Ele pode já ter sido apagado ou não existe.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }
    }
};