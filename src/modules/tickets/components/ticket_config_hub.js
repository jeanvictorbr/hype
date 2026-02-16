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

        if (!config) {
            config = await prisma.ticketConfig.create({
                data: { guildId: guildId, staffRoles: [] }
            });
        }

        // 2. Estatísticas Rápidas
        const activeCount = await prisma.activeTicket.count({ where: { guildId: guildId } });

        // 3. UI V2
        const header = new TextDisplayBuilder()
            .setContent('# 🎫 Central de Tickets\nGerencie o design, a infraestrutura e a equipe de atendimento.');

        const stats = new TextDisplayBuilder()
            .setContent(`**📊 Status Atual:**\n📂 **Categoria:** <#${config.ticketCategory || '0'}>\n📜 **Logs:** <#${config.logChannel || '0'}>\n🟢 **Tickets Abertos:** ${activeCount}`);

        // LINHA 1: Ações Principais (Adicionado botão de Gerir Ativos)
        const rowMain = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_btn_setup').setLabel('Setup Auto').setStyle(ButtonStyle.Success).setEmoji('🪄'),
            new ButtonBuilder().setCustomId('ticket_btn_panel').setLabel('Enviar Painel').setStyle(ButtonStyle.Primary).setEmoji('📨'),
            new ButtonBuilder().setCustomId('ticket_active_manager').setLabel('Gerir Abertos').setStyle(ButtonStyle.Danger).setEmoji('🚨') // 👈 NOVO BOTAO
        );

        // LINHA 2: Config Manual
        const rowCat = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder().setCustomId('ticket_manual_cat').setPlaceholder('🔧 Definir Categoria...').addChannelTypes(ChannelType.GuildCategory)
        );

        // LINHA 3: Staff
        const rowStaff = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder().setCustomId('select_ticket_staff').setPlaceholder('👮 Definir Staff...').setMinValues(1).setMaxValues(10)
        );

        const container = new ContainerBuilder()
            .setAccentColor(0x2C2F33)
            .addTextDisplayComponents(header)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(stats)
            .addSeparatorComponents(new SeparatorBuilder())
            .addActionRowComponents(rowMain)
            .addActionRowComponents(rowCat)
            .addActionRowComponents(rowStaff);

        // Tratamento de Resposta
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ components: [container], flags: [MessageFlags.IsComponentsV2] });
        } else if (interaction.isMessageComponent()) {
            await interaction.update({ components: [container], flags: [MessageFlags.IsComponentsV2] });
        } else {
            await interaction.reply({ components: [container], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
        }
    }
};