const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { generateRoletaImage } = require('../../../utils/canvasRoletaRussa');

// Mapa global para guardar as mesas ativas por canal
// Estrutura: { canalId: { donoId, valorAposta, pot, players: [], estado: 'lobby'|'playing' } }
const ActiveTables = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roletarussa')
        .setDescription('🔫 Crie uma mesa de Roleta Russa (Multiplayer de alto risco)!')
        .addIntegerOption(option => 
            option.setName('aposta')
                .setDescription('Quantas HypeCoins cada jogador tem de pagar para entrar?')
                .setRequired(true)
                .setMinValue(100)
        ),

    async execute(interaction) {
        const canalId = interaction.channel.id;
        const valorAposta = interaction.options.getInteger('aposta');

        // Verifica se já há uma mesa a decorrer neste canal
        if (ActiveTables.has(canalId)) {
            return interaction.reply({ content: '❌ Já existe uma mesa de Roleta Russa aberta neste canal! Esperem o jogo acabar.', ephemeral: true });
        }

        await interaction.deferReply();

        // O primeiro jogador (quem abriu) senta-se logo
        const dono = interaction.user;
        const donoData = {
            id: dono.id,
            username: dono.username,
            avatarBuffer: dono.displayAvatarURL({ extension: 'png', size: 128 }),
            isDead: false
        };

        // Cria a sessão na memória
        const mesa = {
            donoId: dono.id,
            valorAposta: valorAposta,
            pot: 0, // O pote só enche quando os jogadores "pagam" a entrada no botão
            players: [donoData], // Cadeira 1 ocupada
            estado: 'lobby'
        };
        ActiveTables.set(canalId, mesa);

        try {
            // Gera o ecrã do Lobby (1 jogador sentado, 5 cadeiras vazias)
            const imgBuffer = await generateRoletaImage('lobby', mesa.players, -1, mesa.pot);
            const attachment = new AttachmentBuilder(imgBuffer, { name: 'roleta.png' });

            const embed = new EmbedBuilder()
                .setColor('#2a0404')
                .setTitle('🔫 MESA DA MÁFIA ABERTA')
                .setDescription(`**Aposta por Cadeira:** ${valorAposta.toLocaleString('pt-BR')} HypeCoins\n\nQualquer pessoa pode entrar! Quando a mesa tiver entre 2 e 6 jogadores, o dono da mesa pode mandar girar o tambor.`)
                .setImage('attachment://roleta.png');

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('eco_roleta_join').setLabel('Sentar e Apostar').setStyle(ButtonStyle.Success).setEmoji('💰'),
                new ButtonBuilder().setCustomId('eco_roleta_start').setLabel('Girar Tambor (Dono)').setStyle(ButtonStyle.Danger).setEmoji('🔫')
            );

            await interaction.editReply({ embeds: [embed], files: [attachment], components: [row] });

        } catch (error) {
            console.error('❌ Erro a gerar Lobby da Roleta:', error);
            ActiveTables.delete(canalId); // Limpa se der erro
            await interaction.editReply('❌ Erro a montar a mesa.');
        }
    },
    // Exporta o mapa para o outro ficheiro poder ler
    ActiveTables
};