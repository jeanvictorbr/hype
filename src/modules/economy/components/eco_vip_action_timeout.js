const { ActionRowBuilder, UserSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ContainerBuilder, TextDisplayBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_vip_action_timeout',

    async execute(interaction, client) {
        await interaction.deferUpdate();

        try {
            const [userProfile, config] = await Promise.all([
                prisma.hypeUser.findUnique({ where: { id: interaction.user.id } }),
                prisma.vipConfig.findUnique({ where: { guildId: interaction.guild.id } })
            ]);

            const isVip2 = (userProfile?.vipLevel >= 2) || 
                           (config?.roleVip2 && interaction.member.roles.cache.has(config.roleVip2)) ||
                           (config?.roleVip3 && interaction.member.roles.cache.has(config.roleVip3));

            if (!isVip2) return interaction.followUp({ content: '❌ Acesso Negado. Requer VIP Camarote (Nível 2).', flags: [MessageFlags.Ephemeral] });

            // VERIFICAÇÃO DE COOLDOWN (12 HORAS)
            if (userProfile?.lastTimeout) {
                const now = new Date();
                const lastUsed = new Date(userProfile.lastTimeout);
                const diffTime = Math.abs(now - lastUsed);
                const diffHours = diffTime / (1000 * 60 * 60);

                if (diffHours < 12) {
                    const remainingHours = (12 - diffHours).toFixed(1);
                    return interaction.followUp({ 
                        content: `⏳ **Pisa no freio, Chefe!** O seu poder de ditador está a recarregar. Volte daqui a **${remainingHours} horas**.`, 
                        flags: [MessageFlags.Ephemeral] 
                    });
                }
            }

            const rowBack = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('eco_user_config').setLabel('Voltar à Vitrine').setStyle(ButtonStyle.Secondary).setEmoji('↩️')
            );

            const container = new ContainerBuilder()
                .setAccentColor(0xED4245) // Vermelho Perigo
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🤫 Modo Mini-Ditador\n\nChegou a hora de mostrar quem manda. Selecione **um membro comum** abaixo para calar a boca dele por 60 segundos.\n\n⚠️ *Nota: Você não pode silenciar Staffs nem outros VIPs.*`));

            const userMenu = new ActionRowBuilder().addComponents(
                new UserSelectMenuBuilder()
                    .setCustomId('eco_vip_timeout_submit')
                    .setPlaceholder('Escolha a sua vítima...')
                    .setMinValues(1)
                    .setMaxValues(1)
            );

            await interaction.editReply({ 
                components: [container, userMenu, rowBack], 
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] 
            });

        } catch (error) {
            console.error(error);
        }
    }
};