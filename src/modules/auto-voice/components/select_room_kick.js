const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'select_room_kick',

    async execute(interaction, client) {
        // Validação de segurança dupla
        const room = await prisma.autoVoiceRoom.findUnique({
            where: { channelId: interaction.channel.id }
        });

        if (!room || interaction.user.id !== room.ownerId) {
            return interaction.reply({ 
                content: '🚫 Ação não autorizada.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // Pega o ID do usuário que foi selecionado no menu
        const targetId = interaction.values[0];
        const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);

        if (!targetMember || !targetMember.voice.channel || targetMember.voice.channel.id !== interaction.channel.id) {
            return interaction.update({ 
                content: '❌ O usuário já saiu da sala ou não foi encontrado.', 
                components: [] 
            });
        }

        try {
            // ==========================================
            // 💥 A EXECUÇÃO: Desconecta o usuário da call
            // ==========================================
            await targetMember.voice.disconnect('Expulso pelo dono da sala temporária.');

            // Atualiza o painel efêmero confirmando o sucesso
            const successText = new TextDisplayBuilder()
                .setContent(`# ✅ Usuário Expulso\n**${targetMember.displayName}** foi desconectado da sua sala com sucesso.`);
            
            const successContainer = new ContainerBuilder()
                .setAccentColor(0x57F287)
                .addComponents(successText);

            // Substitui o menu de seleção pela mensagem de sucesso
            await interaction.update({
                components: [successContainer]
            });

        } catch (error) {
            console.error('❌ Erro ao expulsar membro:', error);
            
            const errorText = new TextDisplayBuilder()
                .setContent('❌ Ocorreu um erro ao tentar expulsar o usuário. Verifique se meu cargo está acima do dele na hierarquia do servidor.');
            
            const errorContainer = new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addComponents(errorText);

            await interaction.update({ components: [errorContainer] });
        }
    }
};