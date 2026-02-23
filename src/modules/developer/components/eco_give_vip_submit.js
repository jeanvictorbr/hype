const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'eco_give_vip_submit_',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        
        const guildId = interaction.customId.replace('eco_give_vip_submit_', '');
        const targetId = interaction.fields.getTextInputValue('vip_user_id').trim();
        const level = parseInt(interaction.fields.getTextInputValue('vip_level'));
        const days = parseInt(interaction.fields.getTextInputValue('vip_days'));

        if (isNaN(level) || level < 1 || level > 3) return interaction.editReply('❌ Nível inválido. Digite 1, 2 ou 3.');
        if (isNaN(days) || days < 1) return interaction.editReply('❌ Quantidade de dias inválida.');

        try {
            const guild = client.guilds.cache.get(guildId);
            const member = await guild.members.fetch(targetId).catch(() => null);
            if (!member) return interaction.editReply('❌ Jogador não encontrado no servidor. Ele precisa estar na guilda.');

            const config = await prisma.vipConfig.findUnique({ where: { guildId } });
            
            // Calcula a Data de Vencimento
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + days);

            // Salva na Base de Dados
            await prisma.hypeUser.upsert({
                where: { id: targetId },
                update: { vipLevel: level, vipExpiresAt: expiresAt },
                create: { id: targetId, vipLevel: level, vipExpiresAt: expiresAt }
            });

            // Entrega o Cargo do Discord
            let roleGiven = null;
            if (level === 1 && config?.roleVip1) roleGiven = config.roleVip1;
            if (level === 2 && config?.roleVip2) roleGiven = config.roleVip2;
            if (level === 3 && config?.roleVip3) roleGiven = config.roleVip3;

            if (roleGiven) {
                // Tira outros VIPs primeiro para não ficar com 2 cargos VIP
                const rolesToRemove = [config.roleVip1, config.roleVip2, config.roleVip3].filter(Boolean);
                await member.roles.remove(rolesToRemove).catch(() => {});
                await member.roles.add(roleGiven).catch(() => {});
            }

            const levelNames = ['', 'Pista Premium (Bronze)', 'Camarote (Prata)', 'Dono do Baile (Ouro)'];

            await interaction.editReply(`✅ Sucesso! O VIP **${levelNames[level]}** foi entregue a <@${targetId}> e vai expirar em exatos **${days} dias**.`);

            // Avisa o Jogador
            member.send(`🎉 **Parabéns!** A Administração concedeu-lhe o acesso **${levelNames[level]}** no servidor por **${days} dias**! Use \`/vip\` para abrir o seu painel.`).catch(() => {});

        } catch (err) {
            console.error(err);
            await interaction.editReply('❌ Ocorreu um erro ao processar o VIP. Verifique se o meu cargo está acima dos cargos VIP!');
        }
    }
};