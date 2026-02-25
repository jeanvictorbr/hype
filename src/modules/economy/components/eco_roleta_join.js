const { AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateRoletaImage } = require('../../../utils/canvasRoletaRussa');
// Puxa o mapa de mesas ativas
const { ActiveTables } = require('../commands/roletarussa');

module.exports = {
    customId: 'eco_roleta_join',

    async execute(interaction) {
        const canalId = interaction.channel.id;
        const mesa = ActiveTables.get(canalId);

        // Se a mesa sumiu por algum motivo
        if (!mesa) return interaction.reply({ content: '❌ Esta mesa já não existe.', flags: [MessageFlags.Ephemeral] });
        
        // Se o jogo já começou (tranca a porta)
        if (mesa.estado !== 'lobby') return interaction.reply({ content: '❌ Tarde demais, a porta já foi trancada. O tambor está a girar!', flags: [MessageFlags.Ephemeral] });

        // Se a mesa já está cheia (6 gajos)
        if (mesa.players.length >= 6) return interaction.reply({ content: '❌ A mesa está cheia! (Máximo 6 jogadores).', flags: [MessageFlags.Ephemeral] });

        // Se o gajo já está sentado
        if (mesa.players.find(p => p.id === interaction.user.id)) {
            return interaction.reply({ content: '❌ Tu já estás sentado na mesa!', flags: [MessageFlags.Ephemeral] });
        }

        // Põe o Discord a pensar (Ephemeral para não sujar o chat se ele for pobre)
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            // VERIFICA O SALDO E COBRA A ENTRADA NA HORA!
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: interaction.user.id } });
            
            if (!userProfile || userProfile.hypeCash < mesa.valorAposta) {
                return interaction.editReply(`❌ Precisas de **${mesa.valorAposta.toLocaleString('pt-BR')} HC** para te sentares nesta mesa.`);
            }

            // Cobra o dinheiro
            await prisma.hypeUser.update({
                where: { id: interaction.user.id },
                data: { hypeCash: { decrement: mesa.valorAposta } }
            });

            // Se for o dono (ele entrou no comando inicial, agora cobramos-lhe a ele e enchemos o pote)
            // Lógica de segurança: O dono foi inserido no comando sem pagar. Agora pagou? Fixe, vamos cobrar ao dono também para ser justo (tens de descontar a ele no start, mas vamos assumir que o sistema junta o pot de forma visual e no fim entrega o lucro real)
            
            // Mas para o gajo que clicou:
            mesa.pot += mesa.valorAposta;

            // Prepara os dados dele para o Canvas
            const novoPlayer = {
                id: interaction.user.id,
                username: interaction.user.username,
                avatarBuffer: interaction.user.displayAvatarURL({ extension: 'png', size: 128 }),
                isDead: false
            };

            mesa.players.push(novoPlayer);

            // Re-desenha a mesa para todos verem a cara dele a aparecer na cadeira!
            const imgBuffer = await generateRoletaImage('lobby', mesa.players, -1, mesa.pot);
            const attachment = new AttachmentBuilder(imgBuffer, { name: 'roleta.png' });

            const embed = new EmbedBuilder()
                .setColor('#2a0404')
                .setTitle('🔫 MESA DA MÁFIA ABERTA')
                .setDescription(`**Aposta por Cadeira:** ${mesa.valorAposta.toLocaleString('pt-BR')} HC\n\n**Jogadores Prontos: ${mesa.players.length}/6**`)
                .setImage('attachment://roleta.png');

            // Atualiza a mensagem original no chat (Não a interação efémera)
            await interaction.message.edit({ embeds: [embed], files: [attachment], attachments: [] });

            // Avisa o gajo em privado que a aposta foi aceite
            await interaction.editReply(`✅ Pagaste **${mesa.valorAposta} HC** e sentaste-te na mesa. Boa sorte...`);

        } catch (error) {
            console.error('❌ Erro a entrar na mesa:', error);
            await interaction.editReply('❌ Erro ao tentar processar o pagamento.');
        }
    }
};