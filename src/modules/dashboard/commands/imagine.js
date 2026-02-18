const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType,
    AttachmentBuilder // 👈 Adicionámos isto para o bot baixar a imagem
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('imagine')
        .setDescription('🎨 Cria uma imagem do zero usando Inteligência Artificial!')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('O que queres desenhar? (Em inglês os resultados são MUITO melhores)')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        // 1. O bot fica a pensar... (Pode demorar uns 10 segundos agora, é normal!)
        await interaction.deferReply(); 

        const prompt = interaction.options.getString('prompt');

        // 2. Gera a URL com a instrução (prompt)
        const generateImageUrl = (basePrompt) => {
            const randomSeed = Math.floor(Math.random() * 1000000);
            return `https://image.pollinations.ai/prompt/${encodeURIComponent(basePrompt)}?width=1024&height=1024&nologo=true&seed=${randomSeed}`;
        };

        // 3. Constrói a mensagem com o anexo FORÇADO
        const buildMessage = (url) => {
            // Obrigamos o bot a tratar a URL como um ficheiro real (arte.png)
            const attachment = new AttachmentBuilder(url, { name: 'arte.png' });

            const embed = new EmbedBuilder()
                .setTitle('🎨 Obra de Arte Gerada!')
                .setDescription(`**Prompt:** \`${prompt}\``)
                .setImage('attachment://arte.png') // 👈 Dizemos ao Embed para olhar para o ficheiro que acabámos de anexar
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

            // Retornamos os files junto com os embeds
            return { content: null, embeds: [embed], components: [row], files: [attachment] };
        };

        try {
            // 4. Envia a primeira imagem
            const response = await interaction.editReply(buildMessage(generateImageUrl(prompt)));

            // ==========================================
            // 🔄 LÓGICA DO BOTÃO "GERAR NOVAMENTE"
            // ==========================================
            const collector = response.createMessageComponentCollector({ 
                componentType: ComponentType.Button, 
                time: 600000 // 10 minutos
            });

            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: '🚫 Só quem usou o comando pode pedir uma nova versão.', ephemeral: true });
                }

                // Avisa que está a carregar
                await i.update({ content: '⏳ A desenhar uma nova versão, aguarda uns segundos...', embeds: [], components: [], files: [] });
                
                // Edita com a nova imagem gerada
                await interaction.editReply(buildMessage(generateImageUrl(prompt)));
            });

            collector.on('end', () => {
                interaction.editReply({ components: [] }).catch(() => {});
            });

        } catch (error) {
            console.error('Erro na geração da imagem:', error);
            await interaction.editReply({ content: '❌ Oops! A IA demorou muito a responder ou houve um erro. Tenta de novo!' });
        }
    }
};