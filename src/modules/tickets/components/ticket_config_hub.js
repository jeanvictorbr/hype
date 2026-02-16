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

        // ==========================================
        // 🔒 VERIFICAÇÃO DE PREMIUM (SAAS)
        // ==========================================
        // Garantimos que a guilda existe para checar as features
        let guildData = await prisma.guild.findUnique({ where: { id: guildId } });
        if (!guildData) {
            guildData = await prisma.guild.create({ data: { id: guildId } });
        }

        const features = guildData.features || [];
        const hasAccess = features.includes('tickets') || features.includes('all');

        // 🚫 BLOQUEIO: Se não tiver a feature, mostra o aviso e para.
        if (!hasAccess) {
            const lockHeader = new TextDisplayBuilder()
                .setContent('# 🔒 Funcionalidade Premium\nO módulo de **Tickets Avançados** é exclusivo para servidores com plano ativo.');

            const lockBody = new TextDisplayBuilder()
                .setContent('Com este módulo, você pode:\n> ✨ Criar painéis ilimitados\n> 👮 Definir equipas de suporte\n> 📜 Guardar logs (Transcripts)\n> ⭐ Sistema de Avaliação e Ranking');

            const lockContainer = new ContainerBuilder()
                .setAccentColor(0xFEE75C) // Dourado Premium
                .addTextDisplayComponents(lockHeader)
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(lockBody);

            if (interaction.replied || interaction.deferred) {
                return await interaction.editReply({ components: [lockContainer], flags: [MessageFlags.IsComponentsV2] });
            } else {
                return await interaction.reply({ components: [lockContainer], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
            }
        }

        // ==========================================
        // ⚙️ LÓGICA DO HUB (ACESSO PERMITIDO)
        // ==========================================

        // 1. Busca Configuração e Departamentos
        let config = await prisma.ticketConfig.findUnique({
            where: { guildId: guildId },
            include: { departments: true }
        });

        // Cria configuração padrão se não existir
        if (!config) {
            config = await prisma.ticketConfig.create({
                data: { guildId: guildId, staffRoles: [] }
            });
        }

        // 2. Dados em Tempo Real
        const activeCount = await prisma.activeTicket.count({ where: { guildId: guildId } });
        
        const statusCat = config.ticketCategory ? `<#${config.ticketCategory}>` : '❌ Não definido';
        const statusLog = config.logChannel ? `<#${config.logChannel}>` : '❌ Não definido';
        const statusStaff = config.staffRoles.length > 0 ? `${config.staffRoles.length} cargos` : '❌ Ninguém';
        const deptCount = config.departments.length;

        // 3. Interface V2 (Dashboard App-Like)
        const header = new TextDisplayBuilder()
            .setContent('# 🎫 Central de Tickets\nPainel de controle total do sistema de atendimento.');

        const stats = new TextDisplayBuilder()
            .setContent(`**📊 Diagnóstico:**\n📂 **Categoria:** ${statusCat}\n📜 **Logs (Privado):** ${statusLog}\n👮 **Staff:** ${statusStaff}\n🏷️ **Departamentos:** ${deptCount}\n🟢 **Tickets Abertos:** ${activeCount}`);

        const vitrine = new TextDisplayBuilder()
            .setContent(`**🎨 Preview da Vitrine:**\n> **Título:** ${config.panelTitle}\n> **Rodapé:** ${config.panelFooter || 'Padrão'}`);

        // LINHA 1: Ações Críticas
        const rowMain = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_btn_setup').setLabel('Setup Auto').setStyle(ButtonStyle.Success).setEmoji('🪄'),
            new ButtonBuilder().setCustomId('ticket_btn_panel').setLabel('Enviar Painel').setStyle(ButtonStyle.Primary).setEmoji('📨'),
            new ButtonBuilder().setCustomId('ticket_ranking_panel').setLabel('Ranking').setStyle(ButtonStyle.Primary).setEmoji('🏆'),
            new ButtonBuilder().setCustomId('ticket_active_manager').setLabel('Gerir Abertos').setStyle(ButtonStyle.Danger).setEmoji('🚨')
        );

        // LINHA 2: Personalização
        const rowVisual = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_visual_editor').setLabel('🎨 Editar Design').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_add_dept_modal').setLabel('Add Dept').setEmoji('➕').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('ticket_remove_dept_menu').setLabel('Remover Dept').setEmoji('🗑️').setStyle(ButtonStyle.Danger).setDisabled(deptCount === 0)
        );

        // LINHA 3: Config Manual - Categoria
        const rowCat = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('ticket_manual_cat')
                .setPlaceholder('🔧 Definir Categoria Manualmente...')
                .addChannelTypes(ChannelType.GuildCategory)
        );

        // LINHA 4: Config Manual - Logs
        const rowLogs = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('ticket_manual_logs')
                .setPlaceholder('🔧 Definir Canal de Logs Manualmente...')
                .addChannelTypes(ChannelType.GuildText)
        );

        // LINHA 5: Staff
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
            .addActionRowComponents(rowVisual)
            .addActionRowComponents(rowCat)
            .addActionRowComponents(rowLogs)
            .addActionRowComponents(rowStaff);

        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ components: [container], flags: [MessageFlags.IsComponentsV2] });
        } else if (interaction.isMessageComponent()) {
            await interaction.update({ components: [container], flags: [MessageFlags.IsComponentsV2] });
        } else {
            await interaction.reply({ components: [container], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
        }
    }
};