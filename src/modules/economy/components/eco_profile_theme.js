const { StringSelectMenuBuilder, ActionRowBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_profile_theme',

    async execute(interaction) {
        const userData = await prisma.hypeUser.findUnique({ where: { id: interaction.user.id } });
        
        // Verifica se o membro é VIP
        if (!userData || userData.vipLevel === 0) {
            return interaction.reply({ 
                content: '❌ **Acesso Negado.** Temas de perfil são benefícios exclusivos para membros **VIP**!', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId('eco_profile_theme_select')
            .setPlaceholder('Escolha o seu novo tema lendário...')
            .addOptions([
                { 
                    label: 'Padrão Hype', 
                    description: 'O clássico e minimalista (Fundo Escuro)', 
                    value: 'default', // Usa o fundo padrão do código
                    emoji: '🌑' 
                },
                // 👇 AQUI ESTÃO OS TEMAS VINCULADOS ÀS IMAGENS 👇
                { 
                    label: 'Hype City', 
                    description: 'City com letreiro Neon', 
                    value: 'hypecity', // 👈 Vai procurar por "hypecity.png" na pasta themes
                    emoji: '🌃' 
                },
                { 
                    label: 'Hype Boss', 
                    description: 'Escritório luxuoso da máfia Hype', 
                    value: 'mafia', // 👈 Vai procurar por "hypeboss.png"
                    emoji: '🕴️' 
                },
                                { 
                    label: 'Hype Vintage', 
                    description: 'Tema Vintage', 
                    value: 'vintage', // 👈 Vai procurar por "hypeboss.png"
                    emoji: '🎗️' 
                },
                                { 
                    label: 'Hype Ácido', 
                    description: 'Tema Verde Ácido', 
                    value: 'hazard', // 👈 Vai procurar por "hypeboss.png"
                    emoji: '☣️' 
                },
                { 
                    label: 'Hype Cyberpunk', 
                    description: 'Graffiti neon underground', 
                    value: 'cyberpunk', // 👈 Vai procurar por "hypestreet.png"
                    emoji: '🎨' 
                },
                { 
                    label: 'Hype Cassino', 
                    description: 'Tema dos viciados', 
                    value: 'cassino', // 👈 Vai procurar por "hypegalaxy.png"
                    emoji: '🎰' 
                },
                { 
                    label: 'Hype Tokyo', 
                    description: 'Tema Tokyo', 
                    value: 'tokyo', // 👈 Vai procurar por "hypevault.png"
                    emoji: '🏯' 
                }
            ]);

        const row = new ActionRowBuilder().addComponents(select);

        await interaction.reply({ 
            content: '🎨 **Galeria VIP:**\nSelecione um dos temas abaixo. Cada tema altera o fundo do seu cartão de perfil com artes exclusivas em HD!', 
            components: [row], 
            flags: [MessageFlags.Ephemeral] 
        });
    }
};