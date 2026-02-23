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
        const guildId = interaction.values ? interaction.values[0] : null;
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
        // 🎨 UI DO PAINEL DE GESTÃO (V2)
        // ==========================================
        const header = new TextDisplayBuilder()
            .setContent(`# 🎛️ Gerenciando: ${discordGuild ? discordGuild.name : 'Desconhecido'}\nID: \`${guildId}\``);

        const stats = new TextDisplayBuilder()
            .setContent(`**Status:** ${statusText}\n**Vencimento:** ${expireDateString} (${daysRemaining} dias)\n**Módulos:** \`[${featuresList}]\``);

        // Botões de Tempo e Features
        const rowTime = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`dev_vip_add_7_${guildId}`).setLabel('+7 Dias').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`dev_vip_add_30_${guildId}`).setLabel('+30 Dias').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`dev_vip_set_lifetime_${guildId}`).setLabel('👑 Lifetime').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`dev_vip_remove_${guildId}`).setLabel('🛑 Remover VIP').setStyle(ButtonStyle.Danger)
        );

        const rowFeatures = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`dev_feat_toggle_tickets_${guildId}`).setLabel('Tickets (Toggle)').setStyle(ButtonStyle.Secondary).setEmoji('🎫'),
            new ButtonBuilder().setCustomId(`dev_feat_toggle_autovoice_${guildId}`).setLabel('Voice (Toggle)').setStyle(ButtonStyle.Secondary).setEmoji('🔊')
        );

        // Seção de Economia e Lojinha
        const labelEconomy = new TextDisplayBuilder().setContent('**💰 Gestão HypeCash & Loja**');
        
        const rowEconomy = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`eco_hypecash_add_${guildId}`).setLabel('Dar Saldo').setStyle(ButtonStyle.Success).setEmoji('➕'),
            new ButtonBuilder().setCustomId(`eco_hypecash_rem_${guildId}`).setLabel('Tirar Saldo').setStyle(ButtonStyle.Danger).setEmoji('➖'),
            new ButtonBuilder().setCustomId(`eco_store_add_${guildId}`).setLabel('Criar Item').setStyle(ButtonStyle.Primary).setEmoji('📦'),
            new ButtonBuilder().setCustomId(`eco_store_list_${guildId}`).setLabel('Ver Itens').setStyle(ButtonStyle.Secondary).setEmoji('📋')
        );

// 👇 Agora com o botão de entregar VIP!
        const rowVipLogs = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`eco_manage_vip_roles_${guildId}`)
                .setLabel('Configurar Cargos')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('👑'),
            new ButtonBuilder()
                .setCustomId(`eco_setup_banlog_${guildId}`)
                .setLabel('Canal de Denúncias')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('⚖️'),
            new ButtonBuilder()
                .setCustomId(`eco_give_vip_user_${guildId}`)
                .setLabel('Dar VIP a Jogador')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🎁')
        );
        // 👇 NOVA LINHA DE BOTÕES PARA O FINANCEIRO VIP
        const rowVipFinance = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`eco_config_vip_finance_${guildId}`) // AGORA
                .setLabel('Configurar Preços e Mercado Pago')
                .setStyle(ButtonStyle.Success)
                .setEmoji('💸')
        );

        const container = new ContainerBuilder()
            .setAccentColor(color)
            .addTextDisplayComponents(header)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(stats)
            .addSeparatorComponents(new SeparatorBuilder())
            .addActionRowComponents(rowTime, rowFeatures)
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(labelEconomy) 
            .addActionRowComponents(rowEconomy)
            .addActionRowComponents(rowVipFinance)
            .addActionRowComponents(rowVipLogs); // Adicionando a nova linha que contém os dois botões juntos!

        await interaction.update({
            components: [container],
            flags: [MessageFlags.IsComponentsV2]
        });
    }
};