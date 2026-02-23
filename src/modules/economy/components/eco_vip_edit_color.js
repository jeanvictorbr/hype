const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

module.exports = {
    customId: 'eco_vip_edit_color',
    async execute(interaction, client) {
        await interaction.deferUpdate();

        // 👑 A MESMA LISTA DE 25 CORES LINDAS
        const paleta = [
            { label: 'Vermelho Sangue', emoji: '🔴', value: '#FF0000', desc: 'Vibrante e agressivo' },
            { label: 'Azul Oceano', emoji: '🔵', value: '#00BFFF', desc: 'Claro e brilhante' },
            { label: 'Verde Esmeralda', emoji: '🟢', value: '#50C878', desc: 'Vivo e natural' },
            { label: 'Amarelo Imperial', emoji: '🟡', value: '#FFD700', desc: 'Dourado luxuoso' },
            { label: 'Laranja Fogo', emoji: '🟠', value: '#FF8C00', desc: 'Intenso e chamativo' },
            { label: 'Roxo Choque', emoji: '🟣', value: '#FF00FF', desc: 'Magenta neon' },
            { label: 'Rosa Bebê', emoji: '🌸', value: '#FFB6C1', desc: 'Suave e delicado' },
            { label: 'Ciano Neón', emoji: '💎', value: '#00FFFF', desc: 'Brilho ofuscante' },
            { label: 'Branco Puro', emoji: '⚪', value: '#FFFFFF', desc: 'Destaque total' },
            { label: 'Preto Fosco', emoji: '⚫', value: '#1A1A1A', desc: 'Neutro e sombrio' },
            { label: 'Turquesa Escuro', emoji: '🌊', value: '#00CED1', desc: 'Azul esverdeado' },
            { label: 'Lavanda', emoji: '🌺', value: '#E6E6FA', desc: 'Roxo clarinho' },
            { label: 'Índigo Profundo', emoji: '🌌', value: '#4B0082', desc: 'Roxo escuro misterioso' },
            { label: 'Vinho', emoji: '🍷', value: '#800000', desc: 'Elegante e sério' },
            { label: 'Salmão', emoji: '🍣', value: '#FA8072', desc: 'Rosa alaranjado' },
            { label: 'Lima Neón', emoji: '🍋', value: '#32CD32', desc: 'Verde super chamativo' },
            { label: 'Prata Metálico', emoji: '🪙', value: '#C0C0C0', desc: 'Cinza brilhante' },
            { label: 'Bronze', emoji: '🥉', value: '#CD7F32', desc: 'Marrom acobreado' },
            { label: 'Ouro Velho', emoji: '👑', value: '#B8860B', desc: 'Dourado envelhecido' },
            { label: 'Azul Marinho', emoji: '⚓', value: '#000080', desc: 'Escuro e militar' },
            { label: 'Coral', emoji: '🪸', value: '#FF7F50', desc: 'Laranja avermelhado' },
            { label: 'Ametista', emoji: '🔮', value: '#9966CC', desc: 'Lilás premium' },
            { label: 'Menta', emoji: '🌿', value: '#98FF98', desc: 'Verde muito claro' },
            { label: 'Pêssego', emoji: '🍑', value: '#FFDAB9', desc: 'Alaranjado pastel' },
            { label: 'Cereja', emoji: '🍒', value: '#DE3163', desc: 'Vermelho rosado' }
        ];

        // O Select Menu aponta para o novo Submit de Cor
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('eco_vip_edit_color_submit')
            .setPlaceholder('Escolha a nova cor...')
            .setMinValues(1)
            .setMaxValues(1);

        paleta.forEach(cor => selectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel(cor.label).setValue(cor.value).setDescription(cor.desc).setEmoji(cor.emoji)));

        const rowMenu = new ActionRowBuilder().addComponents(selectMenu);
        const rowBack = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('eco_vip_action_custom_role').setLabel('Voltar ao Dashboard').setStyle(ButtonStyle.Secondary).setEmoji('↩️')
        );

        const container = new ContainerBuilder()
            .setAccentColor(0x5865F2)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`# 🎨 Alterar Cor do Cargo\nSelecione abaixo a nova cor que deseja aplicar à sua família/facção.`));

        await interaction.editReply({ components: [container, rowMenu, rowBack], flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });
    }
};