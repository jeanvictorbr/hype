const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, EmbedBuilder } = require('discord.js');

module.exports = {
    customId: 'eco_cooldown_select',

    async execute(interaction, client) {
        await interaction.deferUpdate(); 

        const targetUserId = interaction.values[0];

        const embed = new EmbedBuilder()
            .setTitle('⚠️ Confirmação de Reset Global')
            .setDescription(`Você está prestes a resetar **TODOS** os cooldowns e restrições da conta VIP de <@${targetUserId}> no banco de dados.\n\nTem a certeza que deseja liberar os poderes deste jogador?`)
            .setColor('#ED4245');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`eco_cooldown_confirm_${targetUserId}`) // Passamos o ID do alvo camuflado no botão!
                .setLabel('Confirmar Limpeza')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('💥'),
            new ButtonBuilder()
                .setCustomId('eco_cooldown_cancel')
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.editReply({ 
            content: '', 
            embeds: [embed], 
            components: [row] 
        });
    }
};