const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    MessageFlags 
} = require('discord.js');

module.exports = {
    customId: 'dev_eco_manage',

    async execute(interaction, client) {
        const guildId = interaction.customId.split('_').pop();
        if (!guildId) return interaction.reply({ content: '❌ Erro ao buscar ID do servidor.', flags: [MessageFlags.Ephemeral] });

        const discordGuild = client.guilds.cache.get(guildId);
        const color = 0x57F287; // Verde Dinheiro

        // ==========================================
        // 💰 PÁGINA 2: ECONOMIA, LOJA E JOGADORES VIP
        // ==========================================
        const header = new TextDisplayBuilder()
            .setContent(`# 💰 Economia & VIPs (Pág 2/2)\nServidor: **${discordGuild ? discordGuild.name : 'Desconhecido'}**`);

        // Gestão da Loja Base e Dinheiro
        const labelEconomy = new TextDisplayBuilder().setContent('**💸 HypeCash & Lojinha Negra**');
        const rowEconomy = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`eco_hypecash_add_${guildId}`).setLabel('Dar Saldo').setStyle(ButtonStyle.Success).setEmoji('➕'),
            new ButtonBuilder().setCustomId(`eco_hypecash_rem_${guildId}`).setLabel('Tirar Saldo').setStyle(ButtonStyle.Danger).setEmoji('➖'),
            new ButtonBuilder().setCustomId(`eco_store_add_${guildId}`).setLabel('Criar Item').setStyle(ButtonStyle.Primary).setEmoji('📦'),
            new ButtonBuilder().setCustomId(`eco_store_rem_${guildId}`).setLabel('Remover Item').setStyle(ButtonStyle.Danger).setEmoji('🗑️'),
            new ButtonBuilder().setCustomId(`eco_store_list_${guildId}`).setLabel('Ver Itens').setStyle(ButtonStyle.Secondary).setEmoji('📋')
        );

// Configuração do Sistema VIP Local
        const labelConfig = new TextDisplayBuilder().setContent('**⚙️ Configurações do Sistema VIP**');
        const rowVipLogs = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`eco_manage_vip_roles_${guildId}`).setLabel('Cargos VIP').setStyle(ButtonStyle.Primary).setEmoji('👑'),
            new ButtonBuilder().setCustomId(`eco_setup_banlog_${guildId}`).setLabel('Canal Punições').setStyle(ButtonStyle.Danger).setEmoji('⚖️'),
            // 👇 SEPARAMOS EM 2 BOTÕES: PREÇOS E TOKEN MP
            new ButtonBuilder().setCustomId(`eco_config_vip_finance_${guildId}`).setLabel('Preços VIP (1 a 5)').setStyle(ButtonStyle.Success).setEmoji('💵'),
            new ButtonBuilder().setCustomId(`eco_config_mp_token_${guildId}`).setLabel('Token MP').setStyle(ButtonStyle.Success).setEmoji('🏦')
        );

        // Gestão Direta sobre os JOGADORES
        const labelPlayers = new TextDisplayBuilder().setContent('**👤 Gestão de Jogadores VIP**');
        const rowPlayers = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`eco_give_vip_user_${guildId}`).setLabel('Dar VIP a Jogador').setStyle(ButtonStyle.Success).setEmoji('🎁'),
            
            // 👇 AQUI ESTÁ O NOVO BOTÃO PARA TIRAR O VIP DO MEMBRO!
            new ButtonBuilder().setCustomId(`eco_remove_vip_user_${guildId}`).setLabel('Remover VIP de Jogador').setStyle(ButtonStyle.Danger).setEmoji('🛑')
        );

        // Voltar para a Página 1
        const rowNav = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`dev_guild_manage_${guildId}`).setLabel('⬅️ Voltar para Gestão do Servidor').setStyle(ButtonStyle.Secondary)
        );

        const container = new ContainerBuilder()
            .setAccentColor(color)
            .addTextDisplayComponents(header)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(labelEconomy)
            .addActionRowComponents(rowEconomy)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(labelConfig)
            .addActionRowComponents(rowVipLogs)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(labelPlayers)
            .addActionRowComponents(rowPlayers)
            .addSeparatorComponents(new SeparatorBuilder())
            .addActionRowComponents(rowNav);

        await interaction.update({
            components: [container],
            flags: [MessageFlags.IsComponentsV2]
        });
    }
};
