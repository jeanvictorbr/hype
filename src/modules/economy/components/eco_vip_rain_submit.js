const { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateRainBanner } = require('../../../utils/canvasRain'); // 👈 Puxa a nova arte

module.exports = {
    customId: 'eco_vip_rain_submit',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        
        const amount = parseInt(interaction.fields.getTextInputValue('rain_amount'));

        if (isNaN(amount) || amount < 500) {
            return interaction.editReply({ content: '❌ O valor mínimo para a chuva é de **R$ 500**.' });
        }

        try {
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: interaction.user.id } });
            
            if (!userProfile || userProfile.carteira < amount) {
                return interaction.editReply({ content: '❌ Você não tem esse dinheiro todo na **carteira**! Vá ao banco sacar primeiro.' });
            }

            // Desconta o dinheiro
            await prisma.hypeUser.update({
                where: { id: interaction.user.id },
                data: { carteira: { decrement: amount }, lastMoneyRain: new Date() }
            });

            // Cria o ID do evento
            const dropId = Date.now().toString();
            if (!client.activeRains) client.activeRains = new Map();
            
            client.activeRains.set(dropId, {
                amount: amount,
                participants: new Set(),
                max: 5, 
                host: interaction.user.id
            });

            const btn = new ButtonBuilder()
                .setCustomId(`eco_vip_rain_catch_${dropId}`)
                .setLabel('Apanhar Grana!')
                .setStyle(ButtonStyle.Success)
                .setEmoji('💸');

            // 🎨 GERA A NOVA IMAGEM VERDE NÉON
            const bannerBuffer = await generateRainBanner(interaction.user, amount);
            const attachment = new AttachmentBuilder(bannerBuffer, { name: 'rain.png' });

            // 👇 Envia a mensagem pública COM O @everyone ATIVADO
            const msg = await interaction.channel.send({
                content: `@everyone 🎊 **ALERTA DE OSTENTAÇÃO!** <@${interaction.user.id}> atirou dinheiro para o alto!\n🏃‍♂️ Os primeiros **5** a clicar vão dividir **R$ ${amount.toLocaleString('pt-BR')}**!`,
                files: [attachment],
                components: [new ActionRowBuilder().addComponents(btn)],
                allowedMentions: { parse: ['everyone'] } // 👈 Força o bot a notificar de verdade
            });

            await interaction.editReply({ content: `✅ Sucesso! Você espalhou **R$ ${amount.toLocaleString('pt-BR')}** e o servidor todo foi avisado.` });

            // Sistema de Devolução (3 minutos)
            setTimeout(async () => {
                const activeRain = client.activeRains?.get(dropId);
                if (activeRain && activeRain.participants.size === 0) {
                    client.activeRains.delete(dropId);
                    
                    await msg.edit({ 
                        content: `🌬️ **O vento levou...** Ninguém apanhou o dinheiro a tempo. O valor foi devolvido para <@${activeRain.host}>.`, 
                        components: [], files: [] 
                    }).catch(()=>{});

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