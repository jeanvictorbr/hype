const { 
    ChannelType, PermissionFlagsBits, ContainerBuilder, TextDisplayBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    // Vamos lidar com os dois tipos de entrada aqui
    customIdPrefix: 'ticket_open', // Pega 'ticket_open_general' e 'ticket_open_select'

    async execute(interaction, client) {
        const guildId = interaction.guild.id;
        const memberId = interaction.user.id;
        
        // RESET IMEDIATO DO SELECT MENU (Para não travar a UI)
        if (interaction.isStringSelectMenu()) {
            // Gambiarra visual: atualiza a msg removendo o foco, mas mantendo o menu
            // Na prática V2, o deferUpdate ajuda
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        } else {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        }

        // 1. Identificar Departamento
        let deptId = null;
        let deptName = 'Geral';
        
        if (interaction.isStringSelectMenu()) {
            const selected = interaction.values[0]; // ex: 'dept_uuid-1234'
            deptId = selected.replace('dept_', '');
        }

        // 2. Validar Config e Departamento
        const config = await prisma.ticketConfig.findUnique({
            where: { guildId: guildId },
            include: { departments: true }
        });

        let departmentData = null;
        if (deptId) {
            departmentData = config.departments.find(d => d.id === deptId);
            if (departmentData) deptName = departmentData.label;
        }

        // 3. Validação Anti-Spam (Ticket já aberto)
        const existingTicket = await prisma.activeTicket.findFirst({
            where: { ownerId: memberId, guildId: guildId }
        });

        if (existingTicket) {
            return interaction.editReply({ 
                content: `⚠️ Você já possui um ticket aberto: <#${existingTicket.channelId}>.` 
            });
        }

        try {
            // 4. Permissões
            const permissionOverwrites = [
                { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: memberId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] }
            ];

            // Adiciona Staff Global
            if (config.staffRoles) {
                config.staffRoles.forEach(roleId => {
                    permissionOverwrites.push({
                        id: roleId,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages]
                    });
                });
            }

            // 5. Criação do Canal
            const channelName = `${departmentData?.emoji || '🎫'}・${deptName.toLowerCase()}-${interaction.user.username}`.substring(0, 32); // Limite Discord

            const ticketChannel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: config.ticketCategory,
                permissionOverwrites: permissionOverwrites,
                topic: `Ticket de ${interaction.user.tag} | Departamento: ${deptName}`
            });

            // 6. DB Registro
            await prisma.activeTicket.create({
                data: {
                    channelId: ticketChannel.id,
                    ownerId: memberId,
                    guildId: guildId
                }
            });

            // 7. Painel Interno V2
            const controlPanel = new ContainerBuilder()
                .setAccentColor(0x5865F2)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`# ${deptName}\nOlá <@${memberId}>. Suporte iniciado.\naguarde um atendente.`)
                )
                .addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('ticket_close').setLabel('Encerrar').setEmoji('🔒').setStyle(ButtonStyle.Danger),
                        new ButtonBuilder().setCustomId('ticket_claim').setLabel('Assumir').setEmoji('🙋‍♂️').setStyle(ButtonStyle.Secondary)
                    )
                );

            // Menção da Staff
            const staffPing = config.staffRoles.map(r => `<@&${r}>`).join(' ');
            await ticketChannel.send({ 
                content: `${staffPing} | Novo chamado de <@${memberId}>`,
                components: [controlPanel],
                flags: [MessageFlags.IsComponentsV2]
            });

            // 8. Feedback Final
            const successContainer = new ContainerBuilder()
                .setAccentColor(0x57F287)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ✅ Ticket Criado\nAcesse seu canal: <#${ticketChannel.id}>`));

            await interaction.editReply({ components: [successContainer] });

        } catch (error) {
            console.error('Erro ao abrir ticket:', error);
            await interaction.editReply({ content: '❌ Erro ao criar sala. Verifique as permissões do bot.' });
        }
    }
};