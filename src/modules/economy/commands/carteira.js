const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateWalletImage } = require('../../../utils/canvasWallet');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('carteira')
        .setDescription('💵 Veja quanto dinheiro você tem na mão e no banco!')
        .addUserOption(option => option.setName('usuario').setDescription('Ver a carteira de outro jogador')),

    async execute(interaction) {
        await interaction.deferReply();
        const targetUser = interaction.options.getUser('usuario') || interaction.user;

        try {
            let userData = await prisma.hypeUser.findUnique({ where: { id: targetUser.id } });
            if (!userData) userData = await prisma.hypeUser.create({ data: { id: targetUser.id } });

            const imageBuffer = await generateWalletImage(targetUser, userData);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'wallet.png' });

            // 🔥 AGORA ENVIA A IMAGEM PURA SEM EMBED!
            await interaction.editReply({ 
                content: `Carteira de <@${targetUser.id}>`, 
                files: [attachment] 
            });
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ Erro ao abrir a carteira.');
        }
    }
};