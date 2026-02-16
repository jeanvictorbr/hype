const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'select_ticket_logs',

    async execute(interaction, client) {
        const selectedChannelId = interaction.values[0]; // Apanha o ID do canal escolhido

        try {
            await prisma.ticketConfig.upsert({
                where: { guildId: interaction.guild.id },
                update: { logChannel: selectedChannelId },
                create: { guildId: interaction.guild.id, logChannel: selectedChannelId }
            });

            const successText = new TextDisplayBuilder()
                .setContent(`# ✅ Canal de Logs Definido\nAs transcrições dos tickets encerrados serão enviadas para <#${selectedChannelId}>.`);
            
            const backButtonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('dashboard_select_module').setLabel('◀ Voltar').setStyle(ButtonStyle.Secondary)
            );

            const successContainer = new ContainerBuilder()
                .setAccentColor(0x57F287)
                .addComponents(successText, backButtonRow);

            await interaction.update({ components: [successContainer] });

        } catch (error) {
            console.error('❌ Erro ao guardar canal de logs:', error);
        }
    }
};