const { AttachmentBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateDailyImage } = require('../../../utils/canvasDaily');

module.exports = {
    customId: 'eco_user_daily',

    async execute(interaction, client) {
        const userId = interaction.user.id;

        try {
            let userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            if (!userProfile) userProfile = await prisma.hypeUser.create({ data: { id: userId } });

            // 1. BLOQUEIO F2P (Só VIPs podem usar)
            if (!userProfile.vipLevel || userProfile.vipLevel === 0) {
                // Devolve um aviso silencioso só para quem tentou clicar e não tem VIP
                return interaction.reply({ 
                    content: '❌ **Acesso Negado!** Este assalto de elite é exclusivo para membros **VIP**. Adquire o teu passe na Loja!', 
                    flags: [MessageFlags.Ephemeral] 
                });
            }

            // 2. AÇÃO PÚBLICA! Retirámos o Ephemeral para o suspense aparecer no chat
            await interaction.deferReply(); 

            const now = new Date();
            // Usa a coluna independente do VIP (Para não chocar com o hdiario)
            const lastDailyCheck = userProfile.lastVipDaily ? new Date(userProfile.lastVipDaily) : null;

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
                    .setDescription(`<@${userId}>, as ruas estão vazias. O carro-forte VIP já foi roubado hoje. Esconda-se e volte mais tarde!`)
                    .setImage('attachment://daily.png');

                return interaction.editReply({ 
                    embeds: [embed], files: [attachment], attachments: [], components: []
                });
            }

            // ==========================================
            // CENA 2: HACKEANDO (Início do Suspense)
            // ==========================================
            const hackBuffer = await generateDailyImage('robbing');
            const hackAttachment = new AttachmentBuilder(hackBuffer, { name: 'daily.png' });

            const hackEmbed = new EmbedBuilder()
                .setColor('#3b82f6') // Azul
                .setTitle('💻 INFILTRAÇÃO VIP INICIADA')
                .setDescription(`<@${userId}> está a desativar as câmeras de segurança máxima da escolta armada...`)
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
                .setDescription(`Todos para o chão! O cofre VIP de <@${userId}> vai abrir a qualquer momento...`)
                .setImage('attachment://daily.png');

            await interaction.editReply({ 
                embeds: [detEmbed], files: [detAttachment], attachments: [], components: [] 
            }).catch(() => {});

            // Suspense 2 (2.5 Segundos)
            await new Promise(r => setTimeout(r, 2500));

            // ==========================================
            // CENA 4: REVELAÇÃO DO PRÊMIO (Economia VIP)
            // ==========================================
            // Valor base entre 25k e 50k (Maior que o Diário Normal)
            const baseAmount = Math.floor(Math.random() * (50000 - 25000 + 1)) + 25000;
            
            // O Multiplicador que pediste! (Dobra a cada nível VIP)
            let multiplier = 1.0;
            if (userProfile.vipLevel === 1) multiplier = 1.0;      // Nível 1: 25k - 50k
            else if (userProfile.vipLevel === 2) multiplier = 2.0; // Nível 2: 50k - 100k
            else if (userProfile.vipLevel === 3) multiplier = 4.0; // Nível 3: 100k - 200k
            else if (userProfile.vipLevel >= 4) multiplier = 8.0;  // Nível 4+: 200k - 400k

            const finalAmount = Math.floor(baseAmount * multiplier);

            // Guarda na nova coluna para não resetar o hdiario normal
            await prisma.hypeUser.update({
                where: { id: userId },
                data: { 
                    carteira: { increment: finalAmount }, 
                    lastVipDaily: new Date() 
                }
            });

            const winBuffer = await generateDailyImage('success', finalAmount);
            const winAttachment = new AttachmentBuilder(winBuffer, { name: 'daily.png' });

            let vipText = multiplier > 1 ? `\n\n💎 *(O seu passe VIP Nível ${userProfile.vipLevel} gerou um lucro de **x${multiplier}**!)*` : '';
            
            const winEmbed = new EmbedBuilder()
                .setColor('#FEE75C') // Dourado Ouro
                .setTitle('💰 CAIXA FORTE VIP ABERTA!')
                .setDescription(`<@${userId}> entrou, roubou os malotes e saiu de helicóptero! O dinheiro foi direto para a **Carteira**.\n\n💸 **Faturou:** R$ ${finalAmount.toLocaleString('pt-BR')}${vipText}`)
                .setImage('attachment://daily.png');

            await interaction.editReply({ 
                embeds: [winEmbed], files: [winAttachment], attachments: [], components: []
            }).catch(() => {});

        } catch (error) {
            console.error('❌ Erro no Daily Heist VIP:', error);
            await interaction.editReply({ content: '❌ Erro ao tentar assaltar o cofre VIP.' }).catch(() => {});
        }
    }
};