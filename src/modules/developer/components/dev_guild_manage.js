const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'dev_guild_manage',

    async execute(interaction, client) {
        // 👇 Inteligência Dupla: Lê o ID tanto do Menu de Seleção quanto do botão de "Voltar"
        let guildId;
        if (interaction.isStringSelectMenu()) {
            guildId = interaction.values[0];
        } else {
            guildId = interaction.customId.split('_').pop();
        }

        if (!guildId || guildId === 'none') return interaction.reply({ content: '❌ Seleção inválida.', flags: [MessageFlags.Ephemeral] });
        
        const discordGuild = client.guilds.cache.get(guildId);
        let dbGuild = await prisma.guild.findUnique({ where: { id: guildId } });
        if (!dbGuild) dbGuild = await prisma.guild.create({ data: { id: guildId } });

        // Cálculo de Licença SaaS
        let statusText = "🌑 Plano Gratuito";
        let daysRemaining = 0;
        let expireDateString = "Indefinido";
        let color = 0x2b2d31; 

        if (dbGuild.vipExpiresAt) {
            const now = new Date();
            const expiration = new Date(dbGuild.vipExpiresAt);
            const diffTime = expiration - now;
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (daysRemaining > 0) {
                statusText = `💎 Premium Ativo`;
                expireDateString = expiration.toLocaleDateString('pt-BR');
                color = 0xFEE75C;
            } else {
                statusText = `⚠️ Premium Expirado`;
                color = 0xED4245;
            }
        }

        const featuresList = dbGuild.features.length > 0 ? dbGuild.features.join(', ') : 'Nenhuma';

        // ==========================================
        // 🎨 PÁGINA 1: GESTÃO DO SERVIDOR E MÓDULOS
        // ==========================================
        const header = new TextDisplayBuilder()
            .setContent(`# 🎛️ Gerenciando Servidor (Pág 1/2)\nNome: **${discordGuild ? discordGuild.name : 'Desconhecido'}**\nID: \`${guildId}\``);

        const stats = new TextDisplayBuilder()
            .setContent(`**Status:** ${statusText}\n**Vencimento:** ${expireDateString} (${daysRemaining} dias)\n**Módulos Ativos:** \`[${featuresList}]\``);

        // Botões de Licença SaaS do Servidor
        const rowTime = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`dev_vip_add_7_${guildId}`).setLabel('+7 Dias').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`dev_vip_add_30_${guildId}`).setLabel('+30 Dias').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`dev_vip_set_lifetime_${guildId}`).setLabel('👑 Lifetime').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`dev_vip_remove_${guildId}`).setLabel('🛑 Remover VIP (Servidor)').setStyle(ButtonStyle.Danger)
        );

        // Botões de Ativação de Sistemas
        const rowFeatures = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`dev_feat_toggle_tickets_${guildId}`).setLabel('Tickets (Toggle)').setStyle(ButtonStyle.Secondary).setEmoji('🎫'),
            new ButtonBuilder().setCustomId(`dev_feat_toggle_autovoice_${guildId}`).setLabel('Voice (Toggle)').setStyle(ButtonStyle.Secondary).setEmoji('🔊'),
            new ButtonBuilder().setCustomId(`dev_feat_toggle_cassino_${guildId}`).setLabel('Cassino (Toggle)').setStyle(ButtonStyle.Secondary).setEmoji('🎰')
        );

        // 👇 NAVEGAÇÃO PARA A ABA DE ECONOMIA
        const rowNav = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`dev_eco_manage_${guildId}`)
                .setLabel('Ir para Gestão de Economia, Loja e Jogadores VIP ➡️')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('💰')
        );

        const container = new ContainerBuilder()
            .setAccentColor(color)
            .addTextDisplayComponents(header)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(stats)
            .addSeparatorComponents(new SeparatorBuilder())
            .addActionRowComponents(rowTime)
            .addActionRowComponents(rowFeatures)
            .addSeparatorComponents(new SeparatorBuilder())
            .addActionRowComponents(rowNav); 

        await interaction.update({
            components: [container],
            flags: [MessageFlags.IsComponentsV2]
        });
    }
};