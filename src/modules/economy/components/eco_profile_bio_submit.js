const { AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateProfileImage } = require('../../../utils/canvasProfile');

module.exports = {
    customId: 'eco_profile_bio_submit',

    async execute(interaction, client) {
        // Põe o bot a pensar enquanto desenha a nova imagem
        await interaction.deferUpdate();
        
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

            // 4. Recria os botões originais
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('eco_profile_bio').setLabel('Editar Bio').setStyle(ButtonStyle.Secondary).setEmoji('✏️'),
                new ButtonBuilder().setCustomId('eco_profile_theme').setLabel('Temas de Perfil').setStyle(userData.vipLevel > 0 ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji('🎨').setDisabled(userData.vipLevel === 0)
            );

            // Atualiza a mensagem
            await interaction.editReply({ embeds: [embed], files: [attachment], components: [row], attachments: [] });

        } catch (error) {
            console.error('Erro ao salvar bio:', error);
        }
    }
};