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
    data: new SlashCommandBuilder()
        .setName('hype')
        .setDescription('Abre a central de comando nativa (App V2) do bot.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const headerText = new TextDisplayBuilder()
            .setContent('# 🚀 Central de Comando\nBem-vindo ao dashboard da nave. Gerencie todos os sistemas do servidor por aqui com fluidez máxima.');

        const divider = new SeparatorBuilder();

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

        // 🛠️ CORREÇÃO AQUI: Métodos específicos da V2
        const mainContainer = new ContainerBuilder()
            .setAccentColor(0x2b2d31)
            .addTextDisplayComponents(headerText)
            .addSeparatorComponents(divider)
            .addActionRowComponents(moduleSelect);

        await interaction.reply({
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            components: [mainContainer]
        });
    }
};