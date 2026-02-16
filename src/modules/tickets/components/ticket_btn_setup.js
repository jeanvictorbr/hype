const { 
    ChannelType, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    // O ID exato que colocamos lá na tela de tickets do /hype
    customId: 'ticket_btn_setup',

    async execute(interaction, client) {
        const guildId = interaction.guild.id;

        // ==========================================
        // 1. TELA DE CARREGAMENTO (Loading State)
        // ==========================================
        const loadingText = new TextDisplayBuilder()
            .setContent('# ⏳ Preparando Tickets...\nCriando infraestrutura de atendimento e sincronizando com a base de dados central. Aguarde.');
        
        const loadingContainer = new ContainerBuilder()
            .setAccentColor(0xFEE75C) // Amarelo
            .addComponents(loadingText);

        await interaction.update({ components: [loadingContainer] });

        try {
            // ==========================================
            // 2. CRIAÇÃO DA INFRAESTRUTURA NO DISCORD
            // ==========================================
            
            // Cria a categoria onde os tickets dos membros vão nascer
            const ticketCategory = await interaction.guild.channels.create({
                name: '🎫 Atendimento',
                type: ChannelType.GuildCategory,
            });

            // ==========================================
            // 3. SINCRONIZAÇÃO COM O BANCO (Prisma)
            // ==========================================
            
            // Upsert: Cria a configuração se não existir, ou atualiza se já existir
            await prisma.ticketConfig.upsert({
                where: { guildId: guildId },
                update: {
                    ticketCategory: ticketCategory.id,
                },
                create: {
                    guildId: guildId,
                    ticketCategory: ticketCategory.id,
                    staffRoles: [], // Começa sem ninguém na equipe de atendimento
                }
            });

            // ==========================================
            // 4. TELA DE SUCESSO (UX Fluida)
            // ==========================================
            const successText = new TextDisplayBuilder()
                .setContent(`# ✅ Setup de Tickets Concluído\nA categoria de atendimento (<#${ticketCategory.id}>) foi criada e vinculada ao painel.\n\n**Próximos passos recomendados:**\n1. Defina quais cargos podem responder aos tickets (Staff).\n2. Envie o painel para o chat público.`);
            
            const divider = new SeparatorBuilder();

            const backRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('dashboard_select_module') // Volta pro menu principal do /hype
                    .setLabel('◀ Voltar ao Dashboard')
                    .setStyle(ButtonStyle.Secondary)
            );

            const successContainer = new ContainerBuilder()
                .setAccentColor(0x57F287) // Verde
                .addComponents(successText, divider, backRow);

            // Substitui a tela amarela de carregamento pela tela verde de sucesso
            await interaction.editReply({ components: [successContainer] });

        } catch (error) {
            console.error('❌ Erro no Setup de Tickets:', error);
            
            const errorText = new TextDisplayBuilder()
                .setContent('# ❌ Falha no Setup\nOcorreu um erro ao criar a categoria de atendimento. Verifique as permissões do bot.');
            
            const errorContainer = new ContainerBuilder()
                .setAccentColor(0xED4245) // Vermelho
                .addComponents(errorText);

            await interaction.editReply({ components: [errorContainer] });
        }
    }
};