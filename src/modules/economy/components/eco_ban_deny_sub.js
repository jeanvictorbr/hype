const { MessageFlags, EmbedBuilder } = require('discord.js');

module.exports = {
    customIdPrefix: 'eco_ban_deny_sub_',

    async execute(interaction, client) {
        const targetVipId = interaction.customId.replace('eco_ban_deny_sub_', '');
        const staff = interaction.user;
        const reason = interaction.fields.getTextInputValue('deny_reason');

        // Atualiza a mensagem da staff mostrando o motivo da negação e cor Cinza
        const embed = EmbedBuilder.from(interaction.message.embeds[0]);
        embed.setColor('#2b2d31');
        embed.addFields({ name: '❌ Veredito da Staff', value: `Rejeitado por <@${staff.id}>.\n**Motivo:** ${reason}` });

        await interaction.update({ components: [], embeds: [embed] });

        // Tenta mandar DM para o VIP
        try {
            const vipUser = await client.users.fetch(targetVipId);
            await vipUser.send({
                content: `⚖️ **TRIBUNAL VIP - VEREDITO** ⚖️\n\nOlá, Chefe. O seu processo de banimento infelizmente foi **REJEITADO** pelo Administrador <@${staff.id}>.\n\n**Motivo da Rejeição:**\n> *${reason}*\n\nSeja mais contundente nas provas do próximo processo. A sua cota não será estornada. 👑`
            });
        } catch (e) {
            console.log('Não foi possível enviar a DM de rejeição para o VIP (DMs fechadas).');
        }

        await interaction.followUp({ content: '❌ Solicitação rejeitada e VIP notificado com o motivo na DM.', flags: [MessageFlags.Ephemeral] });
    }
};