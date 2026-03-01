const { AttachmentBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateRoletaImage } = require('../../../utils/canvasRoletaRussa');
const { ActiveTables } = require('../commands/roletarussa');

const sleep = ms => new Promise(r => setTimeout(r, ms));

module.exports = {
    customId: 'eco_roleta_start',

    async execute(interaction) {
        const canalId = interaction.channel.id;
        const mesa = ActiveTables.get(canalId) || interaction.client.activeRoleta?.get(canalId);

        if (!mesa) return interaction.reply({ content: '❌ A mesa já não existe ou o jogo já acabou.', flags: [MessageFlags.Ephemeral] });
        
        if (mesa.donoId !== interaction.user.id) {
            return interaction.reply({ content: '❌ Apenas o dono da mesa (quem a abriu) pode ordenar que o tambor gire!', flags: [MessageFlags.Ephemeral] });
        }

        if (mesa.players.length < 2) {
            return interaction.reply({ content: '❌ Precisas de pelo menos 2 jogadores sentados para jogar!', flags: [MessageFlags.Ephemeral] });
        }

        if (mesa.estado !== 'lobby') {
            return interaction.reply({ content: '❌ A porta já está trancada, o jogo já começou.', flags: [MessageFlags.Ephemeral] });
        }

        mesa.estado = 'playing';
        
        await interaction.deferUpdate();
        await interaction.editReply({ components: [] });

        try {
            let alivePlayers = mesa.players.filter(p => !p.isDead);

            while (alivePlayers.length > 1) {
                const randomAliveIndex = Math.floor(Math.random() * alivePlayers.length);
                const vitima = alivePlayers[randomAliveIndex];
                
                const targetIndexCanvas = mesa.players.findIndex(p => p.id === vitima.id);

                let imgBuffer = await generateRoletaImage('spinning', mesa.players, targetIndexCanvas, mesa.pot);
                let attachment = new AttachmentBuilder(imgBuffer, { name: 'roleta.png' });
                let embed = new EmbedBuilder()
                    .setColor('#f59e0b') 
                    .setImage('attachment://roleta.png');
                
                await interaction.editReply({ embeds: [embed], files: [attachment], attachments: [] });
                
                await sleep(3000); 

                vitima.isDead = true; 
                
                imgBuffer = await generateRoletaImage('shoot', mesa.players, targetIndexCanvas, mesa.pot);
                attachment = new AttachmentBuilder(imgBuffer, { name: 'roleta.png' });
                embed = new EmbedBuilder()
                    .setColor('#ef4444') 
                    .setImage('attachment://roleta.png');

                await interaction.editReply({ embeds: [embed], files: [attachment], attachments: [] }).catch(() => {});
                
                await sleep(2500); 

                alivePlayers = mesa.players.filter(p => !p.isDead);
            }

            const vencedor = alivePlayers[0];
            const winnerIndexCanvas = mesa.players.findIndex(p => p.id === vencedor.id);

            // Paga a fortuna toda na CARTEIRA do sobrevivente!
            await prisma.hypeUser.update({
                where: { id: vencedor.id },
                data: { carteira: { increment: mesa.pot } }
            });

            const finalImgBuffer = await generateRoletaImage('winner', mesa.players, winnerIndexCanvas, mesa.pot);
            const finalAttachment = new AttachmentBuilder(finalImgBuffer, { name: 'roleta.png' });
            const finalEmbed = new EmbedBuilder()
                .setColor('#fef08a') 
                .setTitle('👑 TEMOS UM SOBREVIVENTE!')
                .setDescription(`**${vencedor.username}** foi o último a ficar de pé e fugiu com a mala de **R$ ${mesa.pot.toLocaleString('pt-BR')}**!`)
                .setImage('attachment://roleta.png');

            await interaction.editReply({ embeds: [finalEmbed], files: [finalAttachment], attachments: [] }).catch(() => {});

            if (interaction.client.activeRoleta) interaction.client.activeRoleta.delete(canalId);
            ActiveTables.delete(canalId);

        } catch (error) {
            console.error('❌ Erro no loop da Roleta:', error);
            if (interaction.client.activeRoleta) interaction.client.activeRoleta.delete(canalId);
            ActiveTables.delete(canalId);
        }
    }
};