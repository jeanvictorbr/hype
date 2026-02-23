const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_vip_action_rain',

    async execute(interaction, client) {
        const executor = interaction.member;
        const guildId = interaction.guild.id;

        try {
            // 🛡️ TRAVA DE SEGURANÇA (Apenas VIP 3)
            const [userProfile, config] = await Promise.all([
                prisma.hypeUser.findUnique({ where: { id: executor.id } }),
                prisma.vipConfig.findUnique({ where: { guildId } })
            ]);

            const isVip3 = (userProfile?.vipLevel >= 3) || (config?.roleVip3 && executor.roles.cache.has(config.roleVip3));

            if (!isVip3) {
                return interaction.reply({ content: '❌ **Acesso Negado:** Você precisa do cargo **Dono do Baile (VIP 3)** para fazer chover dinheiro.', flags: [MessageFlags.Ephemeral] });
            }

            // ⏳ COOLDOWN DE 12 HORAS
            if (userProfile?.lastMoneyRain) {
                const diffTime = new Date() - new Date(userProfile.lastMoneyRain);
                const diffHours = diffTime / (1000 * 60 * 60);
                if (diffHours < 12) {
                    return interaction.reply({ content: `⏳ A sua conta bancária está a recarregar. Volte daqui a ${(12 - diffHours).toFixed(1)} horas.`, flags: [MessageFlags.Ephemeral] });
                }
            }

            // 💰 ABRE O MODAL
            const modal = new ModalBuilder().setCustomId('eco_vip_rain_submit').setTitle('🌧️ Chuva de Dinheiro VIP');

            const amountInput = new TextInputBuilder()
                .setCustomId('rain_amount')
                .setLabel('Quantas moedas vai atirar? (Min: 500)')
                .setPlaceholder('Ex: 1000')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(amountInput));
            await interaction.showModal(modal);

        } catch (error) { 
            console.error('❌ Erro ao abrir modal de Chuva:', error);
            await interaction.reply({ content: '❌ Ocorreu um erro ao verificar o seu perfil VIP.', flags: [MessageFlags.Ephemeral] });
        }
    }
};