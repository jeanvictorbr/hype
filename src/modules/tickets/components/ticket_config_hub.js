const { 
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, 
    ChannelSelectMenuBuilder, ChannelType, RoleSelectMenuBuilder,
    MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_config_hub',

    async execute(interaction, client) {
        const guildId = interaction.guild.id;

        // 1. Busca Configuração
        let config = await prisma.ticketConfig.findUnique({
            where: { guildId: guildId },
            include: { departments: true }
        });

        // Se não existir, cria o básico
        if (!config) {
            config = await prisma.ticketConfig.create({
                data: { guildId: guildId, staffRoles: [] }
            });
        }

        // 2. Prepara os Textos de Status
        const statusCat = config.ticketCategory ? `<#${config.ticketCategory}>` : '❌ Não definido';
        const statusLog = config.logChannel ? `<#${config.logChannel}>` : '❌ Não definido';
        const statusStaff = config.staffRoles.length > 0 ? `${config.staffRoles.length} cargos` : '❌ Ninguém';
        const deptCount = config.departments.length;

        // 3. Interface V2 (Dashboard App-Like)
        const header = new TextDisplayBuilder()
            .setContent('# 🎫 Central de Tickets\nGerencie o design, a infraestrutura e a equipe de atendimento.');

        const stats = new TextDisplayBuilder()
            .setContent(`**📊 Infraestrutura Atual:**\n📂 **Categoria:** ${statusCat}\n📜 **Logs/Transcripts:** ${statusLog}\n👮 **Staff:** ${statusStaff}\n🏷️ **Departamentos:** ${deptCount}`);

        const vitrine = new TextDisplayBuilder()
            .setContent(`**🎨 Preview da Vitrine:**\n> **Título:** ${config.panelTitle}\n> **Rodapé:** ${config.panelFooter || 'Padrão'}`);

        // --- BOTÕES E MENUS ---

        // Linha 1: Ações Principais
        const rowMain = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_btn_setup').setLabel('✨ Setup Automático (Completo)').setStyle(ButtonStyle.Success).setEmoji('🪄'),
            new ButtonBuilder().setCustomId('ticket_btn_panel').setLabel('🚀 Enviar Painel').setStyle(ButtonStyle.Primary).setEmoji('📨'),
            new ButtonBuilder().setCustomId('ticket_visual_editor').setLabel('🎨 Editar Design').setStyle(ButtonStyle.Secondary)
        );

        // Linha 2: Config Manual (Menus) - Categoria
        const rowCat = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('ticket_manual_cat')
                .setPlaceholder('🔧 Definir Categoria Manualmente...')
                .addChannelTypes(ChannelType.GuildCategory)
        );

        // Linha 3: Config Manual (Menus) - Logs
        const rowLogs = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('ticket_manual_logs')
                .setPlaceholder('🔧 Definir Canal de Logs Manualmente...')
                .addChannelTypes(ChannelType.GuildText)
        );

        // Linha 4: Staff
        const rowStaff = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
                .setCustomId('select_ticket_staff')
                .setPlaceholder('👮 Definir/Atualizar Staff...')
                .setMinValues(1)
                .setMaxValues(10)
        );

        const container = new ContainerBuilder()
            .setAccentColor(0x2C2F33)
            .addTextDisplayComponents(header)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(stats)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(vitrine)
            .addSeparatorComponents(new SeparatorBuilder())
            .addActionRowComponents(rowMain)
            .addActionRowComponents(rowCat)
            .addActionRowComponents(rowLogs)
            .addActionRowComponents(rowStaff);

        // Resposta Inteligente (Update ou Reply)
        if (interaction.isMessageComponent()) {
            await interaction.update({ components: [container], flags: [MessageFlags.IsComponentsV2] });
        } else {
            await interaction.reply({ components: [container], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
        }
    }
};