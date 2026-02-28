const { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateVipBanner } = require('../../../utils/canvasVIP');

module.exports = {
    customId: 'eco_vip_rain_submit',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        
        // Agora o valor é tratado como R$
        const amount = parseInt(interaction.fields.getTextInputValue('rain_amount'));

        // Valor mínimo de R$ 500 para não floodarem o chat com centavos
        if (isNaN(amount) || amount < 500) {
            return interaction.editReply({ content: '❌ O valor mínimo para a chuva é de **R$ 500**.' });
        }

        try {
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: interaction.user.id } });
            
            // Verificação na CARTEIRA (dinheiro vivo)
            if (!userProfile || userProfile.carteira < amount) {
                return interaction.editReply({ content: '❌ Você não tem esse dinheiro todo na **carteira**! Vá ao banco sacar primeiro.' });
            }

            // 1. Desconta o dinheiro da CARTEIRA e atualiza o tempo da última chuva
            await prisma.hypeUser.update({
                where: { id: interaction.user.id },
                data: { 
                    carteira: { decrement: amount }, 
                    lastMoneyRain: new Date() 
                }
            });

            // 2. Cria o ID do evento no motor do Bot
            const dropId = Date.now().toString();
            if (!client.activeRains) client.activeRains = new Map();
            
            client.activeRains.set(dropId, {
                amount: amount,
                participants: new Set(),
                max: 5, // Os primeiros 5 dividem o prêmio
                host: interaction.user.id
            });

            const btn = new ButtonBuilder()
                .setCustomId(`eco_vip_rain_catch_${dropId}`)
                .setLabel('Apanhar Grana!')
                .setStyle(ButtonStyle.Success)
                .setEmoji('💸');

            // 🎨 3. GERA A IMAGEM PREMIUM (Dourada)
            const bannerBuffer = await generateVipBanner(
                interaction.user, 
                interaction.guild, 
                "CHUVA DE NOTAS!", 
                `💸 Atirou R$ ${amount.toLocaleString('pt-BR')} no ar!`, 
                "#D4AF37" 
            );
            
            const attachment = new AttachmentBuilder(bannerBuffer, { name: 'rain.png' });

            // 4. Envia a mensagem pública
            const msg = await interaction.channel.send({
                content: `🎊 **OSTENTAÇÃO!** <@${interaction.user.id}> jogou dinheiro pro alto!\nOs primeiros 5 a clicar vão dividir **R$ ${amount.toLocaleString('pt-BR')}**!`,
                files: [attachment],
                components: [new ActionRowBuilder().addComponents(btn)]
            });

            await interaction.editReply({ content: `✅ Sucesso! Você espalhou **R$ ${amount.toLocaleString('pt-BR')}** pelo chat.` });

            // 5. Sistema de Devolução (Caso ninguém pegue em 3 minutos)
            setTimeout(async () => {
                const activeRain = client.activeRains?.get(dropId);
                if (activeRain && activeRain.participants.size === 0) {
                    client.activeRains.delete(dropId);
                    
                    // Edita a mensagem avisando que expirou
                    await msg.edit({ 
                        content: `🌬️ **O vento levou...** Ninguém apanhou o dinheiro a tempo. O valor foi devolvido para <@${activeRain.host}>.`, 
                        components: [], 
                        files: [] 
                    }).catch(()=>{});

                    // Devolve para a carteira do dono
                    await prisma.hypeUser.update({ 
                        where: { id: activeRain.host }, 
                        data: { carteira: { increment: amount } }
                    });
                }
            }, 3 * 60 * 1000);

        } catch (error) { 
            console.error('Erro na Chuva de Dinheiro:', error); 
            await interaction.editReply({ content: '❌ Ocorreu um erro ao processar a chuva de R$.' });
        }
    }
};