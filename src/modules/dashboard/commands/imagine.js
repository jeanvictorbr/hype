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

        // 1. Mensagem para enrolar o utilizador enquanto a imagem carrega
        await interaction.reply({ 
            content: '🖌️ **A preparar os pincéis...** A IA está a desenhar a tua ideia. Isto demora uns segundos, aguarda!' 
        });

        const generateImageUrl = (basePrompt) => {
            const randomSeed = Math.floor(Math.random() * 1000000);
            return `https://image.pollinations.ai/prompt/${encodeURIComponent(basePrompt.trim())}?width=1024&height=1024&nologo=true&seed=${randomSeed}`;
        };

        // 2. NOVA MÁGICA: Download blindado com Disfarce e Sistema de Tentativas
        const fetchImageAsAttachment = async (url, retries = 2) => {
            for (let i = 0; i < retries; i++) {
                try {
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            // 👇 O "Disfarce": Fingimos ser um navegador Chrome atualizado
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'image/jpeg, image/png, image/webp, image/*'
                        }
                    });
                    
                    if (response.ok) {
                        const arrayBuffer = await response.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        return new AttachmentBuilder(buffer, { name: 'arte.png' });
                    }
                } catch (e) {
                    if (i === retries - 1) throw e;
                }
                // Se falhou, espera 2 segundos e tenta de novo silenciosamente
                await new Promise(r => setTimeout(r, 2000));
            }
            throw new Error('Falha no download após tentativas');
        };

        try {
            const imageUrl = generateImageUrl(prompt);
            const attachment = await fetchImageAsAttachment(imageUrl);

            // 3. Monta o Embed ligando ao ficheiro físico que baixámos
            const embed = new EmbedBuilder()
                .setTitle('🎨 Obra de Arte Gerada!')
                .setDescription(`**Prompt:** \`${prompt}\``)
                .setImage('attachment://arte.png') 
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

            // 4. Edita a mensagem inicial com a Arte!
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
                time: 600000 
            });

            collector.on('collect', async (i) => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: '🚫 Só quem usou o comando pode pedir uma nova versão.', ephemeral: true });
                }

                await i.update({ 
                    content: '⏳ **A criar uma nova versão...** Aguarda mais uns segundos.', 
                    embeds: [], 
                    components: [], 
                    files: [] 
                });
                
                try {
                    const newUrl = generateImageUrl(prompt);
                    const newAttachment = await fetchImageAsAttachment(newUrl);

                    await interaction.editReply({ 
                        content: '✅ **Nova versão gerada!**', 
                        embeds: [embed], 
                        components: [row], 
                        files: [newAttachment] 
                    });
                } catch (err) {
                    await interaction.editReply({ content: '❌ Houve um erro ao recriar a imagem. Os servidores podem estar cheios.' });
                }
            });

            collector.on('end', () => {
                interaction.editReply({ components: [] }).catch(() => {});
            });

        } catch (error) {
            console.error('Erro na geração da imagem:', error);
            await interaction.editReply({ content: '❌ Oops! Os servidores da IA bloquearam o pedido ou estão muito sobrecarregados. Tenta usar palavras diferentes!' });
        }
    }
};