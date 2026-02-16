const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    MessageFlags 
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
        // Nota: 'dashboard_btn_back' redireciona para cá também
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

            // CORREÇÃO: Sempre usamos update aqui para substituir o painel anterior
            // O try/catch evita erro se a interação já tiver sido respondida por algum motivo estranho
            try {
                await interaction.update({ 
                    components: [autovoiceContainer], 
                    flags: [MessageFlags.IsComponentsV2] 
                });
            } catch (error) {
                // Fallback caso o update falhe (ex: tempo expirado)
                await interaction.editReply({ 
                    components: [autovoiceContainer], 
                    flags: [MessageFlags.IsComponentsV2] 
                });
            }
        }

        // ==========================================
        // 🎫 TELA: CONFIGURAÇÃO DE TICKETS (💎 VIP)
        // ==========================================
        else if (selectedModule === 'tickets_setup') {
            
            // 1. Redirecionamento para o NOVO HUB DE TICKETS
            // Isso evita código duplicado e usa o painel novo e completo que criamos
            try {
                const ticketHub = require('../../tickets/components/ticket_config_hub');
                return await ticketHub.execute(interaction, client);
            } catch (error) {
                console.error("Erro ao carregar o Hub de Tickets:", error);
                // Fallback caso o arquivo ainda não exista ou dê erro no require
            }

            // --- LÓGICA ANTIGA (FALLBACK) ---
            const guildData = await prisma.guild.findUnique({
                where: { id: guildId }
            });

            const features = guildData?.features || [];
            const hasAccess = features.includes('tickets') || features.includes('all');

            if (!hasAccess) {
                const lockedText = new TextDisplayBuilder()
                    .setContent('# 🔒 Módulo Premium\nO sistema avançado de **Tickets** é uma funcionalidade exclusiva.');
                
                const lockedContainer = new ContainerBuilder()
                    .setAccentColor(0xFEE75C) 
                    .addTextDisplayComponents(lockedText);

                return await interaction.update({ components: [lockedContainer] });
            }

            // Tela simples caso o Hub falhe
            const ticketText = new TextDisplayBuilder().setContent('# 🎫 Módulo: Tickets\nCarregando painel...');
            const ticketContainer = new ContainerBuilder()
                .setAccentColor(0x57F287) 
                .addTextDisplayComponents(ticketText);

            await interaction.update({ components: [ticketContainer] });
        }
        
        // ==========================================
        // 🔄 RELOAD: VOLTAR AO MENU PRINCIPAL (/hype)
        // ==========================================
        else if (selectedModule === 'dashboard_reload_main') {
            // Recria o menu inicial do comando /hype
            const { StringSelectMenuBuilder } = require('discord.js'); // Import local

            const headerText = new TextDisplayBuilder()
                .setContent('# 🚀 Central de Comando\nBem-vindo ao dashboard da nave.');

            const moduleSelect = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('dashboard_select_module')
                    .setPlaceholder('Escolha um módulo para configurar...')
                    .addOptions([
                        { label: 'Módulo: Auto-Voice', description: 'Canais dinâmicos.', value: 'autovoice_setup', emoji: '🔊' },
                        { label: 'Módulo: Tickets', description: 'Atendimento.', value: 'tickets_setup', emoji: '🎫' }
                    ])
            );

            const mainContainer = new ContainerBuilder()
                .setAccentColor(0x2b2d31)
                .addTextDisplayComponents(headerText)
                .addSeparatorComponents(new SeparatorBuilder())
                .addActionRowComponents(moduleSelect);

            await interaction.update({ components: [mainContainer] });
        }
    }
};