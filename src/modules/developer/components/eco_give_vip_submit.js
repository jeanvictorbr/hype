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

        // 👇 Trava atualizada para aceitar do 1 ao 5
        if (isNaN(level) || level < 1 || level > 5) return interaction.editReply('❌ Nível inválido. Digite um número de 1 a 5.');
        if (isNaN(days) || days < 1) return interaction.editReply('❌ Quantidade de dias inválida.');

        try {
            const guild = client.guilds.cache.get(guildId);
            const member = await guild.members.fetch(targetId).catch(() => null);
            if (!member) return interaction.editReply('❌ Jogador não encontrado no servidor. Ele precisa estar na guilda.');

            const config = await prisma.vipConfig.findUnique({ where: { guildId } });
            
            // Calcula a Data de Vencimento
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + days);

            // Salva na Base de Dados com o novo Nível 4 ou 5
            await prisma.hypeUser.upsert({
                where: { id: targetId },
                update: { vipLevel: level, vipExpiresAt: expiresAt },
                create: { id: targetId, vipLevel: level, vipExpiresAt: expiresAt }
            });

            // Entrega o Cargo do Discord (se configurado)
            let roleGiven = null;
            if (level === 1 && config?.roleVip1) roleGiven = config.roleVip1;
            if (level === 2 && config?.roleVip2) roleGiven = config.roleVip2;
            if (level === 3 && config?.roleVip3) roleGiven = config.roleVip3;
            // Se um dia adicionares no painel o config para cargo 4 e 5, ele já vai ler:
            if (level === 4 && config?.roleVip4) roleGiven = config.roleVip4;
            if (level === 5 && config?.roleVip5) roleGiven = config.roleVip5;

            // Tira outros VIPs primeiro para não ficar com 2 cargos VIP
            const rolesToRemove = [
                config?.roleVip1, config?.roleVip2, config?.roleVip3,
                config?.roleVip4, config?.roleVip5
            ].filter(Boolean);
            
            await member.roles.remove(rolesToRemove).catch(() => {});
            
            if (roleGiven) {
                await member.roles.add(roleGiven).catch(() => {});
            }

            // 👇 Novos nomes oficias do sistema Premium
            const levelNames = ['', '⭐ VIP BOOSTER', '⭐ PRIME', '⭐ EXCLUSIVE', '⭐ ELITE', '⭐ SUPREME'];

            await interaction.editReply(`✅ Sucesso! O **${levelNames[level]}** foi entregue a <@${targetId}> e vai expirar em exatos **${days} dias**.\n\n*(Lembrete: O cartão visual dele já foi atualizado automaticamente)*`);

            // Avisa o Jogador
            member.send(`🎉 **Parabéns!** A Administração concedeu-lhe o acesso **${levelNames[level]}** no servidor por **${days} dias**! Use o comando \`/vip\` para ver o seu novo Cartão Black!`).catch(() => {});

        } catch (err) {
            console.error(err);
            await interaction.editReply('❌ Ocorreu um erro ao processar o VIP. Verifique se o meu cargo está acima dos cargos VIP!');
        }
    }
};