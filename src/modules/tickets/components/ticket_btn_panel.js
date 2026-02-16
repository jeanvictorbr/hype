const { 
    ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_btn_panel',

    async execute(interaction, client) {
        const config = await prisma.ticketConfig.findUnique({
            where: { guildId: interaction.guild.id },
            include: { departments: true }
        });

        if (!config || !config.ticketCategory) {
            return interaction.reply({ content: '❌ Configure a categoria primeiro.', flags: [MessageFlags.Ephemeral] });
        }

        const publicHeader = new TextDisplayBuilder()
            .setContent(`# ${config.panelTitle}\n${config.panelDescription}`);

        const publicContainer = new ContainerBuilder()
            .setAccentColor(0x2b2d31)
            .addTextDisplayComponents(publicHeader);

        if (config.panelFooter) {
            publicContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(config.panelFooter).setSize('Small').setColor('Subtext')
            );
        }

        const row = new ActionRowBuilder();

        if (config.departments.length > 0) {
            const options = config.departments.map(dept => ({
                label: dept.label,
                description: dept.description || 'Falar com este setor',
                value: `dept_${dept.id}`,
                emoji: dept.emoji || '🎫'
            }));

            row.addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('ticket_open_select')
                    .setPlaceholder('Selecione o departamento...')
                    .addOptions(options)
            );
        } else {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_open_general')
                    .setLabel('Abrir Ticket')
                    .setEmoji('📩')
                    .setStyle(ButtonStyle.Primary)
            );
        }

        publicContainer.addActionRowComponents(row);

        await interaction.channel.send({
            flags: [MessageFlags.IsComponentsV2],
            components: [publicContainer]
        });

        await interaction.reply({ content: '✅ Painel enviado!', flags: [MessageFlags.Ephemeral] });
    }
};