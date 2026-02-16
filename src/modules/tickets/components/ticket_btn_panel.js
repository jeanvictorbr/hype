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

        // Validação de segurança
        if (!config || !config.ticketCategory) {
            return interaction.reply({ content: '❌ Configure a categoria primeiro no painel principal.', flags: [MessageFlags.Ephemeral] });
        }

        // 2. Monta o Container (Vitrine)
        const publicHeader = new TextDisplayBuilder()
            .setContent(`# ${config.panelTitle}\n${config.panelDescription}`);

        const publicContainer = new ContainerBuilder()
            .setAccentColor(0x2b2d31) // Dark Theme
            .addTextDisplayComponents(publicHeader);

        // ✅ CORREÇÃO AQUI: Removemos .setSize/.setColor e usamos Markdown (*)
        if (config.panelFooter) {
            publicContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`*${config.panelFooter}*`) 
            );
        }

        // 3. Monta os Componentes (Botão ou Menu)
        const row = new ActionRowBuilder();

        if (config.departments.length > 0) {
            // Modo Departamentos
            const options = config.departments.map(dept => ({
                label: dept.label,
                description: dept.description ? dept.description.substring(0, 50) : 'Falar com este setor',
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
            // Modo Botão Único
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_open_general')
                    .setLabel('Abrir Ticket')
                    .setEmoji('📩')
                    .setStyle(ButtonStyle.Primary)
            );
        }

        publicContainer.addActionRowComponents(row);

        // 4. Envia
        try {
            await interaction.channel.send({
                flags: [MessageFlags.IsComponentsV2],
                components: [publicContainer]
            });

            await interaction.reply({ content: '✅ Painel enviado com sucesso!', flags: [MessageFlags.Ephemeral] });
        } catch (error) {
            console.error('Erro ao enviar painel:', error);
            await interaction.reply({ content: '❌ Erro ao enviar. Verifique minhas permissões neste canal.', flags: [MessageFlags.Ephemeral] });
        }
    }
};