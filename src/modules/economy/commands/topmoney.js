const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateTopMoneyImage } = require('../../../utils/canvasTopMoney');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('topmoney')
        .setDescription('🏆 Veja o ranking dos magnatas mais ricos do servidor!'),

    async execute(interaction, client) {
        // Segura a resposta porque gerar a imagem e buscar avatares demora 1-2 segundos
        await interaction.deferReply();

        const callerId = interaction.user.id;

        try {
            // 1. Busca os 5 mais ricos no banco de dados
            const top5DB = await prisma.hypeUser.findMany({
                where: { hypeCash: { gt: 0 } },
                orderBy: { hypeCash: 'desc' },
                take: 5
            });

            if (top5DB.length === 0) {
                return interaction.editReply('❌ Ainda não há ninguém com HypeCoins neste servidor!');
            }

            // 2. Prepara os dados do Top 5 (busca os nicks e avatares no Discord)
            const topUsers = [];
            for (let i = 0; i < top5DB.length; i++) {
                let discordUser;
                try {
                    // Tenta buscar o usuário no Discord para pegar a foto real
                    discordUser = await client.users.fetch(top5DB[i].id);
                } catch (e) {}

                topUsers.push({
                    rank: i + 1,
                    username: discordUser ? discordUser.username : 'Usuário Desconhecido',
                    cash: top5DB[i].hypeCash,
                    avatarUrl: discordUser ? discordUser.displayAvatarURL({ extension: 'png', size: 128 }) : null
                });
            }

            // 3. Descobre o saldo e a posição (Rank) de quem deu o comando
            let callerProfile = await prisma.hypeUser.findUnique({ where: { id: callerId } });
            let callerCash = callerProfile ? callerProfile.hypeCash : 0;
            let callerRank = '-';

            if (callerCash > 0) {
                // Conta quantos usuários têm MAIS dinheiro que o caller
                const usersAhead = await prisma.hypeUser.count({
                    where: { hypeCash: { gt: callerCash } }
                });
                callerRank = usersAhead + 1; // Se 10 pessoas têm mais guito, ele é o 11º
            } else {
                callerRank = 'N/A'; // Não tem guito
            }

            const callerData = {
                rank: callerRank,
                cash: callerCash
            };

            // 4. Gera a Imagem Magnífica no Canvas
            const imageBuffer = await generateTopMoneyImage(topUsers, callerData);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'topmoney.png' });

            // 5. Envia no formato Embed Dark (sem conflitos com a V2)
            const embed = new EmbedBuilder()
                .setColor('#0a192f') // O Azul da nossa marca
                .setImage('attachment://topmoney.png');

            await interaction.editReply({ embeds: [embed], files: [attachment] });

        } catch (error) {
            console.error('❌ Erro no comando TopMoney:', error);
            await interaction.editReply('❌ Ocorreu um erro ao gerar o ranking.');
        }
    }
};