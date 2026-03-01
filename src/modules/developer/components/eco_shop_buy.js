const { MessageFlags, EmbedBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'eco_shop_buy_',

    async execute(interaction) {
        const ownerId = interaction.customId.replace('eco_shop_buy_', '');
        const item = interaction.values[0];

        if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: '❌ Esta loja não é tua!', flags: [MessageFlags.Ephemeral] });
        }

        // Busca o perfil para verificar saldo
        const userProfile = await prisma.hypeUser.findUnique({ where: { id: ownerId } });
        
        // NOVOS PREÇOS ACORDADOS
        const prices = { 'colete': 300000, 'pecabra': 200000, 'disfarce': 250000 };
        const itemNames = { 'colete': 'Colete Balístico', 'pecabra': 'Pé de Cabra', 'disfarce': 'Kit de Disfarce' };
        const itemPrice = prices[item];

        if (userProfile.hypeCash < itemPrice) {
            return interaction.reply({ content: `❌ Saldo insuficiente no banco! Precisas de **R$ ${itemPrice.toLocaleString('pt-BR')}**.`, flags: [MessageFlags.Ephemeral] });
        }

        try {
            let updateData = { hypeCash: { decrement: itemPrice } };
            let feedback = "";

            if (item === 'colete') {
                if (userProfile.hasColete) return interaction.reply({ content: '🛡️ Já tens um colete equipado.', flags: [MessageFlags.Ephemeral] });
                updateData.hasColete = true;
                feedback = "🛡️ **Colete Balístico equipado!** Estás protegido contra o próximo assalto.";
            } else if (item === 'pecabra') {
                updateData.peDeCabraExp = new Date(Date.now() + 24 * 60 * 60 * 1000);
                feedback = "🔨 **Pé de Cabra adquirido!** As tuas chances de roubo subiram em 15% por 24h.";
            } else if (item === 'disfarce') {
                if (userProfile.disfarceUses > 0) return interaction.reply({ content: '🎭 Já tens um disfarce ativo.', flags: [MessageFlags.Ephemeral] });
                updateData.disfarceUses = 3;
                feedback = "🎭 **Kit Disfarce pronto!** As tuas próximas 3 multas serão reduzidas em 50%.";
            }

            await prisma.hypeUser.update({ where: { id: ownerId }, data: updateData });

            // ATUALIZA A MENSAGEM NA HORA PARA O SELECT NÃO FICAR TRAVADO
            const successEmbed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('📦 COMPRA CONCLUÍDA NO BECO')
                .setDescription(`<@${ownerId}>, compraste **${itemNames[item]}** com sucesso!\n\n${feedback}`)
                .setFooter({ text: 'O Mercado Negro agradece a tua preferência.' });

            return interaction.update({ 
                content: '', 
                embeds: [successEmbed], 
                components: [], // Remove o select para indicar que acabou
                files: [] // Remove a imagem grande da loja para limpar o chat
            });

        } catch (e) {
            console.error(e);
            interaction.reply({ content: '❌ Erro ao processar a compra.', flags: [MessageFlags.Ephemeral] });
        }
    }
};