const { 
    ChannelType, PermissionFlagsBits, ContainerBuilder, TextDisplayBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'ticket_open',

    async execute(interaction, client) {
        const guildId = interaction.guild.id;
        const memberId = interaction.user.id;
        
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        let deptName = 'Geral';
        if (interaction.isStringSelectMenu()) {
            const deptId = interaction.values[0].replace('dept_', '');
            const config = await prisma.ticketConfig.findUnique({
                where: { guildId: guildId },
                include: { departments: true }
            });
            const dept = config.departments.find(d => d.id === deptId);
            if (dept) deptName = dept.label;
        }

        const existing = await prisma.activeTicket.findFirst({ where: { ownerId: memberId, guildId: guildId } });
        if (existing) {
            return interaction.editReply({ content: `⚠️ Você já tem um ticket aberto: <#${existing.channelId}>` });
        }

        const config = await prisma.ticketConfig.findUnique({ where: { guildId: guildId } });
        if (!config?.ticketCategory) return interaction.editReply({ content: '❌ Sistema não configurado.' });

        try {
            const channel = await interaction.guild.channels.create({
                name: `🎫・${deptName}-${interaction.user.username}`.substring(0, 32),
                type: ChannelType.GuildText,
                parent: config.ticketCategory,
                permissionOverwrites: [
                    { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: memberId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
                    { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                ]
            });

            if (config.staffRoles) {
                config.staffRoles.forEach(r => channel.permissionOverwrites.edit(r, { ViewChannel: true, SendMessages: true }));
            }

            await prisma.activeTicket.create({
                data: { channelId: channel.id, ownerId: memberId, guildId: guildId }
            });

            // Painel Interno
            const internalPanel = new ContainerBuilder()
                .setAccentColor(0x5865F2)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${deptName}\nOlá <@${memberId}>! Descreva seu problema.`))
                .addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('ticket_close').setLabel('Fechar').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
                        new ButtonBuilder().setCustomId('ticket_claim').setLabel('Assumir').setStyle(ButtonStyle.Secondary).setEmoji('🙋‍♂️')
                    )
                );

            const staffTags = config.staffRoles.map(r => `<@&${r}>`).join(' ');
            await channel.send({ content: `${staffTags}`, components: [internalPanel], flags: [MessageFlags.IsComponentsV2] });

            // Mensagem de Sucesso (Com Botão de Link para evitar erro de Form Body)
            const success = new ContainerBuilder()
                .setAccentColor(0x57F287)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ✅ Ticket Criado\nSeu canal de atendimento foi aberto.`))
                .addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setLabel('Ir para o Ticket').setStyle(ButtonStyle.Link).setURL(`https://discord.com/channels/${guildId}/${channel.id}`)
                    )
                );

            await interaction.editReply({ components: [success] });

        } catch (err) {
            console.error('Erro ao abrir ticket:', err);
            await interaction.editReply({ content: '❌ Erro ao criar canal.' });
        }
    }
};