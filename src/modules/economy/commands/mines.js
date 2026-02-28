const { SlashCommandBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mines')
        .setDescription('💣 Jogue no Campo Minado Hype e multiplique suas moedas!')
        .addIntegerOption(option => 
            option.setName('aposta')
                .setDescription('Quantas HypeCoins quer apostar?')
                .setRequired(true)
                .setMinValue(10)
        ),

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const betAmount = interaction.options.getInteger('aposta');

        try {
            // 1. Verificações
            const dbGuild = await prisma.guild.findUnique({ where: { id: guildId } });
            if (!dbGuild || !dbGuild.features.includes('CASSINO')) {
                return interaction.editReply('❌ O módulo de **Cassino** não está ativado neste servidor.');
            }

            const userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            if (!userProfile || userProfile.hypeCash < betAmount) {
                return interaction.editReply(`❌ Saldo insuficiente. Faltam moedas para apostar **R$ ${betAmount}**.`);
            }

            // 2. Cobra a Aposta
            await prisma.hypeUser.update({
                where: { id: userId },
                data: { hypeCash: { decrement: betAmount } }
            });

            // 3. Gera a Grelha de 20 Blocos (3 Bombas, 17 Diamantes)
            const totalTiles = 20;
            const bombCount = 3;
            let grid = Array(totalTiles).fill('gem');
            for (let i = 0; i < bombCount; i++) { grid[i] = 'bomb'; }
            
            // Embaralha as bombas (Fisher-Yates Shuffle)
            for (let i = grid.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [grid[i], grid[j]] = [grid[j], grid[i]];
            }

            // 4. Salva a sessão do jogo na memória do Bot
            if (!client.activeMines) client.activeMines = new Map();
            client.activeMines.set(userId, {
                bet: betAmount,
                bombs: bombCount,
                grid: grid,
                clicked: [], // IDs dos botões já clicados
                hits: 0
            });

            // 5. Constrói o Visual V2 (App Native)
            const header = new TextDisplayBuilder().setContent(`# 💣 MINES HYPE\nO campo minado de <@${userId}> começou!`);
            const stats = new TextDisplayBuilder().setContent(`**Aposta:** R$ ${betAmount}\n**Multiplicador:** 1.00x\n**Lucro Atual:** 0 HC`);

            const container = new ContainerBuilder()
                .setAccentColor(0x2b2d31) // Cinzento escuro padrão
                .addTextDisplayComponents(header)
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(stats);

            // 6. Constrói os 25 Botões (4 Linhas de Jogo + 1 Linha de Ação)
            const rows = [];
            for (let r = 0; r < 4; r++) {
                const row = new ActionRowBuilder();
                for (let c = 0; c < 5; c++) {
                    const index = r * 5 + c;
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`eco_mines_click_${index}_${userId}`)
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('🔲')
                    );
                }
                rows.push(row);
            }

            // A 5ª Linha: O Botão de Sacar (Começa desativado até ele clicar na 1ª pedra)
            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`eco_mines_cashout_${userId}`)
                    .setLabel('💰 Retirar Lucro (R$ 0)')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true)
            );
            rows.push(actionRow);

            // 7. Lança a mensagem no chat público!
            await interaction.channel.send({ components: [container, ...rows], flags: [MessageFlags.IsComponentsV2] });
            await interaction.deleteReply(); // Apaga a resposta "a pensar..."

        } catch (error) {
            console.error('Erro ao iniciar Mines:', error);
            await interaction.editReply('❌ Ocorreu um erro ao gerar o campo minado.');
        }
    }
};