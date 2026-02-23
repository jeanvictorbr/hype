const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');

module.exports = {
    customId: 'eco_vip_color_submit',

    async execute(interaction, client) {
        await interaction.deferUpdate();

        // Extrai a cor (value) e o nome bonito da cor (label) a partir do Select Menu
        const hexColor = interaction.values[0]; 
        const selectedOption = interaction.component.options.find(opt => opt.value === hexColor);
        const colorName = selectedOption ? selectedOption.label : 'Cor Personalizada';

        const member = interaction.member;
        const guild = interaction.guild;
        
        // Agora o nome do cargo é amigável e focado no jogador
        const roleName = `🎨 | ${colorName} (${member.user.username})`; 

        try {
            // 1. ACHAR A POSIÇÃO IMBATÍVEL (A ÂNCORA)
            // Procura se você criou o cargo âncora no servidor. Se não achar, usa o maior cargo do bot
            const anchorRole = guild.roles.cache.find(r => r.name === '==== CORES VIP ====');
            let targetPosition = anchorRole ? anchorRole.position - 1 : guild.members.me.roles.highest.position - 1;

            if (targetPosition < 1) targetPosition = 1;

            // 2. PROCURAR CARGO ANTIGO
            // Em vez de procurar por nome (já que agora o nome muda se ele escolher outra cor), 
            // procuramos um cargo do qual ele já seja dono e que comece por "🎨 |"
            let userColorRole = member.roles.cache.find(r => r.name.startsWith('🎨 |') && r.name.includes(member.user.username));

            // Se o cargo antigo existir e estiver perdido pelo servidor, garantimos a posição dele
            if (userColorRole) {
                await userColorRole.edit({ 
                    name: roleName, 
                    color: hexColor 
                });
                
                // Força o cargo a subir para a posição imbatível, se ele estiver abaixo do que deve
                if (userColorRole.position !== targetPosition) {
                    await userColorRole.setPosition(targetPosition).catch(console.error);
                }

            } else {
                // 3. CRIAR CARGO NOVO NA POSIÇÃO CORRETA
                userColorRole = await guild.roles.create({
                    name: roleName,
                    color: hexColor,
                    position: targetPosition, // Já nasce no topo!
                    reason: `Pintura de Nick VIP para ${member.user.tag}`
                });

                await member.roles.add(userColorRole);
            }

            // 4. SUCESSO VISUAL (A interface muda para a cor exata!)
            const corInteira = parseInt(hexColor.replace('#', ''), 16);
            
            const successText = new TextDisplayBuilder()
                .setContent(`## 🎨 Pintura Concluída!\nO seu perfil agora ostenta o cargo **${roleName}**.\n\nA cor foi aplicada com sucesso na hierarquia do servidor.`);

            const successContainer = new ContainerBuilder()
                .setAccentColor(corInteira) 
                .addTextDisplayComponents(successText);

            // Podemos adicionar o botão de voltar para o Painel VIP 1!
            const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            const rowBack = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('eco_panel_vip_1').setLabel('Voltar ao Painel Premium').setStyle(ButtonStyle.Secondary).setEmoji('↩️')
            );

            await interaction.editReply({ 
                components: [successContainer, rowBack], 
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] 
            });

        } catch (error) {
            console.error('❌ Erro ao mudar cor do VIP:', error);
            
            const errText = new TextDisplayBuilder()
                .setContent(`## ❌ Erro de Sistema\nO bot não possui permissão para mover o cargo acima dos seus cargos atuais. Peça a um Administrador para colocar o cargo do Bot no topo da lista.`);
            
            const errContainer = new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(errText);
            await interaction.editReply({ components: [errContainer], flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });
        }
    }
};