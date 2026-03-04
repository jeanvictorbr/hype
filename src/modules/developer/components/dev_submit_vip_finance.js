const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'eco_submit_vip_finance_',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        const guildId = interaction.customId.replace('eco_submit_vip_finance_', '');
        
        // Converte as vírgulas para pontos se o cliente errar a digitação
        const p1 = parseFloat(interaction.fields.getTextInputValue('p1').replace(',', '.'));
        const p2 = parseFloat(interaction.fields.getTextInputValue('p2').replace(',', '.'));
        const p3 = parseFloat(interaction.fields.getTextInputValue('p3').replace(',', '.'));
        const p4 = parseFloat(interaction.fields.getTextInputValue('p4').replace(',', '.'));
        const p5 = parseFloat(interaction.fields.getTextInputValue('p5').replace(',', '.'));

        if (isNaN(p1) || isNaN(p2) || isNaN(p3) || isNaN(p4) || isNaN(p5)) {
            return interaction.editReply('❌ **Erro:** Use apenas números e pontos. (Ex: 15.50).');
        }

        try {
            await prisma.vipConfig.upsert({
                where: { guildId: guildId },
                update: { priceVip1: p1, priceVip2: p2, priceVip3: p3, priceVip4: p4, priceVip5: p5 },
                create: { guildId: guildId, priceVip1: p1, priceVip2: p2, priceVip3: p3, priceVip4: p4, priceVip5: p5 }
            });

            await interaction.editReply(`✅ **Preços Atualizados!**\n\n🥉 **BOOSTER:** R$ ${p1.toFixed(2)}\n🥈 **PRIME:** R$ ${p2.toFixed(2)}\n🥇 **EXCLUSIVE:** R$ ${p3.toFixed(2)}\n💎 **ELITE:** R$ ${p4.toFixed(2)}\n👑 **SUPREME:** R$ ${p5.toFixed(2)}`);
        } catch (error) {
            console.error('❌ Erro ao salvar preços:', error);
            await interaction.editReply('❌ Ocorreu um erro interno.');
        }
    }
};