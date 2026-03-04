const { AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateProfileImage } = require('../../../utils/canvasProfile');

module.exports = {
    customId: 'eco_profile_bio_submit',

    async execute(interaction, client) {
        // Põe o bot a pensar enquanto desenha a nova imagem
        await interaction.deferUpdate();
        
        // Puxa EXATAMENTE o ID que definimos no modal acima
        const newBio = interaction.fields.getTextInputValue('bioInput');
        const userId = interaction.user.id;

        try {
            // 1. Atualiza a Bio na base de dados
            const userData = await prisma.hypeUser.update({
                where: { id: userId },
                data: { bio: newBio }
            });

            // 2. Calcula o Rank Global de novo
            let userRank = 'N/A';
            if (userData.hypeCash > 0) {
                const usersAhead = await prisma.hypeUser.count({ where: { hypeCash: { gt: userData.hypeCash } } });
                userRank = usersAhead + 1;
            }

            // 3. Regera a imagem
            const imageBuffer = await generateProfileImage(interaction.user, userData, userRank);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'profile.png' });
            const embed = new EmbedBuilder().setColor('#2b2d31').setImage('attachment://profile.png');

            // 4. Recria os botões originais COM A TRANCA DE SEGURANÇA (ID do Dono)
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`eco_profile_bio_${userId}`) // 🔒 Tranca aplicada!
                    .setLabel('Editar Bio')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('✏️')
            );

            // Re-adiciona o botão de cores se o jogador for VIP
            if (userData.vipLevel > 0) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`btn_perfil_cor_${userId}`) // 🔒 Tranca aplicada!
                        .setLabel('Cores de Perfil')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎨')
                );
            }

            // Atualiza a mensagem na tela
            await interaction.editReply({ embeds: [embed], files: [attachment], components: [row], attachments: [] });

        } catch (error) {
            console.error('Erro ao salvar bio:', error);
        }
    }
};