const { SlashCommandBuilder, ActionRowBuilder, UserSelectMenuBuilder, PermissionsBitField, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetcooldowns')
        .setDescription('🛠️ [Dev/Admin] Zere todos os tempos de recarga de um Jogador ou VIP.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator), // Bloqueia para quem não é Admin!

    async execute(interaction, client) {
        // Trava secundária: Verifica se é o Dev (Dono) ou Admin da Guilda
        const isOwner = interaction.user.id === process.env.OWNER_ID;
        const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!isOwner && !isAdmin) {
            return interaction.reply({ content: '❌ Acesso negado. Apenas a Administração pode usar isto.', flags: [MessageFlags.Ephemeral] });
        }

        // Cria o menu nativo do Discord para selecionar usuários
        const menu = new UserSelectMenuBuilder()
            .setCustomId('eco_cooldown_select')
            .setPlaceholder('Selecione o jogador na lista...')
            .setMinValues(1)
            .setMaxValues(1);

        const row = new ActionRowBuilder().addComponents(menu);

        await interaction.reply({ 
            content: '🛠️ **Modo Deus: Limpeza de Cooldowns**\nSelecione no menu abaixo qual jogador você deseja purificar. Isso irá zerar instantaneamente **TODOS OS COOLDOWNS** (Diário, Semanal, Mensal, Sociais, Roubos, Jogos e Habilidades VIP).', 
            components: [row], 
            flags: [MessageFlags.Ephemeral] 
        });
    }
};