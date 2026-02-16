const { 
    ChannelType, ContainerBuilder, TextDisplayBuilder, PermissionFlagsBits, MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'ticket_btn_setup',

    async execute(interaction, client) {
        const guildId = interaction.guild.id;

        // Feedback de Carregamento
        const loadingContainer = new ContainerBuilder()
            .setAccentColor(0xFEE75C)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent('# ⏳ Construindo Sistema...\nCriando categoria, logs privados e configurando banco de dados.'));

        await interaction.update({ components: [loadingContainer] });

        try {
            // 1. Cria Categoria "Atendimento"
            const ticketCategory = await interaction.guild.channels.create({
                name: '🎫 Atendimento',
                type: ChannelType.GuildCategory,
            });

            // 2. Cria Canal de Logs (Privado para o Bot e Admins)
            const logChannel = await interaction.guild.channels.create({
                name: '📄-logs-tickets',
                type: ChannelType.GuildText,
                parent: ticketCategory.id, 
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel], // Oculto para todos
                    },
                    {
                        id: client.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles],
                    }
                ]
            });

            // 3. Salva no Banco (Upsert garante que não duplica configs)
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

            // 4. Recarrega o HUB para mostrar os novos IDs
            const ticketHub = require('./ticket_config_hub');
            await ticketHub.execute(interaction, client);
            
            // 5. Confirmação Final
            await interaction.followUp({ 
                content: `✅ **Infraestrutura Criada!**\n📂 Categoria: <#${ticketCategory.id}>\n📜 Logs: <#${logChannel.id}>`, 
                flags: [MessageFlags.Ephemeral] 
            });

        } catch (error) {
            console.error('Setup Error:', error);
            const err = new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent('❌ **Erro Crítico:** Verifique se o Bot tem permissão de "Administrador" ou "Gerenciar Canais".'));
            await interaction.editReply({ components: [err] });
        }
    }
};