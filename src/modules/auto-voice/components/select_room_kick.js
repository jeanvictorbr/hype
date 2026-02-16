const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'select_room_kick',

    async execute(interaction, client) {
        // 1. Validação de segurança no banco de dados
        const room = await prisma.autoVoiceRoom.findUnique({
            where: { channelId: interaction.channel.id }
        });

        if (!room || interaction.user.id !== room.ownerId) {
            return interaction.reply({ 
                content: '🚫 Ação não autorizada.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // 2. Captura o alvo selecionado no menu
        const targetId = interaction.values[0];
        const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);

        // Verifica se o alvo ainda está na call
        if (!targetMember || !targetMember.voice.channel || targetMember.voice.channel.id !== interaction.channel.id) {
            return interaction.update({ 
                content: '❌ O usuário já saiu da sala ou não foi encontrado.', 
                components: [] 
            });
        }

        try {
            // ==========================================
            // 💥 EXECUÇÃO: Desconecta o usuário da call
            // ==========================================
            await targetMember.voice.disconnect('Expulso pelo dono da sala temporária.');

            // 3. Interface de Sucesso V2
            const successText = new TextDisplayBuilder()
                .setContent(`# ✅ Usuário Desconectado\n**${targetMember.displayName}** foi removido da sua sala com sucesso.`);
            
            const successContainer = new ContainerBuilder()
                .setAccentColor(0x57F287)
                .addTextDisplayComponents(successText); // ✅ CORREÇÃO: Método específico V2

            // Atualiza a interação enviando o container na flag correta
            await interaction.update({
                flags: [MessageFlags.IsComponentsV2], // ✅ CORREÇÃO: Flag obrigatória
                components: [successContainer]
            });

        } catch (error) {
            console.error('❌ Erro ao expulsar membro:', error);
            
            const errorText = new TextDisplayBuilder()
                .setContent('❌ Erro ao expulsar o usuário. Verifique se meu cargo está acima do dele na hierarquia.');
            
            const errorContainer = new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(errorText); // ✅ CORREÇÃO: Método específico V2

            await interaction.update({ 
                flags: [MessageFlags.IsComponentsV2],
                components: [errorContainer] 
            });
        }
    }
};