const { 
    ContainerBuilder, 
    TextDisplayBuilder 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    // Exatamente o ID que definimos na criação do Modal acima
    customId: 'modal_room_rename',

    async execute(interaction, client) {
        // Nova validação para evitar abusos via API REST
        const room = await prisma.autoVoiceRoom.findUnique({
            where: { channelId: interaction.channel.id }
        });

        if (!room || interaction.user.id !== room.ownerId) {
            return interaction.reply({ 
                content: '🚫 Ação não autorizada.', 
                ephemeral: true 
            });
        }

        // ==========================================
        // LÓGICA DE ATUALIZAÇÃO DO NOME
        // ==========================================
        
        // Apanha o texto exato que o utilizador escreveu na caixa de texto
        const newName = interaction.fields.getTextInputValue('input_new_name');

        try {
            // Altera o nome do canal diretamente no Discord
            await interaction.channel.setName(newName);

            // Resposta elegante (Ghost Interface) confirmando o sucesso
            const successText = new TextDisplayBuilder()
                .setContent(`# ✅ Nome Alterado\nA tua sala chama-se agora **${newName}**.`);
            
            const successContainer = new ContainerBuilder()
                .setAccentColor(0x57F287) // Verde
                .addComponents(successText);

            // Responder ao Modal é obrigatório na API do Discord
            await interaction.reply({
                components: [successContainer],
                ephemeral: true // Apenas o dono da sala vê a confirmação
            });

        } catch (error) {
            console.error('❌ Erro ao renomear sala:', error);
            
            // Tratamento de Rate Limit do Discord (só permite mudar nomes 2x a cada 10 min)
            if (error.code === 50024) {
                return interaction.reply({
                    content: '⚠️ O Discord bloqueou esta ação. Estás a mudar de nome muito depressa (Limite: 2 vezes a cada 10 minutos).',
                    ephemeral: true
                });
            }

            await interaction.reply({
                content: '❌ Ocorreu um erro ao renomear a sala. Verifica se tenho permissões.',
                ephemeral: true
            });
        }
    }
};