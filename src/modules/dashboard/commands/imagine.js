const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ComponentType,
    AttachmentBuilder 
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('imagine')
        .setDescription('🎨 Cria uma imagem do zero usando Inteligência Artificial!')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('O que queres desenhar? (Em inglês os resultados são melhores)')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const prompt = interaction.options.getString('prompt');

        // 1. Mensagem de feedback IMEDIATA para "enrolar" e tranquilizar o utilizador
        await interaction.reply({ 
            content: '🖌️ **A preparar os pincéis...** A IA está a desenhar a tua ideia. Isto demora cerca de 10 a 15 segundos, aguarda!' 
        });

        // 2. Gerador de URL (com seed aleatório para resultados diferentes)
        const generateImageUrl = (basePrompt) => {
            const randomSeed = Math.floor(Math.random() * 1000000);
            return `https://image.pollinations.ai/prompt/${encodeURIComponent(basePrompt)}?width=1024&height=1024&nologo=true&seed=${randomSeed}`;
        };

        // 3. A NOVA MÁGICA: Função que obriga o Bot a baixar a imagem completa antes de mostrar
        const fetchImageAsAttachment = async (url) => {
            // O bot vai à internet buscar a imagem ativamente
            const response = await fetch(url);
            if (!response.ok) throw new Error('Falha no download da IA');
            
            // Converte a imagem para dados brutos (Buffer)
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            // Cria o anexo do Discord a partir dos dados brutos
            return new AttachmentBuilder(buffer, { name: 'arte.png' });
        };

        try {
            const imageUrl = generateImageUrl(prompt);
            
            // O código FICA PARADO AQUI até a imagem estar 100% baixada
            const attachment = await fetchImageAsAttachment(imageUrl);

            // 4. Montamos o Embed (Agora sim a imagem vai aparecer, pois é um ficheiro físico)
            const embed = new EmbedBuilder()
                .setTitle('🎨 Obra de Arte Gerada!')
                .setDescription(`**Prompt:** \`${prompt}\``)
                .setImage('attachment://arte.png') // Liga o Embed ao ficheiro baixado
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

            // 5. Substituímos a mensagem de "enrolar" pelo resultado final!
            const message = await interaction.editReply({ 
                content: '✅ **Arte finalizada com sucesso!**', 
                embeds: [embed], 
                components: [row], 
                files: [attachment] 
            });

            // ==========================================
            // 🔄 LÓGICA DO BOTÃO "GERAR NOVAMENTE"
            // ==========================================
            const collector = message.createMessageComponentCollector({ 
                componentType: ComponentType.Button, 
                time: 600000 // 10 minutos
            });

            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: '🚫 Só quem usou o comando pode pedir uma nova versão.', ephemeral: true });
                }

                // Quando ele clica, esconde a imagem velha e mostra um texto a carregar
                await i.update({ 
                    content: '⏳ **A criar uma nova versão...** Aguarda mais uns segundos.', 
                    embeds: [], 
                    components: [], 
                    files: [] 
                });
                
                try {
                    // Baixa uma nova imagem
                    const newUrl = generateImageUrl(prompt);
                    const newAttachment = await fetchImageAsAttachment(newUrl);

                    // Devolve o Embed com a imagem nova
                    await interaction.editReply({ 
                        content: '✅ **Nova versão gerada!**', 
                        embeds: [embed], 
                        components: [row], 
                        files: [newAttachment] 
                    });
                } catch (err) {
                    await interaction.editReply({ content: '❌ Houve um erro ao recriar a imagem. Tenta enviar o comando novamente.' });
                }
            });

            collector.on('end', () => {
                interaction.editReply({ components: [] }).catch(() => {});
            });

        } catch (error) {
            console.error('Erro na geração da imagem:', error);
            await interaction.editReply({ content: '❌ Oops! Os servidores da IA estão sobrecarregados. Tenta de novo em alguns segundos!' });
        }
    }
};