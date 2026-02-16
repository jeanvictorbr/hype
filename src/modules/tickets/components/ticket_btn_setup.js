const { 
    ChannelType, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, 
    ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_btn_setup',

    async execute(interaction, client) {
        const guildId = interaction.guild.id;

        // Feedback de Carregamento
        const loadingContainer = new ContainerBuilder()
            .setAccentColor(0xFEE75C)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent('# ⏳ Construindo Sistema...\nCriando categoria, canal de logs privado e definindo permissões.'));

        await interaction.update({ components: [loadingContainer] });

        try {
            // 1. Cria Categoria "Atendimento"
            const ticketCategory = await interaction.guild.channels.create({
                name: '🎫 Atendimento',
                type: ChannelType.GuildCategory,
            });

            // 2. Cria Canal de Logs Privado
            const logChannel = await interaction.guild.channels.create({
                name: '📄-logs-tickets',
                type: ChannelType.GuildText,
                parent: ticketCategory.id, // Coloca dentro da categoria pra ficar organizado
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel], // Ninguém vê
                    },
                    {
                        id: client.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages], // Bot vê
                    }
                    // Staff será adicionada depois se configurada
                ]
            });

            // 3. Salva Tudo no Banco
            await prisma.ticketConfig.upsert({
                where: { guildId: guildId },
                update: {
                    ticketCategory: ticketCategory.id,
                    logChannel: logChannel.id
                },
                create: {
                    guildId: guildId,
                    ticketCategory: ticketCategory.id,
                    logChannel: logChannel.id,
                    staffRoles: []
                }
            });

            // 4. Sucesso -> Recarrega o HUB
            const ticketHub = require('./ticket_config_hub');
            
            // Hack para "simular" um reload chamando o execute do hub
            // Mas primeiro mostramos uma msg rápida
            await ticketHub.execute(interaction, client);
            
            await interaction.followUp({ 
                content: `✅ **Setup Completo!**\nCategoria: <#${ticketCategory.id}>\nLogs: <#${logChannel.id}>`, 
                flags: [MessageFlags.Ephemeral] 
            });

        } catch (error) {
            console.error('Erro Setup:', error);
            const err = new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(new TextDisplayBuilder().setContent('❌ Erro crítico ao criar canais. Verifique minhas permissões de Admin.'));
            await interaction.editReply({ components: [err] });
        }
    }
};