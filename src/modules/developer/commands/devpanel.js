const { 
    SlashCommandBuilder, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder,
    MessageFlags
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('devpanel')
        .setDescription('💻 [DEV] Central de Controle SaaS (Master)'),

    async execute(interaction, client) {
        // 🔒 Segurança Máxima (Lê múltiplos donos separados por vírgula no .env)
        const ownerIds = (process.env.OWNER_ID || '').split(',');
        
        if (!ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ 
                content: '🚫 Acesso restrito à Administração e CEO da Koda.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // ==========================================
        // 1. LISTAGEM DE CLIENTES (GUILDS)
        // ==========================================
        const guilds = client.guilds.cache.map(g => ({
            label: g.name,
            description: `ID: ${g.id} | Membros: ${g.memberCount}`,
            value: g.id,
            emoji: '🌐' // ✅ CORREÇÃO: Usando emoji universal para evitar crash
        })).slice(0, 25);

        // ==========================================
        // 2. CONSTRUÇÃO DA UI V2
        // ==========================================
        const header = new TextDisplayBuilder()
            .setContent(`# 🛰️ Koda Control Center\nBem-vindo, Mestre. Atualmente estamos operando em **${client.guilds.cache.size} servidores**.\n\n*Selecione um cliente abaixo para gerenciar licenças e módulos.*`);

        const divider = new SeparatorBuilder();

        const guildMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('dev_guild_manage') 
                .setPlaceholder('Selecione um Servidor para Gerenciar...')
                .addOptions(guilds.length > 0 ? guilds : [{ label: 'Nenhum servidor encontrado', value: 'none' }])
        );

        const container = new ContainerBuilder()
            .setAccentColor(0x2C2F33) // Dark Hacker Theme
            .addTextDisplayComponents(header)
            .addSeparatorComponents(divider)
            .addActionRowComponents(guildMenu);

        await interaction.reply({
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            components: [container]
        });
    }
};