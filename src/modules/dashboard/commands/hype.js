const { 
    SlashCommandBuilder, 
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    PermissionFlagsBits,
    MessageFlags 
} = require('discord.js');

module.exports = {
    // 1. Definição do Comando
    data: new SlashCommandBuilder()
        .setName('hype')
        .setDescription('Abre a central de comando nativa (App V2) do bot.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    // 2. A Mágica da Interface V2
    async execute(interaction, client) {
        
        // 🏗️ TextDisplay: Substitui o 'Title' e 'Description' dos Embeds, suporta Markdown nativo
        const headerText = new TextDisplayBuilder()
            .setContent('# 🚀 Central de Comando\nBem-vindo ao dashboard da nave. Gerencie todos os sistemas do servidor por aqui com fluidez máxima.');

        // ➖ Separator: Uma quebra de linha visual elegante nativa do Discord
        const divider = new SeparatorBuilder();

        // 🎛️ ActionRow: O SelectMenu continua existindo, mas agora mora dentro da V2
        const moduleSelect = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('dashboard_select_module')
                .setPlaceholder('Escolha um módulo para configurar...')
                .addOptions([
                    {
                        label: 'Módulo: Auto-Voice',
                        description: 'Canais dinâmicos, permissões e setup rápido.',
                        value: 'autovoice_setup',
                        emoji: '🔊',
                    },
                    {
                        label: 'Módulo: Tickets',
                        description: 'Configurações de atendimento ao cliente.',
                        value: 'tickets_setup',
                        emoji: '🎫',
                    }
                ])
        );

        // 📦 Container: A grande revolução. Ele empacota tudo e adiciona a cor lateral (Accent Color)
        const mainContainer = new ContainerBuilder()
            .setAccentColor(0x2b2d31) // Cor dark invisível para fundir com o fundo do Discord
            .addComponents(headerText, divider, moduleSelect);

        // 👻 Enviando a resposta com as Flags corretas
        await interaction.reply({
            // 🚨 AQUI ESTÁ A REGRA DE OURO DA V2 🚨
            // Usamos a flag Ephemeral (Ghost Interface) combinada com a IsComponentsV2
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            
            // Na V2, é PROIBIDO enviar 'content' ou 'embeds'. Tudo vai dentro de 'components'.
            components: [mainContainer]
        });
    }
};