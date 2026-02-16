const { 
    SlashCommandBuilder, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder,
    ActionRowBuilder, 
    StringSelectMenuBuilder,
    MessageFlags
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('devpanel')
        .setDescription('💻 [DEV] Central de Controle SaaS (Master)'),

    async execute(interaction, client) {
        // 🔒 Segurança Máxima
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ 
                content: '🚫 Acesso restrito ao CEO da Koda.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // ==========================================
        // 1. LISTAGEM DE CLIENTES (GUILDS)
        // ==========================================
        // Pega as guildas onde o bot está (Cache do Discord)
        const guilds = client.guilds.cache.map(g => ({
            label: g.name,
            description: `ID: ${g.id} | Membros: ${g.memberCount}`,
            value: g.id,
            emoji: 'BW_Server' // Se não tiver emoji custom, use 'wd_server' ou similar
        })).slice(0, 25); // Limite de 25 do Discord Menu

        // Busca dados do banco para mostrar status (Opcional, mas legal)
        const totalGuilds = client.guilds.cache.size;

        // ==========================================
        // 2. CONSTRUÇÃO DA UI V2
        // ==========================================
        const header = new TextDisplayBuilder()
            .setContent(`# 🛰️ Koda Control Center\nBem-vindo, Mestre. Atualmente estamos operando em **${totalGuilds} servidores**.\n\n*Selecione um cliente abaixo para gerenciar licenças e módulos.*`);

        const divider = new SeparatorBuilder();

        const guildMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('dev_guild_manage') // Vai chamar o próximo arquivo
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