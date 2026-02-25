const { ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateDailyImage } = require('../../../utils/canvasDaily');

module.exports = {
    customId: 'eco_user_daily',

    async execute(interaction, client) {
        await interaction.deferUpdate();
        
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            let userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            if (!userProfile) userProfile = await prisma.hypeUser.create({ data: { id: userId } });

            const now = new Date();
            const lastDailyCheck = userProfile.lastDaily ? new Date(userProfile.lastDaily) : null;
            
            const rowBack = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('eco_return_main').setLabel('Fugir / Voltar').setStyle(ButtonStyle.Secondary).setEmoji('🏃')
            );

            // ==========================================
            // CENA 1: CARRO JÁ ROUBADO (COOLDOWN)
            // ==========================================
            if (lastDailyCheck && (now - lastDailyCheck) < 24 * 60 * 60 * 1000) {
                const diffTime = Math.abs((lastDailyCheck.getTime() + 24 * 60 * 60 * 1000) - now.getTime());
                const horas = Math.floor(diffTime / (1000 * 60 * 60));
                const minutos = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
                const timeString = `${horas}h e ${minutos}m`;

                const imgBuffer = await generateDailyImage('cooldown', 0, timeString);
                const attachment = new AttachmentBuilder(imgBuffer, { name: 'daily.png' });

                const embed = new EmbedBuilder()
                    .setColor('#ED4245')
                    .setTitle('🚨 ROTA LIMPA')
                    .setDescription('As ruas estão vazias. O carro-forte já foi roubado hoje. Esconda-se e volte mais tarde!')
                    .setImage('attachment://daily.png');

                return interaction.editReply({ 
                    embeds: [embed], files: [attachment], attachments: [], components: [rowBack]
                });
            }

            // ==========================================
            // CENA 2: HACKEANDO (Início do Suspense)
            // ==========================================
            const hackBuffer = await generateDailyImage('robbing');
            const hackAttachment = new AttachmentBuilder(hackBuffer, { name: 'daily.png' });

            const hackEmbed = new EmbedBuilder()
                .setColor('#3b82f6') // Azul
                .setTitle('💻 INFILTRAÇÃO INICIADA')
                .setDescription(`<@${userId}> está a desativar as câmeras da escolta armada...`)
                .setImage('attachment://daily.png');

            await interaction.editReply({ 
                embeds: [hackEmbed], files: [hackAttachment], attachments: [], components: [] 
            });

            // Suspense 1 (2 Segundos)
            await new Promise(r => setTimeout(r, 2000));

            // ==========================================
            // CENA 3: EXPLOSÃO / MISTÉRIO (Clímax)
            // ==========================================
            const detBuffer = await generateDailyImage('detonating');
            const detAttachment = new AttachmentBuilder(detBuffer, { name: 'daily.png' });

            const detEmbed = new EmbedBuilder()
                .setColor('#f59e0b') // Laranja/Vermelho
                .setTitle('🧨 C4 PLANTADA!')
                .setDescription(`Cuidado com a explosão! O cofre vai abrir a qualquer momento...`)
                .setImage('attachment://daily.png');

            await interaction.editReply({ 
                embeds: [detEmbed], files: [detAttachment], attachments: [], components: [] 
            }).catch(() => {});

            // Suspense 2 (2.5 Segundos)
            await new Promise(r => setTimeout(r, 2500));

            // ==========================================
            // CENA 4: REVELAÇÃO DO PRÊMIO
            // ==========================================
            const baseAmount = Math.floor(Math.random() * (1500 - 500 + 1)) + 500;
            
            let multiplier = 1.0;
            if (userProfile.vipLevel === 1) multiplier = 1.2;
            else if (userProfile.vipLevel === 2) multiplier = 1.5;
            else if (userProfile.vipLevel === 3) multiplier = 2.0;
            else if (userProfile.vipLevel >= 4) multiplier = 3.0;

            const finalAmount = Math.floor(baseAmount * multiplier);

            await prisma.hypeUser.update({
                where: { id: userId },
                data: { 
                    hypeCash: { increment: finalAmount },
                    lastDaily: new Date() 
                }
            });

            const winBuffer = await generateDailyImage('success', finalAmount);
            const winAttachment = new AttachmentBuilder(winBuffer, { name: 'daily.png' });

            let vipText = multiplier > 1 ? `\n\n*(Sua licença VIP multiplicou os ganhos em **x${multiplier}**!)*` : '';
            
            const winEmbed = new EmbedBuilder()
                .setColor('#FEE75C') // Dourado Ouro
                .setTitle('💰 CAIXA FORTE ABERTA!')
                .setDescription(`Você entrou, roubou os malotes e saiu sem deixar rastros!${vipText}`)
                .setImage('attachment://daily.png');

            await interaction.editReply({ 
                embeds: [winEmbed], files: [winAttachment], attachments: [], components: [rowBack]
            }).catch(() => {});

        } catch (error) {
            console.error('❌ Erro no Daily Heist:', error);
        }
    }
};