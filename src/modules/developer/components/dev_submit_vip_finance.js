const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    // 👇 Mudou para eco_
    customIdPrefix: 'eco_submit_vip_finance_',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const guildId = interaction.customId.replace('eco_submit_vip_finance_', '');
        
        const mpToken = interaction.fields.getTextInputValue('mp_token').trim();
        const priceVip1Str = interaction.fields.getTextInputValue('price_vip1').replace(',', '.');
        const priceVip2Str = interaction.fields.getTextInputValue('price_vip2').replace(',', '.');
        const priceVip3Str = interaction.fields.getTextInputValue('price_vip3').replace(',', '.');

        const priceVip1 = parseFloat(priceVip1Str);
        const priceVip2 = parseFloat(priceVip2Str);
        const priceVip3 = parseFloat(priceVip3Str);

        if (isNaN(priceVip1) || isNaN(priceVip2) || isNaN(priceVip3)) {
            return interaction.editReply('❌ **Erro:** Pelo menos um dos preços informados não é um número válido. Use pontos ou vírgulas (Ex: 15.50).');
        }

        try {
            await prisma.vipConfig.upsert({
                where: { guildId: guildId },
                update: {
                    mpAccessToken: mpToken,
                    priceVip1: priceVip1,
                    priceVip2: priceVip2,
                    priceVip3: priceVip3
                },
                create: {
                    guildId: guildId,
                    mpAccessToken: mpToken,
                    priceVip1: priceVip1,
                    priceVip2: priceVip2,
                    priceVip3: priceVip3
                }
            });

            await interaction.editReply(`✅ **Sucesso!** Configurações financeiras salvas para este servidor:\n\n🥉 **VIP 1:** R$ ${priceVip1.toFixed(2)}\n🥈 **VIP 2:** R$ ${priceVip2.toFixed(2)}\n🥇 **VIP 3:** R$ ${priceVip3.toFixed(2)}\n\nO token do Mercado Pago foi atualizado!`);

        } catch (error) {
            console.error('❌ Erro ao salvar configurações financeiras VIP:', error);
            await interaction.editReply('❌ Ocorreu um erro interno ao salvar as configurações.');
        }
    }
};