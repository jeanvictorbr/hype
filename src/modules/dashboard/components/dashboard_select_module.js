const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags,
    StringSelectMenuBuilder 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'dashboard_select_module',

    async execute(interaction, client) {
        // Captura o valor se for menu, ou o customId se for botão (ex: botão de voltar)
        const selectedModule = interaction.values ? interaction.values[0] : interaction.customId;
        const guildId = interaction.guild.id;

        // ==========================================
        // 🔊 TELA: CONFIGURAÇÃO DO AUTO-VOICE (Livre)
        // ==========================================
        // Nota: 'dashboard_btn_back' redireciona para cá também se viermos de sub-menus
        if (selectedModule === 'autovoice_setup' || selectedModule === 'dashboard_btn_back') {
            
            const headerText = new TextDisplayBuilder()
                .setContent('# 🔊 Módulo: Auto-Voice\nGerencie as salas dinâmicas do servidor. Use o **Setup Rápido** para criar as categorias automaticamente ou configure passo a passo.');

            const divider = new SeparatorBuilder();

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('autovoice_btn_setup').setLabel('✨ Setup Rápido').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('autovoice_btn_trigger').setLabel('📍 Definir Gatilho').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('autovoice_btn_bypass').setLabel('🎟️ Add Passe Livre').setStyle(ButtonStyle.Secondary),
                // Botão para recarregar o menu principal
                new ButtonBuilder().setCustomId('dashboard_reload_main').setLabel('◀ Voltar').setStyle(ButtonStyle.Danger)
            );

            const autovoiceContainer = new ContainerBuilder()
                .setAccentColor(0x5865F2)
                .addTextDisplayComponents(headerText)
                .addSeparatorComponents(divider)
                .addActionRowComponents(actionRow);

            // CORREÇÃO: Tenta update primeiro, se falhar (ex: slash command original), usa editReply
            try {
                if (interaction.isMessageComponent()) {
                    await interaction.update({ 
                        components: [autovoiceContainer], 
                        flags: [MessageFlags.IsComponentsV2] 
                    });
                } else {
                    // Caso raro onde o comando / chama direto este módulo (se implementado assim)
                    await interaction.reply({ 
                        components: [autovoiceContainer], 
                        flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] 
                    });
                }
            } catch (error) {
                // Fallback de segurança
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ components: [autovoiceContainer], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
                } else {
                    await interaction.editReply({ components: [autovoiceContainer], flags: [MessageFlags.IsComponentsV2] });
                }
            }
        }

        // ==========================================
        // 🎫 TELA: CONFIGURAÇÃO DE TICKETS (💎 VIP)
        // ==========================================
        else if (selectedModule === 'tickets_setup') {
            
            // 1. Redirecionamento para o NOVO HUB DE TICKETS
            try {
                const ticketHub = require('../../tickets/components/ticket_config_hub');
                return await ticketHub.execute(interaction, client);
            } catch (error) {
                console.error("Erro ao carregar o Hub de Tickets:", error);
            }

            // Fallback se o Hub falhar
            const errorText = new TextDisplayBuilder().setContent('# ❌ Erro no Módulo\nNão foi possível carregar o painel de tickets.');
            const errorContainer = new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(errorText);
            
            await interaction.update({ components: [errorContainer], flags: [MessageFlags.IsComponentsV2] });
        }
        
        // ==========================================
        // 🔄 RELOAD: VOLTAR AO MENU PRINCIPAL (/hype)
        // ==========================================
        else if (selectedModule === 'dashboard_reload_main') {
            
            const headerText = new TextDisplayBuilder()
                .setContent('# 🚀 Central de Comando\nBem-vindo ao dashboard da nave. Gerencie todos os sistemas do servidor por aqui com fluidez máxima.');

            const divider = new SeparatorBuilder();

            const moduleSelect = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('dashboard_select_module')
                    .setPlaceholder('Escolha um módulo para configurar...')
                    .addOptions([
                        { label: 'Módulo: Auto-Voice', description: 'Canais dinâmicos e salas privadas.', value: 'autovoice_setup', emoji: '🔊' },
                        { label: 'Módulo: Tickets', description: 'Sistema de atendimento e suporte.', value: 'tickets_setup', emoji: '🎫' }
                    ])
            );

            const mainContainer = new ContainerBuilder()
                .setAccentColor(0x2b2d31)
                .addTextDisplayComponents(headerText)
                .addSeparatorComponents(divider)
                .addActionRowComponents(moduleSelect);

            await interaction.update({ components: [mainContainer], flags: [MessageFlags.IsComponentsV2] });
        }
    }
};