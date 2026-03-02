const { AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateProfileImage } = require('../../../utils/canvasProfile');

module.exports = {
    customId: 'eco_rep_btn',

    async execute(interaction, client) {
        // Pega o ID do dono do perfil através do texto (Perfil de <@ID>)
        const match = interaction.message.content.match(/<@!?(\d+)>/);
        if (!match) return interaction.reply({ content: '❌ Não foi possível identificar de quem é este perfil.', flags: [MessageFlags.Ephemeral] });
        
        const targetId = match[1];
        const callerId = interaction.user.id;

        // Previne que a pessoa dê rep a si mesma
        if (targetId === callerId) {
            return interaction.reply({ content: '❌ Seu egocêntrico! Não pode dar curtida a si mesmo!', flags: [MessageFlags.Ephemeral] });
        }

        // Segura o click (Ephemeral = só a pessoa que clicou vê o carregamento e o aviso)
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            let callerProfile = await prisma.hypeUser.findUnique({ where: { id: callerId } });
            if (!callerProfile) callerProfile = await prisma.hypeUser.create({ data: { id: callerId } });

            // ==========================================
            // VERIFICAÇÃO DO TEMPO (COOLDOWN DE 24 HORAS)
            // ==========================================
            const now = new Date();
            if (callerProfile.lastRepGiven) {
                const diff = now - new Date(callerProfile.lastRepGiven);
                const hours24 = 24 * 60 * 60 * 1000;
                
                if (diff < hours24) {
                    const tempoRestante = hours24 - diff;
                    const horas = Math.floor(tempoRestante / (1000 * 60 * 60));
                    const minutos = Math.floor((tempoRestante % (1000 * 60 * 60)) / (1000 * 60));
                    return interaction.editReply({ content: `⏳ Opa, calma aí! Só podes dar Curtida a cada 24 horas. Volte em **${horas}h e ${minutos}m**.` });
                }
            }

            // ==========================================
            // ATUALIZA A BASE DE DADOS
            // ==========================================
            // Regista que o remetente usou a ação hoje
            await prisma.hypeUser.update({
                where: { id: callerId },
                data: { lastRepGiven: now }
            });

            // Dá +1 ponto ao alvo e obtém os dados atualizados
            const targetProfile = await prisma.hypeUser.update({
                where: { id: targetId },
                data: { rep: { increment: 1 } }
            });

            // ==========================================
            // RE-DESENHA A IMAGEM AO VIVO (Canvas)
            // ==========================================
            let targetRank = 'N/A';
            if (targetProfile.hypeCash > 0) {
                const usersAhead = await prisma.hypeUser.count({ where: { hypeCash: { gt: targetProfile.hypeCash } } });
                targetRank = usersAhead + 1;
            }

            const targetUserDiscord = await client.users.fetch(targetId);
            const imageBuffer = await generateProfileImage(targetUserDiscord, targetProfile, targetRank);
            
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'profile.png' });
            const embed = new EmbedBuilder().setColor('#2b2d31').setImage('attachment://profile.png');
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('eco_rep_btn').setLabel('Dar +Curtida').setStyle(ButtonStyle.Success).setEmoji('⭐')
            );

            // Atualiza o Banner lá em cima à frente de toda a gente!
            await interaction.message.edit({ embeds: [embed], files: [attachment], attachments: [], components: [row] });

            // Mostra o Sucesso a quem clicou
            await interaction.editReply({ content: `⭐ Sucesso! Foste um bacano e deste **+1 de curtida** para o(a) **${targetUserDiscord.username}**!` });

        } catch (error) {
            console.error('Erro ao dar rep:', error);
            await interaction.editReply({ content: '❌ Ocorreu um erro ao processar a curtida.' });
        }
    }
};