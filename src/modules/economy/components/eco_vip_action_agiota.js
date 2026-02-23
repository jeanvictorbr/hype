const { ContainerBuilder, TextDisplayBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateVipBanner } = require('../../../utils/canvasVIP');

module.exports = {
    customId: 'eco_vip_action_agiota',

    async execute(interaction, client) {
        await interaction.deferUpdate();

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            const [userProfile, config] = await Promise.all([
                prisma.hypeUser.findUnique({ where: { id: userId } }),
                prisma.vipConfig.findUnique({ where: { guildId } })
            ]);

            const isVip2 = (userProfile?.vipLevel >= 2) || 
                           (config?.roleVip2 && interaction.member.roles.cache.has(config.roleVip2)) ||
                           (config?.roleVip3 && interaction.member.roles.cache.has(config.roleVip3));

            if (!isVip2) return interaction.followUp({ content: '❌ Acesso Negado.', flags: [MessageFlags.Ephemeral] });

            // VERIFICA SE JÁ HÁ UM AGIOTA ATIVO NA GUILDA
            if (config?.agiotaExpires) {
                const now = new Date();
                const expires = new Date(config.agiotaExpires);

                if (now < expires) {
                    const timeLeft = Math.ceil((expires - now) / 60000); // Em minutos
                    return interaction.followUp({ 
                        content: `⚠️ **A praça já tem dono!** O membro <@${config.agiotaId}> está a cobrar pedágio no momento. Tente de novo daqui a ${timeLeft} minutos.`, 
                        flags: [MessageFlags.Ephemeral] 
                    });
                }
            }

            // ATIVA O NOVO AGIOTA (15 MINUTOS)
            const fifteenMinutesLater = new Date(new Date().getTime() + 15 * 60000);

            await prisma.vipConfig.update({
                where: { guildId: guildId },
                data: { 
                    agiotaId: userId,
                    agiotaExpires: fifteenMinutesLater
                }
            });

            // 🎨 GERA O CARD PREMIUM (Vermelho Perigo para o Agiota)
            const bannerBuffer = await generateVipBanner(
                interaction.user, 
                interaction.guild, 
                "O AGIOTA CHEGOU!", 
                "Cobrando 5% de taxa nos Dailys por 15m!", 
                "#ED4245" // Vermelho agressivo
            );
            const attachment = new AttachmentBuilder(bannerBuffer, { name: 'agiota.png' });

            // AVISA A GUILDA NO CHAT PÚBLICO COM A IMAGEM DE IMPACTO
            await interaction.channel.send({
                content: `🚨 **ATENÇÃO AO PEDÁGIO!** 🚨\nO Camarote <@${userId}> acabou de ativar o **Modo Agiota**! Durante os próximos 15 minutos, qualquer membro que tentar recolher o \`/daily\` vai ter **5% do prémio roubado** e enviado direto para a conta dele! 💸`,
                files: [attachment]
            });

            const rowBack = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('eco_user_config').setLabel('Voltar à Vitrine').setStyle(ButtonStyle.Secondary).setEmoji('↩️')
            );

            const successContainer = new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 💸 A Praça é Sua!\nVocê é o Dono do Pedágio pelos próximos **15 minutos**. Relaxe e deixe o dinheiro pingar na sua conta automaticamente quando os outros usarem o Daily.`));

            await interaction.editReply({ components: [successContainer, rowBack], flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });

        } catch (error) {
            console.error('Erro no Modo Agiota:', error);
            await interaction.followUp({ content: '❌ Erro ao ativar o modo agiota.', flags: [MessageFlags.Ephemeral] });
        }
    }
};