const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('imagine')
        .setDescription('🎨 Cria uma imagem do zero usando Inteligência Artificial!')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('O que queres desenhar? (Em inglês funciona melhor)')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        // 1. Avisa o Discord que estamos a pensar (para não dar erro de tempo)
        await interaction.deferReply(); 

        const prompt = interaction.options.getString('prompt');

        // 2. Função para gerar a URL (Adicionamos um 'seed' aleatório para que o botão de gerar novamente traga imagens diferentes)
        const generateImageUrl = (basePrompt) => {
            const randomSeed = Math.floor(Math.random() * 1000000);
            return `https://image.pollinations.ai/prompt/${encodeURIComponent(basePrompt)}?width=1024&height=1024&nologo=true&seed=${randomSeed}`;
        };

        // 3. Função para montar a mensagem (Embed + Botão)
        const buildMessage = (url) => {
            const embed = new EmbedBuilder()
                .setTitle('🎨 Obra de Arte Gerada!')
                .setDescription(`**Prompt:** \`${prompt}\``)
                .setImage(url)
                .setColor(0x5865F2)
                .setFooter({ 
                    text: `Gerado por IA para ${interaction.user.username}`, 
                    iconURL: interaction.user.displayAvatarURL() 
                });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('regenerate_image')
                    .setLabel('🔄 Gerar Novamente')
                    .setStyle(ButtonStyle.Primary)
            );

            return { content: null, embeds: [embed], components: [row] };
        };

        // 4. Envia a primeira imagem e guarda a referência da mensagem
        const response = await interaction.editReply(buildMessage(generateImageUrl(prompt)));

        // ==========================================
        // 🔄 LÓGICA DO BOTÃO "GERAR NOVAMENTE"
        // ==========================================
        
        // Criamos um "coletor" que fica à escuta de cliques no botão desta mensagem específica por 10 minutos
        const collector = response.createMessageComponentCollector({ 
            componentType: ComponentType.Button, 
            time: 600000 
        });

        collector.on('collect', async (i) => {
            // Garante que só quem pediu a imagem é que pode clicar no botão
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: '🚫 Só quem usou o comando pode pedir uma nova versão.', ephemeral: true });
            }

            // Mostra estado de carregamento no botão
            await i.update({ content: '⏳ A desenhar uma nova versão, aguarda...', embeds: [], components: [] });
            
            // Edita a mensagem original com uma nova imagem (novo seed)
            await interaction.editReply(buildMessage(generateImageUrl(prompt)));
        });

        collector.on('end', () => {
            // Quando os 10 minutos passarem, o botão desaparece para não acumular botões velhos no chat
            interaction.editReply({ components: [] }).catch(() => {});
        });
    }
};