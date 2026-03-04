const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'eco_rem_vip_submit_', // 👇 Correção de Roteamento AQUI
    async execute(interaction) {
        const userId = interaction.fields.getTextInputValue('userId').trim();
        try {
            const userCheck = await prisma.hypeUser.findUnique({ where: { id: userId } });
            
            if (!userCheck) return interaction.reply({ content: `❌ **Erro:** O jogador não possui registos.`, ephemeral: true });
            if (userCheck.vipLevel === 0) return interaction.reply({ content: `⚠️ **Aviso:** O jogador <@${userId}> já não é VIP.`, ephemeral: true });

            await prisma.hypeUser.update({
                where: { id: userId },
                data: { vipLevel: 0, vipExpiresAt: null }
            });

            await interaction.reply({ content: `✅ **Magnata Despromovido!** O nível VIP do jogador <@${userId}> foi **removido**.`, ephemeral: true });
        } catch (error) {
            console.error('Erro ao remover VIP:', error);
            await interaction.reply({ content: `❌ **Erro de Sistema:** Não foi possível remover o VIP.`, ephemeral: true });
        }
    }
};