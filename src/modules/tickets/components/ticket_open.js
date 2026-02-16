const { 
    ChannelType, 
    PermissionFlagsBits, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    MessageFlags
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_open',

    async execute(interaction, client) {
        const guildId = interaction.guild.id;
        const memberId = interaction.user.id;

        // ==========================================
        // 1. VALIDAÇÕES DE SEGURANÇA E ANTI-SPAM
        // ==========================================
        
        // Verifica se o servidor tem o setup feito
        const config = await prisma.ticketConfig.findUnique({
            where: { guildId: guildId }
        });

        if (!config || !config.ticketCategory) {
            return interaction.reply({ 
                content: '❌ O sistema de tickets ainda não foi configurado pela administração.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // Verifica se o utilizador já tem um ticket aberto
        const existingTicket = await prisma.activeTicket.findFirst({
            where: { ownerId: memberId, guildId: guildId }
        });

        if (existingTicket) {
            return interaction.reply({ 
                content: `⚠️ Já tens um ticket de atendimento aberto em <#${existingTicket.channelId}>. Por favor, conclui esse atendimento primeiro.`, 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        try {
            // ==========================================
            // 2. PREPARAÇÃO DAS PERMISSÕES (Membro + Staff)
            // ==========================================
            const permissionOverwrites = [
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel], // Esconde o canal de toda a gente
                },
                {
                    id: memberId,
                    allow: [
                        PermissionFlagsBits.ViewChannel, 
                        PermissionFlagsBits.SendMessages, 
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles // Permite enviar prints/imagens
                    ],
                }
            ];

            // Injeta as permissões para a Equipa de Staff (Puxando da Base de Dados)
            if (config.staffRoles && config.staffRoles.length > 0) {
                for (const roleId of config.staffRoles) {
                    permissionOverwrites.push({
                        id: roleId,
                        allow: [
                            PermissionFlagsBits.ViewChannel, 
                            PermissionFlagsBits.SendMessages, 
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.ManageMessages // Staff pode apagar mensagens no ticket
                        ],
                    });
                }
            }

            // ==========================================
            // 3. CRIAÇÃO DO CANAL NO DISCORD
            // ==========================================
            const ticketChannel = await interaction.guild.channels.create({
                name: `🎫・ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: config.ticketCategory,
                permissionOverwrites: permissionOverwrites,
            });

            // ==========================================
            // 4. REGISTO NA BASE DE DADOS
            // ==========================================
            await prisma.activeTicket.create({
                data: {
                    channelId: ticketChannel.id,
                    ownerId: memberId,
                    guildId: guildId
                }
            });

            // ==========================================
            // 5. O PAINEL INTERNO DO TICKET (Para fechar/gerir)
            // ==========================================
            const internalHeader = new TextDisplayBuilder()
                .setContent(`# 🎫 Atendimento Iniciado\nBem-vindo(a), <@${memberId}>. A nossa equipa foi notificada e irá atender-te em breve. Descreve o teu problema abaixo.\n\n*Apenas tu e a equipa de Staff têm acesso a este canal.*`);

            // Botões de gestão para a Staff e para o Membro
            const controlRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_close')
                    .setLabel('Fechar Ticket')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Danger), // Vermelho para chamar a atenção
                new ButtonBuilder()
                    .setCustomId('ticket_claim')
                    .setLabel('Assumir Atendimento')
                    .setEmoji('🙋‍♂️')
                    .setStyle(ButtonStyle.Secondary)
            );

            const internalContainer = new ContainerBuilder()
                .setAccentColor(0x5865F2) // Blurple
                .addComponents(internalHeader, controlRow);

            // Envia o painel para dentro do novo canal de ticket
            // Fazemos ping ao utilizador e aos cargos da staff para eles receberem notificação
            const staffPings = config.staffRoles.map(id => `<@&${id}>`).join(' ');
            await ticketChannel.send({
                content: `🔔 <@${memberId}> | ${staffPings}`,
                flags: [MessageFlags.IsComponentsV2],
                components: [internalContainer]
            });

            // ==========================================
            // 6. FEEDBACK PARA O UTILIZADOR (Ecrã efémero)
            // ==========================================
            const successText = new TextDisplayBuilder()
                .setContent(`# ✅ Ticket Criado!\nO teu canal de atendimento privado foi criado com sucesso. Clica aqui para aceder: <#${ticketChannel.id}>`);
            
            const successContainer = new ContainerBuilder()
                .setAccentColor(0x57F287) // Verde
                .addComponents(successText);

            // Responde ao clique no botão "Abrir Ticket" de forma invisível
            await interaction.reply({
                flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
                components: [successContainer]
            });

        } catch (error) {
            console.error('❌ Erro ao criar ticket:', error);
            await interaction.reply({ 
                content: '❌ Ocorreu um erro ao tentar criar o teu ticket. A equipa de administração precisa de verificar as minhas permissões de gestão de canais.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }
    }
};