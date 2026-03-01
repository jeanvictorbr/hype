const { StringSelectMenuBuilder, ActionRowBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_profile_theme',

    async execute(interaction) {
        // Verifica se é VIP para segurança extra
        const userData = await prisma.hypeUser.findUnique({ where: { id: interaction.user.id } });
        if (!userData || userData.vipLevel === 0) {
            return interaction.reply({ 
                content: '❌ **Acesso Negado.** Temas de perfil são benefícios exclusivos para membros **VIP**!', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // Constrói o menu com os novos temas
        const select = new StringSelectMenuBuilder()
            .setCustomId('eco_profile_theme_select')
            .setPlaceholder('Escolha o seu novo tema lendário...')
            .addOptions([
                { 
                    label: 'Padrão Hype', 
                    description: 'O clássico e minimalista', 
                    value: 'default', 
                    emoji: '🌑' 
                },
                { 
                    label: 'Magnata do Ouro', 
                    description: 'Brilho dourado, luxo e partículas de ouro', 
                    value: 'gold', 
                    emoji: '👑' 
                },
                { 
                    label: 'Cyberpunk Neon', 
                    description: 'Luzes neon vibrantes e grade digital', 
                    value: 'cyberpunk', 
                    emoji: '🤖' 
                },
                { 
                    label: 'Máfia Sanguinária', 
                    description: 'Neblina vermelha profunda e sombras', 
                    value: 'blood', 
                    emoji: '🩸' 
                },
                { 
                    label: 'Galáxia Profunda', 
                    description: 'Estrelas em HD e nebulosas cósmicas', 
                    value: 'galaxy', 
                    emoji: '🌌' 
                }
            ]);

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.reply({ 
            content: '🎨 **Galeria VIP:**\nSelecione um dos temas abaixo. O seu perfil será atualizado instantaneamente em alta qualidade!', 
            components: [row], 
            flags: [MessageFlags.Ephemeral] 
        });
    }
};