const { 
    ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_btn_panel',

    async execute(interaction, client) {
        // 1. Validação
        const config = await prisma.ticketConfig.findUnique({
            where: { guildId: interaction.guild.id },
            include: { departments: true }
        });

        if (!config || !config.ticketCategory) {
            return interaction.reply({ content: '❌ Configure a categoria primeiro.', flags: [MessageFlags.Ephemeral] });
        }

        // 2. Container V2
        const publicHeader = new TextDisplayBuilder()
            .setContent(`# ${config.panelTitle}\n${config.panelDescription}`);

        const publicContainer = new ContainerBuilder()
            .setAccentColor(0x2b2d31)
            .addTextDisplayComponents(publicHeader);

        if (config.panelFooter) {
            publicContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`*${config.panelFooter}*`)
            );
        }

        // 3. Componentes (Botão ou Menu)
        const row = new ActionRowBuilder();

        if (config.departments.length > 0) {
            // MODO DEPARTAMENTOS
            const options = config.departments.map(dept => ({
                label: dept.label,
                description: dept.description ? dept.description.substring(0, 50) : 'Selecionar área',
                value: `dept_${dept.id}`,
                emoji: dept.emoji || '🎫'
            }));

            row.addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('ticket_create_select') // ID padronizado
                    .setPlaceholder('Selecione o departamento...')
                    .addOptions(options)
            );
        } else {
            // MODO BOTÃO ÚNICO
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_create_btn') // ID padronizado
                    .setLabel('Abrir Ticket')
                    .setEmoji('📩')
                    .setStyle(ButtonStyle.Primary)
            );
        }

        publicContainer.addActionRowComponents(row);

        // 4. Envio
        try {
            await interaction.channel.send({
                flags: [MessageFlags.IsComponentsV2],
                components: [publicContainer]
            });
            await interaction.reply({ content: '✅ Painel enviado!', flags: [MessageFlags.Ephemeral] });
        } catch (error) {
            console.error('Erro envio painel:', error);
            await interaction.reply({ content: '❌ Erro ao enviar. Verifique permissões.', flags: [MessageFlags.Ephemeral] });
        }
    }
};