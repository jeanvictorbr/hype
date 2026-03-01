const { MessageFlags, AttachmentBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'eco_shop_buy_',

    async execute(interaction) {
        const ownerId = interaction.customId.replace('eco_shop_buy_', '');
        const item = interaction.values[0];

        if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: '❌ Esta loja não é tua!', flags: [MessageFlags.Ephemeral] });
        }

        const userProfile = await prisma.hypeUser.findUnique({ where: { id: ownerId } });
        
        // PREÇOS E NOMES EM PT-BR
        const prices = { 'colete': 300000, 'pecabra': 200000, 'disfarce': 250000 };
        const itemNames = { 'colete': 'Colete Balístico', 'pecabra': 'Pé de Cabra', 'disfarce': 'Kit de Disfarce' };
        const itemPrice = prices[item];

        if (userProfile.hypeCash < itemPrice) {
            return interaction.reply({ content: `❌ Saldo insuficiente no banco! Você precisa de **R$ ${itemPrice.toLocaleString('pt-BR')}**.`, flags: [MessageFlags.Ephemeral] });
        }

        try {
            let updateData = { hypeCash: { decrement: itemPrice } };
            let feedbackBR = "";

            if (item === 'colete') {
                if (userProfile.hasColete) return interaction.reply({ content: '🛡️ Você já tem um colete equipado.', flags: [MessageFlags.Ephemeral] });
                updateData.hasColete = true;
                feedbackBR = "Colete Balístico equipado! Você está protegido contra o próximo assalto.";
            } else if (item === 'pecabra') {
                updateData.peDeCabraExp = new Date(Date.now() + 24 * 60 * 60 * 1000);
                feedbackBR = "Pé de Cabra adquirido! Suas chances de roubo subiram em 15% por 24h.";
            } else if (item === 'disfarce') {
                if (userProfile.disfarceUses > 0) return interaction.reply({ content: '🎭 Você já tem um disfarce ativo.', flags: [MessageFlags.Ephemeral] });
                updateData.disfarceUses = 3;
                feedbackBR = "Kit Disfarce pronto! Suas próximas 3 multas serão reduzidas em 50%.";
            }

            // Executa a compra no Banco de Dados
            await prisma.hypeUser.update({ where: { id: ownerId }, data: updateData });

            // ==========================================
            // GERAR RECIBO VISUAL (Canvas) PURE PT-BR
            // ==========================================
            const { generatePurchaseReceipt } = require('../../../utils/canvasRecibo');
            
            // Passa o nome legível, o feedback em BR e o preço
            const imageBuffer = await generatePurchaseReceipt(
                interaction.user.username, 
                itemNames[item], 
                item, // Passa a key para pegar a imagem certa
                itemPrice, 
                feedbackBR
            );
            
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'recibo.png' });

            // ATUALIZA A MENSAGEM NA HORA PARA O SELECT NÃO FICAR TRAVADO
            return interaction.update({ 
                content: `<@${ownerId}>, sua compra foi processada!`, 
                embeds: [], // Remove o embed de texto antigo
                components: [], // Remove o select menu
                files: [attachment] // Envia o recibo visual
            });

        } catch (e) {
            console.error(e);
            interaction.reply({ content: '❌ Erro ao processar a compra.', flags: [MessageFlags.Ephemeral] });
        }
    }
};