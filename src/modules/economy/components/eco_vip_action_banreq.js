const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_vip_action_banreq',

    async execute(interaction, client) {
        try {
            const [userProfile, config] = await Promise.all([
                prisma.hypeUser.findUnique({ where: { id: interaction.user.id } }),
                prisma.vipConfig.findUnique({ where: { guildId: interaction.guild.id } })
            ]);

            const isVip3 = (userProfile?.vipLevel >= 3) || (config?.roleVip3 && interaction.member.roles.cache.has(config.roleVip3));

            if (!isVip3) return interaction.reply({ content: '❌ Acesso Negado. Requer **Dono do Baile (Nível 3)**.', flags: [MessageFlags.Ephemeral] });

            if (!config?.banRequestChannel) {
                return interaction.reply({ content: '❌ A Staff ainda não configurou o canal de Tribunal VIP no painel Dev.', flags: [MessageFlags.Ephemeral] });
            }

            // ==========================================
            // LÓGICA DO LIMITE SEMANAL (2 POR SEMANA)
            // ==========================================
            const now = new Date();
            let count = userProfile?.banRequestsCount || 0;
            let resetDate = userProfile?.banRequestReset ? new Date(userProfile.banRequestReset) : null;

            // Se a data de reset já passou, zera a conta
            if (resetDate && now > resetDate) {
                count = 0;
            }

            if (count >= 2) {
                const limitTime = Math.ceil((resetDate - now) / (1000 * 60 * 60 * 24)); // Em dias
                return interaction.reply({ 
                    content: `⏳ **Limite Semanal Atingido!** Você já enviou 2 solicitações de banimento esta semana. Seus poderes do tribunal serão restaurados em **${limitTime} dias**.`, 
                    flags: [MessageFlags.Ephemeral] 
                });
            }

            // ==========================================
            // ABRIR O FORMULÁRIO DO TRIBUNAL
            // ==========================================
            const modal = new ModalBuilder()
                .setCustomId('eco_vip_banreq_submit')
                .setTitle(`⚖️ Tribunal VIP (${count}/2 Usados)`);

            const accusedInput = new TextInputBuilder()
                .setCustomId('ban_accused')
                .setLabel('Nick Roblox ou ID do Discord do Acusado')
                .setPlaceholder('Ex: @jogadorzinho_toxico ou ID 1234567')
                .setStyle(TextInputStyle.Short)
                .setMaxLength(60)
                .setRequired(true);

            const motiveInput = new TextInputBuilder()
                .setCustomId('ban_motive')
                .setLabel('Motivo do Banimento')
                .setPlaceholder('Explique detalhadamente o que este usuário fez...')
                .setStyle(TextInputStyle.Paragraph)
                .setMinLength(10).setMaxLength(400)
                .setRequired(true);

            const proofInput = new TextInputBuilder()
                .setCustomId('ban_proof')
                .setLabel('Provas (Link de Imagem/Vídeo)')
                .setPlaceholder('https://prnt.sc/... ou https://youtube.com/...')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(accusedInput),
                new ActionRowBuilder().addComponents(motiveInput),
                new ActionRowBuilder().addComponents(proofInput)
            );

            await interaction.showModal(modal);

        } catch (error) {
            console.error(error);
        }
    }
};