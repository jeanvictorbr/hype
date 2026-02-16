const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'dashboard_select_module',

    async execute(interaction, client) {
        const selectedModule = interaction.values ? interaction.values[0] : interaction.customId;
        const guildId = interaction.guild.id;

        // ==========================================
        // 🔊 TELA: CONFIGURAÇÃO DO AUTO-VOICE (Livre)
        // ==========================================
        if (selectedModule === 'autovoice_setup' || selectedModule === 'dashboard_select_module') {
            
            const headerText = new TextDisplayBuilder()
                .setContent('# 🔊 Módulo: Auto-Voice\nGerencie as salas dinâmicas do servidor. Use o **Setup Rápido** para criar as categorias automaticamente ou configure passo a passo.');

            const divider = new SeparatorBuilder();

            const actionRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('autovoice_btn_setup').setLabel('✨ Setup Rápido').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('autovoice_btn_trigger').setLabel('📍 Definir Gatilho').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('autovoice_btn_bypass').setLabel('🎟️ Add Passe Livre').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('dashboard_btn_back').setLabel('◀ Voltar').setStyle(ButtonStyle.Danger)
            );

            // 🛠️ CORREÇÃO DA V2: Usando os métodos corretos para separar cada tipo de item
            const autovoiceContainer = new ContainerBuilder()
                .setAccentColor(0x5865F2)
                .addTextDisplayComponents(headerText)
                .addSeparatorComponents(divider)
                .addActionRowComponents(actionRow);

            if (interaction.isStringSelectMenu()) {
                await interaction.update({ components: [autovoiceContainer] });
            } else {
                // Se veio de um botão de "Voltar"
                await interaction.editReply({ components: [autovoiceContainer] });
            }
        }

        // ==========================================
        // 🎫 TELA: CONFIGURAÇÃO DE TICKETS (💎 VIP)
        // ==========================================
        else if (selectedModule === 'tickets_setup') {
            
            // 1. Consulta o Banco de Dados para ver as Features
            const guildData = await prisma.guild.findUnique({
                where: { id: guildId }
            });

            const features = guildData?.features || [];
            
            // 2. 🛡️ VERIFICAÇÃO VIP (Feature Flag)
            const hasAccess = features.includes('tickets') || features.includes('all');

            if (!hasAccess) {
                // 🛑 TELA DE BLOQUEIO (Paywall App V2)
                const lockedText = new TextDisplayBuilder()
                    .setContent('# 🔒 Módulo Premium\nO sistema avançado de **Tickets** é uma funcionalidade exclusiva. Para liberar este módulo para o seu servidor, entre em contato com o desenvolvedor.');
                
                // 🛠️ CORREÇÃO DA V2
                const lockedContainer = new ContainerBuilder()
                    .setAccentColor(0xFEE75C) 
                    .addTextDisplayComponents(lockedText);

                return interaction.update({ components: [lockedContainer] });
            }

            // ==========================================
            // ✅ TELA DE SETUP (Se ele tiver a feature liberada)
            // ==========================================
            const ticketText = new TextDisplayBuilder()
                .setContent('# 🎫 Módulo: Tickets\nConfigure o sistema de atendimento. O seu módulo está **ATIVO e LIBERADO**.\n\nUse os botões para definir a categoria onde os tickets serão abertos e os cargos que poderão respondê-los.');
            
            const divider = new SeparatorBuilder();

            const ticketControls = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_btn_setup')
                    .setLabel('✨ Setup Rápido (Tickets)')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('ticket_btn_staff')
                    .setLabel('👮 Definir Staff')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('ticket_btn_panel')
                    .setLabel('📩 Enviar Painel no Chat') 
                    .setStyle(ButtonStyle.Secondary)
            );

            // 🛠️ CORREÇÃO DA V2
            const ticketContainer = new ContainerBuilder()
                .setAccentColor(0x57F287) 
                .addTextDisplayComponents(ticketText)
                .addSeparatorComponents(divider)
                .addActionRowComponents(ticketControls);

            await interaction.update({ components: [ticketContainer] });
        }
    }
};