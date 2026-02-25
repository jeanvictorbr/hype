const { ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');

module.exports = {
    customId: 'eco_profile_theme',

    async execute(interaction) {
        // 🔒 SEGURANÇA: Previne crashes e verifica se quem clicou é o dono do perfil
        const isOwner = interaction.message.interaction ? (interaction.user.id === interaction.message.interaction.user.id) : true;
        
        if (!isOwner) {
            return interaction.reply({ 
                content: '❌ **Acesso Negado!** Você só pode alterar o tema do seu próprio perfil.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // Criamos o menu usando os emojis nativos do Discord (que não bugam na UI)
        const select = new StringSelectMenuBuilder()
            .setCustomId('eco_profile_theme_select')
            .setPlaceholder('🎨 Selecione seu novo Fundo Premium...')
            .addOptions(
                { label: 'Padrão Escuro', description: 'Tech limpo e moderno.', value: 'default', emoji: '🌑' },
                { label: 'Matrix Hacker', description: 'Domina o código.', value: 'hacker', emoji: '💻' },
                { label: 'Galáxia Profunda', description: 'Viaja pelo espaço.', value: 'galaxy', emoji: '🌌' },
                { label: 'Ouro Maciço', description: 'Luxo puro para magnatas.', value: 'gold', emoji: '👑' },
                { label: 'Carmesim Agiota', description: 'Sangue e negócios.', value: 'blood', emoji: '🩸' }
            );

        const row = new ActionRowBuilder().addComponents(select);

        // Dá update na própria mensagem, transformando os botões no Menu Dropdown!
        await interaction.update({ components: [row] }).catch(err => {
            console.error('Erro ao abrir o menu de temas:', err);
        });
    }
};