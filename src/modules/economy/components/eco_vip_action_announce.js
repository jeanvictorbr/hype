const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_vip_action_announce',

    async execute(interaction, client) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            // 1. VERIFICAÇÃO HÍBRIDA DE SEGURANÇA E COOLDOWN
            const [userProfile, config] = await Promise.all([
                prisma.hypeUser.findUnique({ where: { id: userId } }),
                prisma.vipConfig.findUnique({ where: { guildId } })
            ]);
            
            const member = interaction.member;

            const isVip2 = (userProfile?.vipLevel >= 2) || 
                           (config?.roleVip2 && member.roles.cache.has(config.roleVip2)) ||
                           (config?.roleVip3 && member.roles.cache.has(config.roleVip3));

            if (!isVip2) {
                return interaction.reply({ 
                    content: '❌ **Acesso Negado:** Este benefício requer o cargo de **VIP Camarote (Nível 2)** ou superior.', 
                    flags: [MessageFlags.Ephemeral] 
                });
            }

            // ⏳ VERIFICAÇÃO DE COOLDOWN (24 HORAS)
            if (userProfile?.lastAnnounce) {
                const diffTime = new Date() - new Date(userProfile.lastAnnounce);
                const diffHours = diffTime / (1000 * 60 * 60);
                
                if (diffHours < 24) {
                    const remainingHours = (24 - diffHours).toFixed(1);
                    return interaction.reply({ 
                        content: `⏳ **Calma aí, Patrão!** O seu megafone está a recarregar. Você poderá enviar um novo Anúncio Global daqui a **${remainingHours} horas**.`, 
                        flags: [MessageFlags.Ephemeral] 
                    });
                }
            }

            // 2. CONSTRUÇÃO DO MODAL COM IMAGEM OPCIONAL
            const modal = new ModalBuilder()
                .setCustomId('eco_modal_announce_submit')
                .setTitle('📢 Anúncio VIP Global');

            const titleInput = new TextInputBuilder()
                .setCustomId('ann_title')
                .setLabel('Título da Mensagem')
                .setPlaceholder('Ex: PROMOÇÃO NA MINHA LOJA!')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(50)
                .setRequired(true);

            const descInput = new TextInputBuilder()
                .setCustomId('ann_desc')
                .setLabel('Sua Mensagem')
                .setPlaceholder('Escreva o que você quer anunciar para todo o servidor...')
                .setStyle(TextInputStyle.Paragraph)
                .setMaxLength(500)
                .setRequired(true);

            const imageInput = new TextInputBuilder()
                .setCustomId('ann_image')
                .setLabel('Link da Imagem (Opcional)')
                .setPlaceholder('https://... (Terminando em .png ou .jpg)')
                .setStyle(TextInputStyle.Short)
                .setRequired(false); // Opcional!

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(descInput),
                new ActionRowBuilder().addComponents(imageInput) // Novo campo
            );

            await interaction.showModal(modal);

        } catch (error) {
            console.error('❌ Erro ao abrir modal de anúncio:', error);
            await interaction.reply({ content: '❌ Erro ao validar o VIP. Tente novamente.', flags: [MessageFlags.Ephemeral] });
        }
    }
};