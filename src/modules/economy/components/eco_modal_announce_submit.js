const { EmbedBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_modal_announce_submit',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            const [userProfile, config] = await Promise.all([
                prisma.hypeUser.findUnique({ where: { id: userId } }),
                prisma.vipConfig.findUnique({ where: { guildId } })
            ]);
            
            const member = interaction.member;

            const isVip3 = (userProfile?.vipLevel >= 3) || (config?.roleVip3 && member.roles.cache.has(config.roleVip3));
            const isVip2 = (userProfile?.vipLevel >= 2) || (config?.roleVip2 && member.roles.cache.has(config.roleVip2)) || isVip3;

            if (!isVip2) return interaction.editReply({ content: '❌ **Permissão Negada.**' });

            // 1. COLETAR DADOS E ATUALIZAR COOLDOWN (24h)
            const title = interaction.fields.getTextInputValue('ann_title');
            const desc = interaction.fields.getTextInputValue('ann_desc');
            const image = interaction.fields.getTextInputValue('ann_image');

            await prisma.hypeUser.update({
                where: { id: userId },
                data: { lastAnnounce: new Date() }
            });

            // 2. MONTAR O EMBED
            const corAnuncio = isVip3 ? '#FFD700' : '#C0C0C0'; 

            const embed = new EmbedBuilder()
                .setColor(corAnuncio)
                .setAuthor({ name: `Patrocinado por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setTitle(`📢 ${title}`)
                .setDescription(`\n${desc}\n`)
                .setFooter({ text: 'Benefício VIP Exclusivo (Cooldown: 24h)' })
                .setTimestamp();

            // Adiciona a imagem SE o jogador colou um link válido
            if (image && (image.startsWith('http') || image.startsWith('https'))) {
                embed.setImage(image);
            }

            // 3. ENVIO COM A MENÇÃO EVERYONE FORA DO EMBED (Para pingar de verdade)
            await interaction.channel.send({ 
                content: `||@everyone|| ✨ **Atenção ao recado do Patrão!** ✨`,
                embeds: [embed] 
            });

            // 4. MENSAGEM DE SUCESSO V2
            const successContainer = new ContainerBuilder()
                .setAccentColor(0x57F287) 
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ✅ Anúncio Enviado!\nA sua mensagem foi transmitida para todo o baile com sucesso. O seu megafone entra agora em recarga por 24 horas.`));

            // Volta para a página correta dependendo do VIP
            const returnId = isVip3 ? 'eco_panel_vip_3' : 'eco_panel_vip_2';
            
            const rowBack = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(returnId).setLabel('Voltar à Vitrine').setStyle(ButtonStyle.Secondary).setEmoji('↩️')
            );

            await interaction.editReply({ components: [successContainer, rowBack], flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });

        } catch (error) {
            console.error('❌ Erro ao enviar anúncio:', error);
            await interaction.editReply({ content: '❌ Ocorreu um erro ao processar o seu anúncio. Tente novamente.' });
        }
    }
};