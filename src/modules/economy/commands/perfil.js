const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateProfileImage } = require('../../../utils/canvasProfile');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('perfil')
        .setDescription('👤 Veja o seu perfil Hype ou o de outro jogador!')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('De quem você quer ver o perfil?')
                .setRequired(false)
        ),

    async execute(interaction, client) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('usuario') || interaction.user;
        const isOwnProfile = targetUser.id === interaction.user.id;

        try {
            let userData = await prisma.hypeUser.findUnique({ where: { id: targetUser.id } });
            
            if (!userData) {
                userData = await prisma.hypeUser.create({ data: { id: targetUser.id } });
            }

            let userRank = 'N/A';
            if (userData.hypeCash > 0) {
                const usersAhead = await prisma.hypeUser.count({
                    where: { hypeCash: { gt: userData.hypeCash } }
                });
                userRank = usersAhead + 1; 
            }

            const imageBuffer = await generateProfileImage(targetUser, userData, userRank);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'profile.png' });

            const embed = new EmbedBuilder()
                .setColor('#2b2d31')
                .setImage('attachment://profile.png');

            const components = [];
            
            // 👇 LÓGICA DE BOTÕES DINÂMICOS
            if (isOwnProfile) {
                // Se for o teu perfil: Botões de Editar
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('eco_profile_bio').setLabel('Editar Bio').setStyle(ButtonStyle.Secondary).setEmoji('✏️'),
                    new ButtonBuilder().setCustomId('eco_profile_theme').setLabel('Temas de Perfil').setStyle(userData.vipLevel > 0 ? ButtonStyle.Primary : ButtonStyle.Secondary).setEmoji('🎨').setDisabled(userData.vipLevel === 0) 
                );
                components.push(row);
            } else {
                // Se for o perfil de um amigo: Botão de Dar Fama
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('eco_rep_btn').setLabel('Dar +Reputação').setStyle(ButtonStyle.Success).setEmoji('⭐')
                );
                components.push(row);
            }

            // Enviamos o conteúdo mencionando o alvo silenciosamente para o botão funcionar
            await interaction.editReply({ 
                content: `Perfil de <@${targetUser.id}>`, 
                embeds: [embed], 
                files: [attachment], 
                components 
            });

        } catch (error) {
            console.error('❌ Erro no comando Perfil:', error);
            await interaction.editReply('❌ Ocorreu um erro ao tentar carregar este perfil.');
        }
    }
};