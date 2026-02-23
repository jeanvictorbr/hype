const { EmbedBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_vip_banreq_submit',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const accused = interaction.fields.getTextInputValue('ban_accused');
        const motive = interaction.fields.getTextInputValue('ban_motive');
        const proof = interaction.fields.getTextInputValue('ban_proof');
        const executor = interaction.user;

        try {
            const config = await prisma.vipConfig.findUnique({ where: { guildId: interaction.guild.id } });
            const logChannel = interaction.guild.channels.cache.get(config.banRequestChannel);

            if (!logChannel) return interaction.editReply({ content: '❌ O canal de logs não existe mais.' });

            // Atualizar o Banco de Dados (Consumir 1 cota semanal)
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: executor.id } });
            const now = new Date();
            let newResetDate = userProfile?.banRequestReset;

            if (!newResetDate || now > new Date(newResetDate)) {
                newResetDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); 
            }

            await prisma.hypeUser.update({
                where: { id: executor.id },
                data: {
                    banRequestsCount: (userProfile?.banRequestsCount >= 2 || (userProfile?.banRequestReset && now > new Date(userProfile.banRequestReset)) ? 0 : userProfile?.banRequestsCount || 0) + 1,
                    banRequestReset: newResetDate
                }
            });

            // ==========================================
            // ENVIO PARA A STAFF COM OS BOTÕES DE AÇÃO
            // ==========================================
            const staffEmbed = new EmbedBuilder()
                .setTitle('🚨 SOLICITAÇÃO DE BANIMENTO VIP 🚨')
                .setColor('#ED4245') 
                .setThumbnail(executor.displayAvatarURL({ dynamic: true }))
                .setDescription(`Um **Dono do Baile (VIP 3)** abriu um processo no Tribunal VIP contra um jogador.`)
                .addFields(
                    { name: '⚖️ Juiz (VIP)', value: `<@${executor.id}> (\`${executor.tag}\`)`, inline: true },
                    { name: '👤 Acusado', value: `\`${accused}\``, inline: true },
                    { name: '📄 Motivo Formal', value: `> ${motive}` },
                    { name: '📸 Provas Anexadas', value: `${proof}` }
                )
                .setFooter({ text: 'Apenas a Staff pode aprovar/rejeitar e executar o ban.' })
                .setTimestamp();

            // 👇 OS BOTÕES QUE FALTAVAM (Eles carregam o ID do VIP escondido para o bot saber a quem mandar DM)
            const rowActions = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`eco_ban_approve_${executor.id}`).setLabel('Aprovar e Punir').setStyle(ButtonStyle.Success).setEmoji('✅'),
                new ButtonBuilder().setCustomId(`eco_ban_deny_${executor.id}`).setLabel('Negar Pedido').setStyle(ButtonStyle.Danger).setEmoji('❌')
            );

            await logChannel.send({
                content: '@everyone 🚨 **Nova Exigência do Tribunal VIP na mesa! Avaliem as provas.**',
                embeds: [staffEmbed],
                components: [rowActions]
            });

            // Resposta de Sucesso para o VIP
            const successContainer = new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ⚖️ Processo Protocolado!\nA sua exigência de banimento contra **${accused}** foi enviada diretamente para a mesa da Administração. Você será notificado na sua DM assim que houver um veredito.`));

            const rowBack = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('eco_panel_vip_3').setLabel('Voltar ao Painel').setStyle(ButtonStyle.Secondary).setEmoji('↩️')
            );

            await interaction.editReply({ components: [successContainer, rowBack], flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });

        } catch (error) {
            console.error('❌ Erro no Tribunal VIP:', error);
            await interaction.editReply({ content: '❌ Ocorreu um erro técnico ao protocolar o banimento.' });
        }
    }
};