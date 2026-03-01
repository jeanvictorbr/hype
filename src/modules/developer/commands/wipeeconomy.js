const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wipeeconomy')
        .setDescription('🛠️ [Dono] Zera TODA a economia (Carteira e Banco) de todos os jogadores.'),

    async execute(interaction) {
        // Verifica se quem está a usar é o dono do Bot (Puxa do teu .env)
        // O split(',') permite que ponhas mais que um dono no .env separados por vírgula
        const ownerIds = process.env.OWNER_ID ? process.env.OWNER_ID.split(',') : [];
        
        if (!ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ 
                content: '❌ **Acesso Negado.** Apenas o Dono Supremo do Bot pode usar este comando divino.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('dev_wipe_confirm')
                .setLabel('💥 SIM, DESTRUIR ECONOMIA')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('dev_wipe_cancel')
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({
            content: '⚠️ **ALERTA DE DESTRUIÇÃO EM MASSA** ⚠️\nTem a certeza absoluta de que deseja **ZERAR O DINHEIRO (Carteira e Banco)** de TODOS os jogadores do banco de dados?\n\n*Esta ação é irreversível e todos os jogadores perderão os seus fundos!*',
            components: [row],
            flags: [MessageFlags.Ephemeral] 
        });
    }
};