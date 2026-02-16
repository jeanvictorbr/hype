const { 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'room_rename',

    async execute(interaction, client) {
        // 1. Validação de segurança no PostgreSQL
        const room = await prisma.autoVoiceRoom.findUnique({
            where: { channelId: interaction.channel.id }
        });

        if (!room) {
            return interaction.reply({ 
                content: '❌ Esta sala não consta na base de dados.', 
                ephemeral: true 
            });
        }

        if (interaction.user.id !== room.ownerId) {
            return interaction.reply({ 
                content: '🚫 Apenas o dono pode renomear a sala.', 
                ephemeral: true 
            });
        }

        // ==========================================
        // 2. CONSTRUÇÃO DO MODAL (POP-UP NATIVO)
        // ==========================================
        
        // O ID do modal é crucial para o nosso loader saber quem chamar a seguir
        const modal = new ModalBuilder()
            .setCustomId('modal_room_rename')
            .setTitle('✏️ Renomear Sala');

        // Criando a caixa de texto
        const nameInput = new TextInputBuilder()
            .setCustomId('input_new_name') // ID do campo de texto
            .setLabel('Qual será o novo nome da sala?')
            .setStyle(TextInputStyle.Short) // Estilo curto (uma linha)
            .setPlaceholder('Ex: 🎮 Sala do João, Reunião Secreta...')
            .setMinLength(2)
            .setMaxLength(30)
            .setRequired(true);

        // Adicionando a caixa de texto à "ActionRow" (necessário na API do Discord)
        const actionRow = new ActionRowBuilder().addComponents(nameInput);
        modal.addComponents(actionRow);

        // 3. Apresenta o pop-up no ecrã do utilizador
        await interaction.showModal(modal);
    }
};