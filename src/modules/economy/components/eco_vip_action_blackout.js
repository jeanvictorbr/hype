const { MessageFlags, AttachmentBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateVipBanner } = require('../../../utils/canvasVIP'); // Importa a nossa máquina de arte

module.exports = {
    customId: 'eco_vip_action_blackout',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const userId = interaction.user.id;
        const channel = interaction.channel;

        try {
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            
            // Verifica Cooldown (12 horas)
            const cooldown = 12 * 60 * 60 * 1000;
            if (userProfile?.lastBlackout && (Date.now() - userProfile.lastBlackout.getTime() < cooldown)) {
                const timeReady = new Date(userProfile.lastBlackout.getTime() + cooldown);
                return interaction.editReply(`⏳ Você precisa descansar os poderes. Apagão disponível novamente <t:${Math.floor(timeReady.getTime() / 1000)}:R>.`);
            }

            // Confirmação no privado
            await interaction.editReply('🛑 **Apagão ativado!** Trancando o chat e gerando a imagem de impacto...');

            // Atualiza Banco de Dados
            await prisma.hypeUser.update({
                where: { id: userId },
                data: { lastBlackout: new Date() }
            });

            // 1. Tranca o Canal para @everyone
            await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });

            // 2. GERA A IMAGEM PREMIUM (Vermelho Escuro)
            const bannerBuffer = await generateVipBanner(
                interaction.user, 
                interaction.guild, 
                "APAGÃO VIP!", 
                "O chat foi silenciado por 60 Segundos.", 
                "#700000" // Cor de Fundo do Banner (Vermelho Escuro Apagão)
            );
            const attachment = new AttachmentBuilder(bannerBuffer, { name: 'blackout.png' });

            // 3. Envia no Chat Público
            const publicMessage = await channel.send({ 
                content: `🛑 Apenas VIPs falam agora! Silêncio ordenado por <@${userId}>!`, 
                files: [attachment] 
            });

            // 4. Destranca após 60 segundos
            setTimeout(async () => {
                await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null }).catch(() => {});
                await channel.send('✅ **O Apagão terminou!** O chat foi liberado para membros comuns.').catch(() => {});
                // Opcional: deletar a imagem de blackout após passar o tempo
                // await publicMessage.delete().catch(() => {});
            }, 60000);

        } catch (error) {
            console.error('Erro no Apagão VIP:', error);
            await interaction.followUp({ content: '❌ Falha ao ativar o Apagão.', flags: [MessageFlags.Ephemeral] });
        }
    }
};