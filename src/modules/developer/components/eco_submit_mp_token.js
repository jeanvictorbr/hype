const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'eco_submit_mp_token_',

    async execute(interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        const guildId = interaction.customId.replace('eco_submit_mp_token_', '');
        const mpToken = interaction.fields.getTextInputValue('mp_token').trim();

        try {
            await prisma.vipConfig.upsert({
                where: { guildId: guildId },
                update: { mpAccessToken: mpToken },
                create: { guildId: guildId, mpAccessToken: mpToken }
            });

            await interaction.editReply(`✅ **Token do Mercado Pago vinculado com sucesso!** O servidor já pode receber pagamentos reais.`);
        } catch (error) {
            console.error('❌ Erro ao salvar token MP:', error);
            await interaction.editReply('❌ Ocorreu um erro interno.');
        }
    }
};