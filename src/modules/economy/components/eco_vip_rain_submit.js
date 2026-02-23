const { MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateVipBanner } = require('../../../utils/canvasVIP');

module.exports = {
    customId: 'eco_vip_rain_submit',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        const amount = parseInt(interaction.fields.getTextInputValue('rain_amount'));

        if (isNaN(amount) || amount < 500) return interaction.editReply({ content: '❌ O valor mínimo para a chuva é de 500 HC.' });

        try {
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: interaction.user.id } });
            if (!userProfile || userProfile.hypeCash < amount) return interaction.editReply({ content: '❌ Você não tem saldo suficiente para bancar essa chuva!' });

            // Desconta o dinheiro e aplica cooldown
            await prisma.hypeUser.update({
                where: { id: interaction.user.id },
                data: { hypeCash: { decrement: amount }, lastMoneyRain: new Date() }
            });

            // Cria um ID único para este evento no motor do Bot
            const dropId = Date.now().toString();
            if (!client.activeRains) client.activeRains = new Map();
            
            client.activeRains.set(dropId, {
                amount: amount,
                participants: new Set(),
                max: 5, // Os primeiros 5 dividem o prêmio
                host: interaction.user.id
            });

            const btn = new ButtonBuilder().setCustomId(`eco_vip_rain_catch_${dropId}`).setLabel('Apanhar Dinheiro!').setStyle(ButtonStyle.Success).setEmoji('💰');

            // 🎨 1. GERA A IMAGEM PREMIUM (Dourada para a Chuva)
            const bannerBuffer = await generateVipBanner(
                interaction.user, 
                interaction.guild, 
                "CHUVA DE PRATA!", 
                `💸 Atirou ${amount} HypeCash no ar!`, 
                "#D4AF37" // Cor Dourada Premium
            );
            
            const attachment = new AttachmentBuilder(bannerBuffer, { name: 'rain.png' });

            // 2. Envia a mensagem pública com a Imagem e o Botão
            const msg = await interaction.channel.send({
                content: `💸 **<@${interaction.user.id}> enlouqueceu e atirou dinheiro no chat!**\nOs primeiros 5 a clicar no botão vão dividir **${amount} HC**! Corre!`,
                files: [attachment], // Anexa a imagem gerada
                components: [new ActionRowBuilder().addComponents(btn)]
            });

            await interaction.editReply({ content: `✅ Chuva iniciada! Você atirou ${amount} moedas no chat e um banner foi gerado.` });

            // Cancela se ninguém pegar após 3 minutos
            setTimeout(async () => {
                const activeRain = client.activeRains?.get(dropId);
                if (activeRain && activeRain.participants.size === 0) {
                    client.activeRains.delete(dropId);
                    await msg.edit({ content: `🌬️ **O vento levou...** Ninguém apanhou o dinheiro a tempo. O valor foi devolvido ao Patrão.`, components: [], files: [] }).catch(()=>{});
                    await prisma.hypeUser.update({ where: { id: activeRain.host }, data: { hypeCash: { increment: amount } }});
                }
            }, 3 * 60 * 1000);

        } catch (error) { 
            console.error('Erro na Chuva de Dinheiro:', error); 
            await interaction.editReply({ content: '❌ Ocorreu um erro interno ao processar a chuva de dinheiro.' });
        }
    }
};