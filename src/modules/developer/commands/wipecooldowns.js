const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wipecooldowns')
        .setDescription('🛠️ [Dono] Zera TODOS os cooldowns (Salários, Jogos, Sociais) de GERAL.'),

    async execute(interaction) {
        const ownerIds = process.env.OWNER_ID ? process.env.OWNER_ID.split(',') : [];
        
        if (!ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ 
                content: '❌ **Acesso Negado.** Apenas o Dono pode dar reset global nos cooldowns.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('dev_wipe_cd_confirm')
                .setLabel('💥 SIM, RESETAR COOLDOWNS GERAIS')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('dev_wipe_cd_cancel')
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({
            content: '⚠️ **ALERTA DE RESET GLOBAL** ⚠️\nTem a certeza de que deseja **ZERAR OS TEMPOS DE RECARGA** de TODOS os jogadores do banco de dados?\n\n*Isso vai libertar Salários, Roubos, Jogos e Ações Sociais para toda a gente imediatamente!*',
            components: [row],
            flags: [MessageFlags.Ephemeral] 
        });
    }
};