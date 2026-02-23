const { ContainerBuilder, TextDisplayBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_user_daily',

    async execute(interaction, client) {
        await interaction.deferUpdate();

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            const [userProfile, config] = await Promise.all([
                prisma.hypeUser.findUnique({ where: { id: userId } }),
                prisma.vipConfig.findUnique({ where: { guildId } })
            ]);

            if (!userProfile) {
                await prisma.hypeUser.create({ data: { id: userId, hypeCash: 0, vipLevel: 0 } });
            }

            const rowBack = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('eco_return_main').setLabel('Voltar para o Cartão').setStyle(ButtonStyle.Secondary).setEmoji('↩️')
            );

            // COOLDOWN
            const now = new Date();
            if (userProfile?.lastDaily) {
                const lastClaim = new Date(userProfile.lastDaily);
                const diffTime = Math.abs(now - lastClaim);
                const diffHours = Math.floor(diffTime / (1000 * 60 * 60)); 

                if (diffHours < 24) {
                    const remainingHours = 24 - diffHours;
                    const cooldownContainer = new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ⏳ Calma aí, apressado!\nO carro forte da Hype só passa de novo daqui a **${remainingHours} horas**.`)).addActionRowComponents(rowBack);
                    return interaction.editReply({ components: [cooldownContainer], flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });
                }
            }

            // DEFINIR RECOMPENSA E VERIFICAR VIP
            const member = interaction.member;
            let reward = 100; 
            let nivelTexto = "Membro Comum";
            let isVip = false;

            if (userProfile?.vipLevel >= 3 || (config?.roleVip3 && member.roles.cache.has(config.roleVip3))) {
                reward = 1000; nivelTexto = "Dono do Baile (Ouro)"; isVip = true;
            } else if (userProfile?.vipLevel >= 2 || (config?.roleVip2 && member.roles.cache.has(config.roleVip2))) {
                reward = 500; nivelTexto = "Camarote (Prata)"; isVip = true;
            } else if (userProfile?.vipLevel >= 1 || (config?.roleVip1 && member.roles.cache.has(config.roleVip1))) {
                reward = 250; nivelTexto = "Pista Premium (Bronze)"; isVip = true;
            }

            let msgExtra = "";

            // 💸 O ROUBO DO AGIOTA 💸
            if (!isVip && config?.agiotaExpires && config?.agiotaId && config.agiotaId !== userId) {
                const agiotaTime = new Date(config.agiotaExpires);
                if (now < agiotaTime) {
                    // O pedágio tá ativo e a vítima NÃO é VIP!
                    const taxaRoubo = Math.floor(reward * 0.05); // Rouba 5%
                    reward -= taxaRoubo;

                    // Envia a grana roubada pro Agiota!
                    await prisma.hypeUser.update({
                        where: { id: config.agiotaId },
                        data: { hypeCash: { increment: taxaRoubo } }
                    });

                    msgExtra = `\n\n⚠️ **O PAU QUEBROU!** Você foi pego na blitz do pedágio. O Agiota VIP <@${config.agiotaId}> roubou **${taxaRoubo} moedas** (5%) do seu prémio. Compre um VIP para ganhar Imunidade e não ser mais taxado!`;
                }
            }

            // ENTREGA O QUE SOBROU (OU TUDO)
            await prisma.hypeUser.update({
                where: { id: userId },
                data: { hypeCash: { increment: reward }, lastDaily: now }
            });

            const novoSaldo = (userProfile?.hypeCash || 0) + reward;
            
            const successText = new TextDisplayBuilder()
                .setContent(`# 🎁 Recompensa Resgatada!\nVocê abriu a maleta diária e faturou **💰 ${reward} HypeCash**.\n\n**Seu Novo Saldo:** 💰 ${novoSaldo} HC\n*Bônus Aplicado:* Benefícios de ${nivelTexto}.${msgExtra}`);

            // Se for roubado, a tela fica amarela de aviso, se não, verde sucesso
            const corPainel = msgExtra ? 0xFEE75C : 0x57F287; 

            const successContainer = new ContainerBuilder()
                .setAccentColor(corPainel) 
                .addTextDisplayComponents(successText)
                .addActionRowComponents(rowBack);

            await interaction.editReply({ 
                components: [successContainer], 
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] 
            });

        } catch (error) {
            console.error('❌ Erro no Daily:', error);
            await interaction.followUp({ content: '❌ Ocorreu um erro ao processar o seu prêmio.', flags: [MessageFlags.Ephemeral] });
        }
    }
};