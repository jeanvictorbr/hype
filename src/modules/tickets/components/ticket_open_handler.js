const { 
    ChannelType, PermissionFlagsBits, ContainerBuilder, TextDisplayBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'ticket_open', // Captura ticket_open_general E ticket_open_select

    async execute(interaction, client) {
        const guildId = interaction.guild.id;
        const memberId = interaction.user.id;
        
        // Evita erro visual no select menu
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        let deptName = 'Geral';
        
        if (interaction.isStringSelectMenu()) {
            const deptId = interaction.values[0].replace('dept_', '');
            const config = await prisma.ticketConfig.findUnique({
                where: { guildId: guildId },
                include: { departments: true }
            });
            const dept = config?.departments.find(d => d.id === deptId);
            if (dept) deptName = dept.label;
        }

        // Validação
        const existing = await prisma.activeTicket.findFirst({ where: { ownerId: memberId, guildId: guildId } });
        if (existing) {
            return interaction.editReply({ content: `⚠️ Você já tem um ticket aberto: <#${existing.channelId}>` });
        }

        const config = await prisma.ticketConfig.findUnique({ where: { guildId: guildId } });
        if (!config?.ticketCategory) return interaction.editReply({ content: '❌ Sistema em manutenção (Categoria não definida).' });

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

            // Adiciona Staff
            if (config.staffRoles) {
                config.staffRoles.forEach(r => channel.permissionOverwrites.edit(r, { ViewChannel: true, SendMessages: true }).catch(() => {}));
            }

            await prisma.activeTicket.create({
                data: { channelId: channel.id, ownerId: memberId, guildId: guildId }
            });

            // Painel Interno
            const internalPanel = new ContainerBuilder()
                .setAccentColor(0x5865F2)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${deptName}\nOlá <@${memberId}>! Descreva seu problema abaixo.`))
                .addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('ticket_close').setLabel('Fechar').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
                        new ButtonBuilder().setCustomId('ticket_claim').setLabel('Assumir').setStyle(ButtonStyle.Secondary).setEmoji('🙋‍♂️')
                    )
                );

            const staffTags = config.staffRoles.map(r => `<@&${r}>`).join(' ');
            await channel.send({ content: `${staffTags}`, components: [internalPanel], flags: [MessageFlags.IsComponentsV2] });

            // Mensagem de Sucesso (Com Botão de Link)
            const success = new ContainerBuilder()
                .setAccentColor(0x57F287)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ✅ Ticket Criado\nSeu canal de atendimento foi aberto: <#${channel.id}>`))
                .addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setLabel('Ir para o Ticket').setStyle(ButtonStyle.Link).setURL(`https://discord.com/channels/${guildId}/${channel.id}`)
                    )
                );

            // 🚨 CORREÇÃO CRÍTICA: Adicionada a flag V2 aqui para evitar o erro "Invalid Form Body"
            await interaction.editReply({ 
                components: [success], 
                flags: [MessageFlags.IsComponentsV2] 
            });

        } catch (err) {
            console.error('Erro ao abrir ticket:', err);
            await interaction.editReply({ content: '❌ Erro ao criar canal. Verifique permissões.' });
        }
    }
};