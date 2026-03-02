const { AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateRoletaImage } = require('../../../utils/canvasRoletaRussa');
// Puxa o mapa de mesas ativas
const { ActiveTables } = require('../commands/roletarussa');

module.exports = {
    customId: 'eco_roleta_join',

    async execute(interaction) {
        const canalId = interaction.channel.id;
        const mesa = ActiveTables.get(canalId) || interaction.client.activeRoleta?.get(canalId);

        if (!mesa) return interaction.reply({ content: '❌ Esta mesa já não existe.', flags: [MessageFlags.Ephemeral] });
        
        if (mesa.estado !== 'lobby') return interaction.reply({ content: '❌ Tarde demais, a porta já foi trancada. O tambor está a girar!', flags: [MessageFlags.Ephemeral] });

        if (mesa.players.length >= 6) return interaction.reply({ content: '❌ A mesa está cheia! (Máximo 6 jogadores).', flags: [MessageFlags.Ephemeral] });

        if (mesa.players.find(p => p.id === interaction.user.id)) {
            return interaction.reply({ content: '❌ Tu já estás sentado na mesa!', flags: [MessageFlags.Ephemeral] });
        }

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            // VERIFICA O SALDO E COBRA DA CARTEIRA NA HORA!
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: interaction.user.id } });
            
            if (!userProfile || userProfile.carteira < mesa.valorAposta) {
                return interaction.editReply(`❌ Precisas de **R$ ${mesa.valorAposta.toLocaleString('pt-BR')}** na carteira para te sentares nesta mesa.`);
            }

            // Cobra o dinheiro da CARTEIRA
            await prisma.hypeUser.update({
                where: { id: interaction.user.id },
                data: { carteira: { decrement: mesa.valorAposta } }
            });
            
            mesa.pot += mesa.valorAposta;

            const novoPlayer = {
                id: interaction.user.id,
                username: interaction.user.username,
                avatarBuffer: interaction.user.displayAvatarURL({ extension: 'png', size: 128 }),
                isDead: false
            };

            mesa.players.push(novoPlayer);

            const imgBuffer = await generateRoletaImage('lobby', mesa.players, -1, mesa.pot);
            const attachment = new AttachmentBuilder(imgBuffer, { name: 'roleta.png' });

            const embed = new EmbedBuilder()
                .setColor('#2a0404')
                .setTitle('🔫 MESA DA MÁFIA ABERTA')
                .setDescription(`**Aposta por Cadeira:** R$ ${mesa.valorAposta.toLocaleString('pt-BR')}\n\n**Jogadores Prontos: ${mesa.players.length}/6**`)
                .setImage('attachment://roleta.png');

            await interaction.message.edit({ embeds: [embed], files: [attachment], attachments: [] });

            await interaction.editReply(`✅ Pagou **R$ ${mesa.valorAposta.toLocaleString('pt-BR')}** e sentou-se na mesa. Boa sorte...`);

        } catch (error) {
            console.error('❌ Erro a entrar na mesa:', error);
            await interaction.editReply('❌ Erro ao tentar processar o pagamento.');
        }
    }
};