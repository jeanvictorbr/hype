const { MessageFlags, EmbedBuilder } = require('discord.js');

module.exports = {
    // Usamos prefix porque o ID do VIP vem atrelado ao botão
    customIdPrefix: 'eco_ban_approve_',

    async execute(interaction, client) {
        // Pega o ID do VIP que solicitou
        const targetVipId = interaction.customId.split('_').pop();
        const staff = interaction.user;

        // Atualiza o Embed no canal da staff, tirando os botões e mudando a cor para Verde
        const embed = EmbedBuilder.from(interaction.message.embeds[0]);
        embed.setColor('#57F287');
        embed.addFields({ name: '✅ Veredito da Staff', value: `Aprovado e executado por <@${staff.id}>.` });

        await interaction.update({ components: [], embeds: [embed] });

        // Tenta mandar DM para o VIP (Pode falhar se ele tiver DMs fechadas)
        try {
            const vipUser = await client.users.fetch(targetVipId);
            await vipUser.send({
                content: `⚖️ **TRIBUNAL VIP - VEREDITO** ⚖️\n\nOlá, Chefe! O seu processo de banimento contra o infrator foi **APROVADO** pelo Administrador <@${staff.id}>.\nAs medidas de segurança foram aplicadas e o servidor está limpo. O império agradece a sua lealdade. 👑`
            });
        } catch (e) {
            console.log('Não foi possível enviar a DM de aprovação para o VIP (DMs fechadas).');
        }

        await interaction.followUp({ content: '✅ Solicitação aprovada. O VIP foi notificado na DM!', flags: [MessageFlags.Ephemeral] });
    }
};