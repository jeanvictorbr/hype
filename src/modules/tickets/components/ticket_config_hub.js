const { ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_config_hub', // Use este ID no botão do Dashboard principal

    async execute(interaction, client) {
        const config = await prisma.ticketConfig.findUnique({
            where: { guildId: interaction.guild.id },
            include: { departments: true } // Puxa os departamentos juntos
        });

        if (!config) return interaction.reply({ content: '⚠️ Faça o Setup Rápido primeiro.', flags: [MessageFlags.Ephemeral] });

        // LISTAGEM DE DEPARTAMENTOS
        let deptText = config.departments.length > 0 
            ? config.departments.map(d => `• ${d.emoji || '📂'} **${d.label}**`).join('\n')
            : '*Nenhum departamento criado (Modo Botão Único)*';

        const header = new TextDisplayBuilder().setContent('# 🎫 Configuração de Tickets').setWeight('Bold');
        const vitrineInfo = new TextDisplayBuilder().setContent(`**🎨 Vitrine Atual:**\nTitle: ${config.panelTitle}\n\n**📂 Departamentos:**\n${deptText}`);

        // LINHA 1: Personalização Visual
        const rowVisual = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_edit_visual').setLabel('Editar Vitrine (Texto)').setEmoji('🎨').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ticket_add_dept_modal').setLabel('Add Departamento').setEmoji('➕').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('ticket_del_dept_menu').setLabel('Remover Dept').setEmoji('🗑️').setStyle(ButtonStyle.Danger).setDisabled(config.departments.length === 0)
        );

        // LINHA 2: Sistema e Envio
        const rowSystem = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_btn_staff').setLabel('Definir Staff').setEmoji('👮').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_btn_logs').setLabel('Canal de Logs').setEmoji('📜').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_btn_panel').setLabel('🚀 ENVIAR PAINEL').setEmoji('🚀').setStyle(ButtonStyle.Primary)
        );

        const container = new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(header)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(vitrineInfo)
            .addSeparatorComponents(new SeparatorBuilder())
            .addActionRowComponents(rowVisual, rowSystem);

        // Se for update ou reply
        if (interaction.isMessageComponent()) {
            await interaction.update({ components: [container], flags: [MessageFlags.IsComponentsV2] });
        } else {
            await interaction.reply({ components: [container], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
        }
    }
};