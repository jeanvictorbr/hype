const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tigrinho')
        .setDescription('🎰 Gire a roleta e multiplique suas HypeCoins!')
        .addIntegerOption(option => 
            option.setName('aposta')
                .setDescription('Quantas HypeCoins você quer apostar?')
                .setRequired(true)
                .setMinValue(10)
        ),

    async execute(interaction, client) {
        // Usa ephemeral temporariamente para validar, mas o jogo final será público
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const aposta = interaction.options.getInteger('aposta');

        try {
            // 1. Verificação Módulo Premium
            const dbGuild = await prisma.guild.findUnique({ where: { id: guildId } });
            if (!dbGuild || !dbGuild.features.includes('CASSINO')) {
                return interaction.editReply('❌ O módulo de **Cassino** não está ativado neste servidor. Avise a Administração.');
            }

            // 2. Verificação de Saldo
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            if (!userProfile || userProfile.hypeCash < aposta) {
                return interaction.editReply(`❌ Saldo insuficiente. Você tem **${userProfile?.hypeCash || 0} HC**, mas tentou apostar **${aposta} HC**.`);
            }

            // 3. Remove as moedas da conta ANTES do jogo começar (Para evitar roubos se a net cair)
            await prisma.hypeUser.update({
                where: { id: userId },
                data: { hypeCash: { decrement: aposta } }
            });

            // 4. Inicia o Jogo! Chama o nosso "motor de cassino" em segundo plano
            await interaction.editReply('🎰 Ligando a máquina...');
            
            // Apaga a mensagem ephemeral e delega para o ficheiro visual
            await interaction.deleteReply();
            
            // Passa para o construtor do jogo (vai enviar no canal para todos verem)
            const cassinoEngine = require('../components/cassino_tigrinho_engine');
            await cassinoEngine.run(interaction, client, aposta, userProfile.hypeCash - aposta);

        } catch (error) {
            console.error('Erro no Tigrinho:', error);
            await interaction.editReply('❌ Ocorreu um erro na máquina. Suas moedas não foram descontadas.').catch(() => {});
        }
    }
};