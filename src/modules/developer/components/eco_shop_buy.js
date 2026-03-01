const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'eco_shop_buy_', // Note que agora o ID termina no ID do usuário

    async execute(interaction) {
        const ownerId = interaction.customId.replace('eco_shop_buy_', '');
        const item = interaction.values[0]; // Pega o valor selecionado no menu

        if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: '❌ Esta loja não é tua!', flags: [MessageFlags.Ephemeral] });
        }

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: ownerId } });
            
            const prices = { 'colete': 200000, 'pecabra': 100000, 'disfarce': 150000 };
            const itemPrice = prices[item];

            if (userProfile.hypeCash < itemPrice) {
                return interaction.editReply(`❌ Precisas de **R$ ${itemPrice.toLocaleString('pt-BR')}** no Banco.`);
            }

            if (item === 'colete') {
                if (userProfile.hasColete) return interaction.editReply('🛡️ Já tens um colete equipado.');
                await prisma.hypeUser.update({ where: { id: ownerId }, data: { hypeCash: { decrement: itemPrice }, hasColete: true } });
                return interaction.editReply('✅ Colete equipado! O próximo assalto contra ti vai falhar.');
            }

            if (item === 'pecabra') {
                const expireDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                await prisma.hypeUser.update({ where: { id: ownerId }, data: { hypeCash: { decrement: itemPrice }, peDeCabraExp: expireDate } });
                return interaction.editReply('✅ Pé de Cabra comprado! +15% de chance de roubo por 24h.');
            }

            if (item === 'disfarce') {
                if (userProfile.disfarceUses > 0) return interaction.editReply('🎭 Já tens um disfarce ativo.');
                await prisma.hypeUser.update({ where: { id: ownerId }, data: { hypeCash: { decrement: itemPrice }, disfarceUses: 3 } });
                return interaction.editReply('✅ Kit Disfarce comprado! As tuas próximas 3 multas serão reduzidas em 50%.');
            }

        } catch (e) {
            console.error(e);
            interaction.editReply('❌ Erro no processamento.');
        }
    }
};