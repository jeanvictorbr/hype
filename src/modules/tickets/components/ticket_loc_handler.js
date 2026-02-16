const { 
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_loc_handler',

    async execute(interaction, client) {
        const protocol = interaction.fields.getTextInputValue('input_protocol').trim();
        
        const history = await prisma.ticketHistory.findUnique({
            where: { protocol: protocol }
        });

        if (!history) {
            return interaction.reply({ content: '❌ Protocolo não encontrado.', flags: [MessageFlags.Ephemeral] });
        }

        // Formata datas
        const dateOpen = history.createdAt.toLocaleDateString('pt-BR');
        const dateClose = history.closedAt.toLocaleDateString('pt-BR');
        
        // Formata Avaliação
        const rating = history.rating ? `${history.rating}/5 ⭐` : 'Não avaliado';
        const staff = history.staffId ? `<@${history.staffId}>` : 'N/A';

        // UI V2 Dashboard
        const header = new TextDisplayBuilder()
            .setContent(`# 📂 Arquivo de Ticket\n**Protocolo:** \`${protocol}\``);

        const details = new TextDisplayBuilder()
            .setContent(`**👤 Cliente:** <@${history.ownerId}>\n**👮 Staff:** ${staff}\n**📅 Data:** ${dateOpen} - ${dateClose}\n**⭐ Avaliação:** ${rating}\n**💬 Comentário:** ${history.comment || '-'}`);

        const row = new ActionRowBuilder();
        
        if (history.transcriptUrl) {
            row.addComponents(
                new ButtonBuilder()
                    .setLabel('Baixar Transcript')
                    .setEmoji('📥')
                    .setStyle(ButtonStyle.Link)
                    .setURL(history.transcriptUrl)
            );
        } else {
            row.addComponents(
                new ButtonBuilder().setCustomId('disabled_btn').setLabel('Transcript Indisponível').setStyle(ButtonStyle.Secondary).setDisabled(true)
            );
        }

        const container = new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(header)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(details)
            .addActionRowComponents(row);

        await interaction.reply({ components: [container], flags: [MessageFlags.IsComponentsV2] });
    }
};