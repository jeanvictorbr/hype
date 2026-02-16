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
        // Captura o valor (se for menu) ou o customId (se for botão de voltar)
        const selectedModule = interaction.values ? interaction.values[0] : interaction.customId;
        const guildId = interaction.guild.id;

        // ==========================================
        // 🔊 TELA: CONFIGURAÇÃO DO AUTO-VOICE
        // ==========================================
        if (selectedModule === 'autovoice_setup' || selectedModule === 'dashboard_btn_back') {
            
            const headerText = new TextDisplayBuilder()
                .setContent('# 🔊 Módulo: Auto-Voice\nGerencie as salas dinâmicas. Use o **Setup Rápido** para criar tudo automaticamente ou configure manualmente.');

            const divider = new SeparatorBuilder();

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('autovoice_btn_setup').setLabel('✨ Setup Rápido').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('autovoice_btn_trigger').setLabel('📍 Definir Gatilho').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('autovoice_btn_bypass').setLabel('🎟️ Add Passe Livre').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('dashboard_reload_main').setLabel('◀ Voltar').setStyle(ButtonStyle.Danger)
            );

            const container = new ContainerBuilder()
                .setAccentColor(0x5865F2)
                .addTextDisplayComponents(headerText)
                .addSeparatorComponents(divider)
                .addActionRowComponents(actionRow);

            try {
                if (interaction.isMessageComponent()) {
                    await interaction.update({ components: [container], flags: [MessageFlags.IsComponentsV2] });
                } else {
                    await interaction.reply({ components: [container], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
                }
            } catch (e) {
                await interaction.editReply({ components: [container], flags: [MessageFlags.IsComponentsV2] }).catch(() => {});
            }
        }

        // ==========================================
        // 🎫 TELA: CONFIGURAÇÃO DE TICKETS
        // ==========================================
        else if (selectedModule === 'tickets_setup') {
            try {
                const ticketHub = require('../../tickets/components/ticket_config_hub');
                return await ticketHub.execute(interaction, client);
            } catch (error) {
                console.error("Erro Hub Tickets:", error);
            }
        }
        
        // ==========================================
        // 🔄 TELA: MENU PRINCIPAL (ROOT)
        // ==========================================
        // AQUI ESTAVA O ERRO: Adicionamos 'dashboard_select_module' para capturar o clique do botão "Voltar"
        else if (selectedModule === 'dashboard_reload_main' || selectedModule === 'dashboard_select_module') {
            
            const headerText = new TextDisplayBuilder()
                .setContent('# 🚀 Central de Comando\nBem-vindo ao dashboard da nave. Selecione um módulo abaixo.');

            const divider = new SeparatorBuilder();

            const moduleSelect = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('dashboard_select_module')
                    .setPlaceholder('Escolha um módulo...')
                    .addOptions([
                        { label: 'Módulo: Auto-Voice', description: 'Canais dinâmicos.', value: 'autovoice_setup', emoji: '🔊' },
                        { label: 'Módulo: Tickets', description: 'Atendimento.', value: 'tickets_setup', emoji: '🎫' }
                    ])
            );

            const container = new ContainerBuilder()
                .setAccentColor(0x2b2d31)
                .addTextDisplayComponents(headerText)
                .addSeparatorComponents(divider)
                .addActionRowComponents(moduleSelect);

            if (interaction.isMessageComponent()) {
                await interaction.update({ components: [container], flags: [MessageFlags.IsComponentsV2] });
            } else {
                await interaction.reply({ components: [container], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
            }
        }
    }
};