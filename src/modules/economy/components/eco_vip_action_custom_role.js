const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_vip_action_custom_role',

    async execute(interaction, client) {
        await interaction.deferUpdate();
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            const [userProfile, config] = await Promise.all([
                prisma.hypeUser.findUnique({ where: { id: userId } }),
                prisma.vipConfig.findUnique({ where: { guildId } })
            ]);
            
            const isVip = (userProfile?.vipLevel >= 1) || 
                          (config?.roleVip1 && interaction.member.roles.cache.has(config.roleVip1)) ||
                          (config?.roleVip2 && interaction.member.roles.cache.has(config.roleVip2)) ||
                          (config?.roleVip3 && interaction.member.roles.cache.has(config.roleVip3));

            if (!isVip) return interaction.followUp({ content: '❌ Acesso Negado.', flags: [MessageFlags.Ephemeral] });

            let myRole = userProfile?.customRoleId ? interaction.guild.roles.cache.get(userProfile.customRoleId) : null;

            // ==========================================
            // CENA 1: JÁ TEM CARGO (MOSTRA DASHBOARD)
            // ==========================================
            if (myRole) {
                const dashContainer = new ContainerBuilder()
                    .setAccentColor(myRole.color || 0x2b2d31)
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ⚙️ Painel do seu Cargo\n\n**Cargo Atual:** <@&${myRole.id}>\n**Cor HEX:** \`${myRole.hexColor}\`\n\nO que você deseja alterar na sua tag VIP?`));

                const rowActions = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('eco_vip_edit_name').setLabel('Alterar Nome').setStyle(ButtonStyle.Primary).setEmoji('✏️'),
                    new ButtonBuilder().setCustomId('eco_vip_edit_color').setLabel('Alterar Cor').setStyle(ButtonStyle.Success).setEmoji('🎨'),
                    new ButtonBuilder().setCustomId('eco_user_config').setLabel('Voltar').setStyle(ButtonStyle.Secondary).setEmoji('↩️')
                );

                return interaction.editReply({ components: [dashContainer, rowActions], flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });
            }

            // ==========================================
            // CENA 2: NÃO TEM CARGO (CRIAÇÃO DO ZERO)
            // ==========================================
            const paleta = [
                { label: 'Vermelho Sangue', emoji: '🔴', value: '#FF0000', desc: 'Vibrante e agressivo' },
                { label: 'Azul Oceano', emoji: '🔵', value: '#00BFFF', desc: 'Claro e brilhante' },
                { label: 'Verde Esmeralda', emoji: '🟢', value: '#50C878', desc: 'Vivo e natural' },
                { label: 'Amarelo Imperial', emoji: '🟡', value: '#FFD700', desc: 'Dourado luxuoso' },
                { label: 'Roxo Choque', emoji: '🟣', value: '#FF00FF', desc: 'Magenta neon' },
                { label: 'Ciano Neón', emoji: '💎', value: '#00FFFF', desc: 'Brilho ofuscante' },
                { label: 'Branco Puro', emoji: '⚪', value: '#FFFFFF', desc: 'Destaque total' },
                { label: 'Preto Fosco', emoji: '⚫', value: '#1A1A1A', desc: 'Neutro e sombrio' }
                // Pode adicionar mais cores se quiser!
            ];

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('eco_vip_custom_color_select')
                .setPlaceholder('1º Passo: Escolha a cor do cargo...')
                .setMinValues(1).setMaxValues(1);

            paleta.forEach(cor => selectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel(cor.label).setValue(cor.value).setDescription(cor.desc).setEmoji(cor.emoji)));

            const rowMenu = new ActionRowBuilder().addComponents(selectMenu);
            const rowBack = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('eco_user_config').setLabel('Voltar').setStyle(ButtonStyle.Secondary).setEmoji('↩️')
            );

            const container = new ContainerBuilder()
                .setAccentColor(0x5865F2)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# 🎨 Criar Cargo Exclusivo\n**Selecione uma cor premium abaixo** para prosseguirmos para o nome da sua tag.`));

            await interaction.editReply({ components: [container, rowMenu, rowBack], flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });

        } catch (error) {
            console.error(error);
        }
    }
};