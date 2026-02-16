const { 
    ChannelType, PermissionFlagsBits, ContainerBuilder, TextDisplayBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    // IMPORTANTE: Este ID garante que o loader carregue o ficheiro
    customId: 'ticket_create_handler', 
    // IMPORTANTE: Este prefixo captura 'ticket_create_btn' E 'ticket_create_select'
    customIdPrefix: 'ticket_create_',

    async execute(interaction, client) {
        const guildId = interaction.guild.id;
        const memberId = interaction.user.id;
        
        // 1. Feedback inicial imediato (para não dar erro de interação falhou)
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            let deptName = 'Geral';
            
            // 2. Verifica se veio de um Menu de Departamentos
            if (interaction.isStringSelectMenu()) {
                const deptId = interaction.values[0].replace('dept_', '');
                
                const config = await prisma.ticketConfig.findUnique({
                    where: { guildId: guildId },
                    include: { departments: true }
                });

                if (config && config.departments) {
                    const dept = config.departments.find(d => d.id === deptId);
                    if (dept) deptName = dept.label;
                }
            }

            // 3. Verifica se já tem ticket aberto (Anti-Spam)
            const existing = await prisma.activeTicket.findFirst({ 
                where: { ownerId: memberId, guildId: guildId } 
            });
            
            if (existing) {
                const channelExists = interaction.guild.channels.cache.get(existing.channelId);
                const link = channelExists ? `<#${existing.channelId}>` : 'um canal fechado';
                
                // Usa editReply pois já deferimos
                return interaction.editReply({ 
                    content: `⚠️ Você já possui um atendimento em andamento em ${link}.` 
                });
            }

            // 4. Busca Configurações
            const config = await prisma.ticketConfig.findUnique({ where: { guildId: guildId } });
            
            if (!config || !config.ticketCategory) {
                return interaction.editReply({ content: '❌ Categoria de tickets não configurada.' });
            }

            // 5. Cria o Canal
            const channel = await interaction.guild.channels.create({
                name: `🎫・${deptName}-${interaction.user.username}`.substring(0, 32),
                type: ChannelType.GuildText,
                parent: config.ticketCategory,
                permissionOverwrites: [
                    { 
                        id: interaction.guild.roles.everyone.id, 
                        deny: [PermissionFlagsBits.ViewChannel] 
                    },
                    { 
                        id: memberId, 
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] 
                    },
                    { 
                        id: client.user.id, 
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] 
                    }
                ]
            });

            // 6. Adiciona a Staff
            if (config.staffRoles && config.staffRoles.length > 0) {
                for (const roleId of config.staffRoles) {
                    await channel.permissionOverwrites.edit(roleId, { 
                        ViewChannel: true, 
                        SendMessages: true 
                    }).catch(() => {});
                }
            }

            // 7. Salva no Banco
            await prisma.activeTicket.create({
                data: { channelId: channel.id, ownerId: memberId, guildId: guildId }
            });

            // 8. Envia Painel Interno (App V2 Estrito)
            const internalPanel = new ContainerBuilder()
                .setAccentColor(0x5865F2)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`# ${deptName}\nOlá <@${memberId}>! Descreva seu problema abaixo.\n\n*Aguarde um membro da equipe.*`)
                )
                .addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('ticket_close').setLabel('Fechar').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
                        new ButtonBuilder().setCustomId('ticket_claim').setLabel('Assumir').setStyle(ButtonStyle.Success).setEmoji('🙋‍♂️'),
                        new ButtonBuilder().setCustomId('ticket_users_menu').setLabel('Membros').setStyle(ButtonStyle.Secondary).setEmoji('👥')
                    )
                );

            const staffTags = config.staffRoles.map(r => `<@&${r}>`).join(' ');
            await channel.send({ 
                content: `${staffTags} | Novo chamado de <@${memberId}>`, 
                components: [internalPanel], 
                flags: [MessageFlags.IsComponentsV2] 
            });

            // 9. Resposta de Sucesso ao Usuário (Link)
            // Truque: Deletamos o "Aguarde..." e mandamos um novo limpo para evitar conflito de Form Body
            await interaction.deleteReply().catch(() => {});

            const successContainer = new ContainerBuilder()
                .setAccentColor(0x57F287) // Verde
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(`# ✅ Ticket Criado\nSeu canal de atendimento foi aberto: <#${channel.id}>`)
                )
                .addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel('Ir para o Ticket')
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://discord.com/channels/${guildId}/${channel.id}`)
                    )
                );

            await interaction.followUp({ 
                components: [successContainer], 
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] 
            });

        } catch (err) {
            console.error('❌ Erro crítico ao abrir ticket:', err);
            try {
                await interaction.editReply({ content: '❌ Erro ao criar ticket. Verifique permissões ou contate o admin.' });
            } catch {}
        }
    }
};