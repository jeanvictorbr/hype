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

        // 1. Mensagem de feedback imediata
        await interaction.reply({ 
            content: '🖌️ **A preparar os pincéis...** A IA está a desenhar a tua ideia. Isto demora entre 10 a 20 segundos!' 
        });

        const generateImageUrl = (basePrompt) => {
            const randomSeed = Math.floor(Math.random() * 1000000);
            return `https://image.pollinations.ai/prompt/${encodeURIComponent(basePrompt.trim())}?width=1024&height=1024&nologo=true&seed=${randomSeed}`;
        };

        // 2. DOWNLOAD BLINDADO (Com Timeout e User-Agent Honesto)
        const fetchImageAsAttachment = async (url, retries = 2) => {
            for (let i = 0; i < retries; i++) {
                try {
                    // Impede que o bot fique travado infinitamente se a IA não responder
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s de limite

                    const response = await fetch(url, {
                        method: 'GET',
                        signal: controller.signal,
                        headers: {
                            // O SEGREDO: Não fingir ser o Chrome. O Cloudflare bloqueia fakes.
                            'User-Agent': 'KodaBot/1.0 (+https://discord.com)',
                            'Accept': 'image/*'
                        }
                    });
                    
                    clearTimeout(timeoutId); // Limpa o cronómetro se responder a tempo

                    if (!response.ok) {
                        console.error(`[Tentativa ${i+1}] Cloudflare/IA bloqueou: Status ${response.status}`);
                        if (i === retries - 1) throw new Error(`Status ${response.status}`);
                        continue;
                    }

                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);

                    // Validação de segurança: Se o ficheiro for muito pequeno, é uma mensagem de erro em HTML e não uma imagem
                    if (buffer.length < 5000) {
                        console.error(`[Tentativa ${i+1}] Imagem corrompida ou muito pequena recebida.`);
                        throw new Error('Imagem inválida retornada pela IA.');
                    }

                    return new AttachmentBuilder(buffer, { name: 'arte.png' });

                } catch (error) {
                    console.error(`[Tentativa ${i+1}] Falhou: ${error.message}`);
                    if (i === retries - 1) throw error;
                    // Espera 2 segundos antes de tentar de novo
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
        };

        try {
            const imageUrl = generateImageUrl(prompt);
            const attachment = await fetchImageAsAttachment(imageUrl);

            // 3. Monta o Embed final
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

            // 4. Mostra a Imagem no chat!
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
                    content: '⏳ **A criar uma nova versão...** Isto vai demorar uns segundinhos.', 
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
                    await interaction.editReply({ content: '❌ Houve um erro ao recriar a imagem. Os servidores da IA devem estar lotados agora.' });
                }
            });

            collector.on('end', () => {
                interaction.editReply({ components: [] }).catch(() => {});
            });

        } catch (error) {
            console.error('Erro Fatal na geração da imagem:', error);
            await interaction.editReply({ content: '❌ **Oops!** Os servidores da IA recusaram a ligação ou demoraram demasiado a responder. Tenta novamente!' });
        }
    }
};