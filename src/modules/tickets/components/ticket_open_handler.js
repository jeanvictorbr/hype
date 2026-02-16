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
        
        // 1. Inicia processamento (Efémero)
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            let deptName = 'Geral';
            
            // 2. Identifica Departamento (se houver)
            if (interaction.isStringSelectMenu()) {
                const deptId = interaction.values[0].replace('dept_', '');
                const config = await prisma.ticketConfig.findUnique({
                    where: { guildId: guildId },
                    include: { departments: true }
                });
                const dept = config?.departments.find(d => d.id === deptId);
                if (dept) deptName = dept.label;
            }

            // 3. Validação Anti-Spam
            const existing = await prisma.activeTicket.findFirst({ where: { ownerId: memberId, guildId: guildId } });
            if (existing) {
                const channelExists = interaction.guild.channels.cache.get(existing.channelId);
                const link = channelExists ? `<#${existing.channelId}>` : 'um canal (contate a staff)';
                return interaction.editReply({ content: `⚠️ Você já possui um atendimento aberto em ${link}.` });
            }

            const config = await prisma.ticketConfig.findUnique({ where: { guildId: guildId } });
            if (!config?.ticketCategory) return interaction.editReply({ content: '❌ Sistema em manutenção.' });

            // 4. Cria o Canal
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

            // 5. Permissões da Staff
            if (config.staffRoles && config.staffRoles.length > 0) {
                for (const roleId of config.staffRoles) {
                    await channel.permissionOverwrites.edit(roleId, { ViewChannel: true, SendMessages: true }).catch(() => {});
                }
            }

            await prisma.activeTicket.create({
                data: { channelId: channel.id, ownerId: memberId, guildId: guildId }
            });

            // 6. Painel Interno (Dentro do Ticket)
            const internalPanel = new ContainerBuilder()
                .setAccentColor(0x5865F2)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${deptName}\nOlá <@${memberId}>! Descreva seu problema.`))
                .addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('ticket_close').setLabel('Fechar').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
                        new ButtonBuilder().setCustomId('ticket_claim').setLabel('Assumir').setStyle(ButtonStyle.Success).setEmoji('🙋‍♂️'),
                        new ButtonBuilder().setCustomId('ticket_users_menu').setLabel('Membros').setStyle(ButtonStyle.Secondary).setEmoji('👥')
                    )
                );

            const staffTags = config.staffRoles.map(r => `<@&${r}>`).join(' ');
            await channel.send({ content: `${staffTags}`, components: [internalPanel], flags: [MessageFlags.IsComponentsV2] });

            // 7. Resposta de Sucesso (FIX PARA INVALID FORM BODY)
            // Apagamos a mensagem de "Aguarde..." e enviamos uma nova limpa com a flag V2
            await interaction.deleteReply().catch(() => {});

            const successContainer = new ContainerBuilder()
                .setAccentColor(0x57F287)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ✅ Ticket Criado\nSeu canal foi aberto: <#${channel.id}>`))
                .addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setLabel('Ir para o Ticket').setStyle(ButtonStyle.Link).setURL(`https://discord.com/channels/${guildId}/${channel.id}`)
                    )
                );

            await interaction.followUp({ 
                components: [successContainer], 
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] 
            });

        } catch (err) {
            console.error('Erro Ticket:', err);
            // Tenta responder se ainda der
            try { await interaction.editReply({ content: '❌ Erro ao criar ticket.' }); } catch {}
        }
    }
};