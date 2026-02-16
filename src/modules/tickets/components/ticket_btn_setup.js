const { 
    ChannelType, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_btn_setup',

    async execute(interaction, client) {
        const guildId = interaction.guild.id;

        // TELA DE CARREGAMENTO
        const loadingContainer = new ContainerBuilder()
            .setAccentColor(0xFEE75C)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent('# ⏳ Preparando Tickets...\nAguarde...')); // ✅ CORRIGIDO

        await interaction.update({ components: [loadingContainer] });

        try {
            // Cria Categoria
            const ticketCategory = await interaction.guild.channels.create({
                name: '🎫 Atendimento',
                type: ChannelType.GuildCategory,
            });

            // Salva no Banco
            await prisma.ticketConfig.upsert({
                where: { guildId: guildId },
                update: { ticketCategory: ticketCategory.id },
                create: { guildId: guildId, ticketCategory: ticketCategory.id, staffRoles: [] }
            });

            // TELA DE SUCESSO V2
            const successText = new TextDisplayBuilder()
                .setContent(`# ✅ Setup Concluído\nCategoria criada: <#${ticketCategory.id}>.`);
            
            const backRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('dashboard_select_module').setLabel('◀ Voltar').setStyle(ButtonStyle.Secondary)
            );

            const successContainer = new ContainerBuilder()
                .setAccentColor(0x57F287)
                .addTextDisplayComponents(successText) // ✅ CORRIGIDO
                .addSeparatorComponents(new SeparatorBuilder()) // ✅ CORRIGIDO
                .addActionRowComponents(backRow); // ✅ CORRIGIDO

            await interaction.editReply({ components: [successContainer] });

        } catch (error) {
            console.error(error);
            // Tratamento de erro simples V2
            const errContainer = new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(new TextDisplayBuilder().setContent('❌ Erro no Setup.'));
            await interaction.editReply({ components: [errContainer] });
        }
    }
};