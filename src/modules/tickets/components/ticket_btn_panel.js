const { 
    ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_btn_panel',

    async execute(interaction, client) {
        // 1. Busca Config Completa
        const config = await prisma.ticketConfig.findUnique({
            where: { guildId: interaction.guild.id },
            include: { departments: true }
        });

        if (!config || !config.ticketCategory) {
            return interaction.reply({ content: '❌ Configuração incompleta.', flags: [MessageFlags.Ephemeral] });
        }

        // 2. Monta o Container (Vitrine Personalizada)
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

        // 3. Decide: Botão Único ou Select Menu?
        const row = new ActionRowBuilder();

        if (config.departments.length > 0) {
            // --- MODO DEPARTAMENTOS ---
            const options = config.departments.map(dept => ({
                label: dept.label,
                description: dept.description ? dept.description.substring(0, 50) : 'Clique para selecionar',
                value: `dept_${dept.id}`, // ID Único para abrir o ticket certo
                emoji: dept.emoji || '🎫'
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('ticket_open_select') // Novo ID para select menu
                .setPlaceholder('Selecione um departamento...')
                .addOptions(options);

            row.addComponents(selectMenu);
        } else {
            // --- MODO CLÁSSICO (BOTÃO) ---
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_open_general') // Novo ID genérico
                    .setLabel('Abrir Ticket')
                    .setEmoji('📩')
                    .setStyle(ButtonStyle.Primary)
            );
        }

        publicContainer.addActionRowComponents(row);

        // 4. Envia
        await interaction.channel.send({
            flags: [MessageFlags.IsComponentsV2],
            components: [publicContainer]
        });

        await interaction.reply({ content: '✅ Painel enviado com sucesso!', flags: [MessageFlags.Ephemeral] });
    }
};