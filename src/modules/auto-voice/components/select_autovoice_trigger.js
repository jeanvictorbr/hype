const { ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'select_autovoice_trigger',

    async execute(interaction, client) {
        const selectedChannelId = interaction.values[0];
        const guildId = interaction.guild.id;

        try {
            // Atualiza Config
            await prisma.autoVoiceConfig.upsert({
                where: { guildId: guildId },
                update: { triggerChannel: selectedChannelId },
                create: { guildId: guildId, triggerChannel: selectedChannelId, tempCategory: null, bypassRoles: [] }
            });

            // Feedback Visual
            const successText = new TextDisplayBuilder()
                .setContent(`# ✅ Gatilho Definido!\nO canal <#${selectedChannelId}> está configurado.\n\nAgora, quando alguém entrar nele, uma sala temporária será criada.`);
            
            const backButtonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('dashboard_select_module')
                    .setLabel('◀ Voltar ao Dashboard')
                    .setStyle(ButtonStyle.Secondary)
            );

            const container = new ContainerBuilder()
                .setAccentColor(0x57F287) // Verde
                .addTextDisplayComponents(successText)
                .addActionRowComponents(backButtonRow);

            await interaction.update({ components: [container], flags: [MessageFlags.IsComponentsV2] });

        } catch (error) {
            console.error('Erro ao salvar gatilho:', error);
            const errText = new TextDisplayBuilder().setContent('❌ Erro ao salvar no banco de dados.');
            const errContainer = new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(errText);
            await interaction.update({ components: [errContainer] });
        }
    }
};