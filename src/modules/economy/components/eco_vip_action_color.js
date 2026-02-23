const { 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_vip_action_color',

    async execute(interaction, client) {
        await interaction.deferUpdate();

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        try {
            // 1. A VERIFICAÇÃO HÍBRIDA (Banco OU Cargo)
            const [userProfile, config] = await Promise.all([
                prisma.hypeUser.findUnique({ where: { id: userId } }),
                prisma.vipConfig.findUnique({ where: { guildId } })
            ]);
            
            const userLevel = userProfile ? userProfile.vipLevel : 0;
            const member = interaction.member;

            // Bloqueio Integrado: É VIP 1 ou superior se tiver o nível no banco OU qualquer um dos cargos VIP
            const isVip1 = userLevel >= 1 || 
                           (config?.roleVip1 && member.roles.cache.has(config.roleVip1)) ||
                           (config?.roleVip2 && member.roles.cache.has(config.roleVip2)) ||
                           (config?.roleVip3 && member.roles.cache.has(config.roleVip3));

            if (!isVip1) {
                return interaction.followUp({ 
                    content: '❌ **Acesso Negado:** Este benefício requer o cargo de **VIP Pista Premium (Nível 1)** ou superior.', 
                    flags: [MessageFlags.Ephemeral] 
                });
            }

            // 2. PALETA DE CORES PREMIUM
            const paleta = [
                { label: 'Vermelho Sangue', emoji: '🔴', value: '#FF0000', desc: 'Cor vermelha clássica e vibrante' },
                { label: 'Azul Celeste', emoji: '🔵', value: '#00BFFF', desc: 'Um azul claro e brilhante' },
                { label: 'Verde Esmeralda', emoji: '🟢', value: '#50C878', desc: 'Verde vivo e natural' },
                { label: 'Amarelo Ouro', emoji: '🟡', value: '#FFD700', desc: 'Amarelo dourado luxuoso' },
                { label: 'Laranja Fogo', emoji: '🟠', value: '#FF8C00', desc: 'Laranja intenso' },
                { label: 'Roxo Choque', emoji: '🟣', value: '#FF00FF', desc: 'Magenta muito chamativo' },
                { label: 'Rosa Bebê', emoji: '🌸', value: '#FFB6C1', desc: 'Rosa suave e delicado' },
                { label: 'Ciano Neón', emoji: '💎', value: '#00FFFF', desc: 'Ciano super brilhante' },
                { label: 'Branco Puro', emoji: '⚪', value: '#FFFFFF', desc: 'Branco total para destaque' },
                { label: 'Preto Fosco', emoji: '⚫', value: '#1A1A1A', desc: 'Quase preto (para não sumir no fundo)' },
                { label: 'Turquesa Escuro', emoji: '🌊', value: '#00CED1', desc: 'Azul esverdeado' },
                { label: 'Lavanda', emoji: '🌺', value: '#E6E6FA', desc: 'Roxo muito clarinho' },
                { label: 'Índigo', emoji: '🌌', value: '#4B0082', desc: 'Roxo escuro e profundo' },
                { label: 'Vinho', emoji: '🍷', value: '#800000', desc: 'Vermelho escuro e elegante' },
                { label: 'Salmão', emoji: '🍣', value: '#FA8072', desc: 'Rosa alaranjado' },
                { label: 'Lima Neón', emoji: '🍋', value: '#32CD32', desc: 'Verde amarelado super forte' },
                { label: 'Prata', emoji: '🪙', value: '#C0C0C0', desc: 'Cinzento prateado' },
                { label: 'Bronze', emoji: '🥉', value: '#CD7F32', desc: 'Cor de bronze metálico' },
                { label: 'Dourado Escuro', emoji: '👑', value: '#B8860B', desc: 'Ouro envelhecido' },
                { label: 'Azul Marinho', emoji: '⚓', value: '#000080', desc: 'Azul muito escuro' }
            ];

            // 3. MONTA O MENU
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('eco_vip_color_submit')
                .setPlaceholder('Escolha a cor do seu nome...')
                .setMinValues(1)
                .setMaxValues(1);

            paleta.forEach(cor => {
                selectMenu.addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(cor.label)
                        .setValue(cor.value)
                        .setDescription(cor.desc)
                        .setEmoji(cor.emoji)
                );
            });

            // 4. INTERFACE V2
            const colorText = new TextDisplayBuilder()
                .setContent(`# 🎨 Pintura do Nick\nComo você é um membro VIP, você tem acesso à nossa paleta de cores exclusivas. Selecione uma cor no menu abaixo.`);

            const colorContainer = new ContainerBuilder()
                .setAccentColor(0x5865F2)
                .addTextDisplayComponents(colorText)
                .addActionRowComponents(new ActionRowBuilder().addComponents(selectMenu));

            await interaction.editReply({ 
                components: [colorContainer], 
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] 
            });

        } catch (error) {
            console.error('❌ Erro ao abrir menu de cor VIP:', error);
            await interaction.followUp({ content: '❌ Ocorreu um erro ao verificar o seu VIP.', flags: [MessageFlags.Ephemeral] });
        }
    }
};