const { 
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, 
    ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle,
    MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_active_manager',

    async execute(interaction, client) {
        // Blindagem UI
        if (interaction.isButton()) await interaction.deferUpdate();

        const guildId = interaction.guild.id;

        // 1. Buscar todos os tickets ativos desta guilda
        const activeTickets = await prisma.activeTicket.findMany({
            where: { guildId: guildId },
            take: 25 // Limite do Select Menu do Discord
        });

        // 2. Construir Opções do Menu
        let options = [];
        let descriptionText = '';

        if (activeTickets.length === 0) {
            descriptionText = '✅ **Limpo!** Não há tickets abertos no momento.';
        } else {
            descriptionText = `⚠️ **${activeTickets.length} Tickets Abertos** encontrados.\nSelecione um abaixo para **FORÇAR O FECHAMENTO** (útil se o canal foi deletado e bugou o ticket).`;

            // Mapeia os tickets para o menu
            for (const ticket of activeTickets) {
                // Tenta achar o canal real
                const channel = interaction.guild.channels.cache.get(ticket.channelId);
                // Tenta achar o dono
                const owner = await client.users.fetch(ticket.ownerId).catch(() => null);
                
                const label = channel ? `#${channel.name}` : `🚫 Canal Deletado (${ticket.channelId})`;
                const desc = owner ? `Aberto por: ${owner.tag}` : `Owner ID: ${ticket.ownerId}`;
                
                options.push({
                    label: label.substring(0, 25), // Limite label
                    description: desc.substring(0, 50),
                    value: ticket.channelId, // O valor é o ID do Canal (chave primária)
                    emoji: channel ? '🎫' : '👻' // Fantasma se não achar o canal
                });
            }
        }

        // 3. Montar UI
        const header = new TextDisplayBuilder()
            .setContent(`# 🚨 Gestão de Tickets Ativos\n${descriptionText}`);

        const container = new ContainerBuilder()
            .setAccentColor(0xED4245) // Vermelho Alerta
            .addTextDisplayComponents(header);

        // Se tiver tickets, adiciona o menu de exclusão
        if (options.length > 0) {
            container.addSeparatorComponents(new SeparatorBuilder());
            
            const menuRow = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('ticket_force_close') // Handler que vamos criar
                    .setPlaceholder('Selecione um ticket para DELETAR DO SISTEMA...')
                    .addOptions(options)
            );
            container.addActionRowComponents(menuRow);
        }

        // Botão de Voltar/Refresh
        const btnRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_active_manager').setLabel('🔄 Atualizar Lista').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_config_hub').setLabel('◀ Voltar ao Hub').setStyle(ButtonStyle.Primary)
        );
        container.addActionRowComponents(btnRow);

        await interaction.editReply({ components: [container], flags: [MessageFlags.IsComponentsV2] });
    }
};