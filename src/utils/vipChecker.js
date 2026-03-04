const { prisma } = require('../core/database');

module.exports = (client) => {
    // Roda a cada 1 minuto
    setInterval(async () => {
        try {
            const now = new Date();

            // Busca todos os jogadores cujo VIP expirou
            const expiredUsers = await prisma.hypeUser.findMany({
                where: {
                    vipLevel: { gt: 0 },
                    vipExpiresAt: { lte: now } // Expirações iguais ou mais antigas que o momento atual
                }
            });

            if (expiredUsers.length === 0) return;

            // Busca as configurações de todas as guildas para saber quais cargos retirar
            const configs = await prisma.vipConfig.findMany();
            const configMap = new Map();
            for (const cfg of configs) configMap.set(cfg.guildId, cfg);

            for (const user of expiredUsers) {
                // 1. Apaga do Banco de Dados
                await prisma.hypeUser.update({
                    where: { id: user.id },
                    data: {
                        vipLevel: 0,
                        vipExpiresAt: null,
                        customRoleId: null // Remove o elo com o cargo custom dele
                    }
                });

                // 2. Remove tudo no Discord
                for (const guild of client.guilds.cache.values()) {
                    const member = await guild.members.fetch(user.id).catch(() => null);
                    if (member) {
                        const cfg = configMap.get(guild.id);
                        if (cfg) {
                            // Tira as patentes
                            const rolesToRemove = [cfg.roleVip1, cfg.roleVip2, cfg.roleVip3].filter(Boolean);
                            await member.roles.remove(rolesToRemove).catch(() => {});
                        }
                        
                        // DELETA O CARGO EXCLUSIVO DELE (Se ele for Nível 3 e tiver criado um)
                        if (user.customRoleId) {
                            const customRole = guild.roles.cache.get(user.customRoleId);
                            if (customRole) await customRole.delete('Limpeza automática: VIP Expirou').catch(() => {});
                        }

                        // Notifica a perda
                        member.send(`⚠️ **O Sonho Acabou!**\nO seu acesso VIP expirou e os seus poderes foram revogados no servidor **${guild.name}**. Renove para voltar à elite!`).catch(() => {});
                    }
                }
            }
        } catch (error) {
            console.error('❌ Erro no Limpador de VIP Automático:', error);
        }
    }, 60 * 1000); // 60.000 ms = 1 Minuto
};