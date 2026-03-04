const { MessageFlags, AttachmentBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'eco_shop_buy_',

    async execute(interaction) {
        const ownerId = interaction.customId.replace('eco_shop_buy_', '');
        const item = interaction.values ? interaction.values[0] : null;

        if (!item) return interaction.reply({ content: '❌ Erro ao ler o item.', flags: [MessageFlags.Ephemeral] });

        if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: '❌ Essa loja não é sua!', flags: [MessageFlags.Ephemeral] });
        }

        const userProfile = await prisma.hypeUser.findUnique({ where: { id: ownerId } });
        
        // 👇 PREÇOS NOVOS
        const prices = { 'colete': 150000, 'pecabra': 50000, 'disfarce': 30000 };
        const itemNames = { 'colete': 'Colete Balístico', 'pecabra': 'Pé de Cabra', 'disfarce': 'Kit de Disfarce' };
        const itemPrice = prices[item];

        // 🛡️ TRAVAS DE SEGURANÇA (Verifica se já tem ativo no tempo atual)
        const now = new Date();
        
        if (item === 'colete' && userProfile.coleteExp && new Date(userProfile.coleteExp).getTime() > now.getTime()) {
            const expireUnix = Math.floor(new Date(userProfile.coleteExp).getTime() / 1000);
            return interaction.reply({ content: `🛡️ Você já está com um **Colete Balístico** ativo! Ele expira <t:${expireUnix}:R>.`, flags: [MessageFlags.Ephemeral] });
        }
        if (item === 'disfarce' && userProfile.disfarceUses > 0) {
            return interaction.reply({ content: `🎭 Você ainda tem **${userProfile.disfarceUses} usos** do Kit de Disfarce ativos!`, flags: [MessageFlags.Ephemeral] });
        }
        if (item === 'pecabra' && userProfile.peDeCabraExp && new Date(userProfile.peDeCabraExp).getTime() > now.getTime()) {
            const expireUnix = Math.floor(new Date(userProfile.peDeCabraExp).getTime() / 1000);
            return interaction.reply({ content: `🪓 Você já tem um **Pé de Cabra** ativo! Ele expira <t:${expireUnix}:R>.`, flags: [MessageFlags.Ephemeral] });
        }

        // Verifica Saldo
        if (userProfile.hypeCash < itemPrice) {
            return interaction.reply({ content: `❌ Saldo insuficiente! Você precisa de **R$ ${itemPrice.toLocaleString('pt-BR')}** no banco.`, flags: [MessageFlags.Ephemeral] });
        }

        try {
            let updateData = { hypeCash: { decrement: itemPrice } };
            let benefit = "";
            let duration = "";

            if (item === 'colete') {
                updateData.coleteExp = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutos exatos
                benefit = "Imunidade a todos os assaltos.";
                duration = "Válido por 15 minutos.";
            } else if (item === 'pecabra') {
                updateData.peDeCabraExp = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutos exatos
                benefit = "+15% de chance em roubos.";
                duration = "Válido por 15 minutos.";
            } else if (item === 'disfarce') {
                updateData.disfarceUses = 3;
                benefit = "Multas policiais reduzidas em 50%.";
                duration = "Válido por 3 multas.";
            }

            await prisma.hypeUser.update({ where: { id: ownerId }, data: updateData });

            const { generatePurchaseReceipt } = require('../../../utils/canvasRecibo');
            const imageBuffer = await generatePurchaseReceipt(interaction.user, itemNames[item], itemPrice, benefit, duration);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'recibo.png' });

            return interaction.update({ 
                content: `📦 **Compra finalizada com sucesso, <@${ownerId}>!**`, 
                embeds: [], components: [], files: [attachment] 
            });

        } catch (e) {
            console.error(e);
            interaction.reply({ content: '❌ Ocorreu um erro no processamento da compra.', flags: [MessageFlags.Ephemeral] });
        }
    }
};