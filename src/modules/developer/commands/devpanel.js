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
        .setDescription('💻 [DEV] Painel de Administração SaaS')
        .addStringOption(option => 
            option.setName('servidor_id')
                .setDescription('ID da Guilda (Servidor do Cliente) para gerenciar')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        // 🛡️ TRAVA DE SEGURANÇA ABSOLUTA: Só você pode usar isso
        if (interaction.user.id !== process.env.OWNER_ID) {
            return interaction.reply({ 
                content: '🚫 Acesso negado. Comando restrito à administração central.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        const targetGuildId = interaction.options.getString('servidor_id');

        // Busca o servidor no PostgreSQL
        let guildData = await prisma.guild.findUnique({ where: { id: targetGuildId } });

        // Se o servidor nunca usou o bot, a gente cadastra ele na hora
        if (!guildData) {
            guildData = await prisma.guild.create({ data: { id: targetGuildId } });
        }

        const currentFeatures = guildData.features.length > 0 ? guildData.features.join(', ') : 'Nenhuma (Plano Free)';

        // ==========================================
        // 💻 INTERFACE DO PAINEL DEV (App V2)
        // ==========================================
        const headerText = new TextDisplayBuilder()
            .setContent(`# 💻 Central de Operações\nGerenciando o servidor: \`${targetGuildId}\`\n\n**Módulos Liberados Atualmente:**\n💎 \`${currentFeatures}\``);

        const divider = new SeparatorBuilder();

        // Menu para injetar ou remover features
        const actionMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`dev_inject_feature_${targetGuildId}`) // Passamos o ID do servidor embutido no customId!
                .setPlaceholder('Alterar plano do cliente...')
                .addOptions([
                    {
                        label: 'Liberar: VIP Total (All)',
                        description: 'Libera todos os módulos presentes e futuros.',
                        value: 'feature_add_all',
                        emoji: '💎'
                    },
                    {
                        label: 'Liberar: Módulo Tickets',
                        description: 'Libera apenas o sistema avançado de tickets.',
                        value: 'feature_add_tickets',
                        emoji: '🎫'
                    },
                    {
                        label: 'Revogar Acesso (Downgrade)',
                        description: 'Remove todas as features VIP (Volta pro Free).',
                        value: 'feature_remove_all',
                        emoji: '🛑'
                    }
                ])
        );

        const devContainer = new ContainerBuilder()
            .setAccentColor(0x2C2F33) // Escuro/Hacker
            .addComponents(headerText, divider, actionMenu);

        await interaction.reply({
            flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
            components: [devContainer]
        });
    }
};