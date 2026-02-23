const { MessageFlags, PermissionFlagsBits } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_vip_timeout_submit',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const targetId = interaction.values[0];
        const executor = interaction.member;
        const guild = interaction.guild;

        try {
            const targetMember = await guild.members.fetch(targetId).catch(() => null);

            if (!targetMember) {
                return interaction.editReply({ content: '❌ Membro não encontrado no servidor.' });
            }

            // 🛑 REGRA 1: Não pode mutar a si mesmo ou bots
            if (targetId === executor.id || targetMember.user.bot) {
                return interaction.editReply({ content: '❌ Você não pode silenciar a si mesmo ou a um bot.' });
            }

            // 🛑 REGRA 2: Não pode mutar Staffs (Verifica se o alvo tem Admin ou Kick)
            if (targetMember.permissions.has(PermissionFlagsBits.KickMembers) || targetMember.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.editReply({ content: '❌ Tá louco? Você não tem poder para silenciar a gerência!' });
            }

            // 🛑 REGRA 3: Não pode mutar outros VIPs (Imunidade VIP)
            const [targetProfile, config] = await Promise.all([
                prisma.hypeUser.findUnique({ where: { id: targetId } }),
                prisma.vipConfig.findUnique({ where: { guildId: guild.id } })
            ]);

            const targetIsVip = (targetProfile?.vipLevel >= 1) || 
                                (config?.roleVip1 && targetMember.roles.cache.has(config.roleVip1)) ||
                                (config?.roleVip2 && targetMember.roles.cache.has(config.roleVip2)) ||
                                (config?.roleVip3 && targetMember.roles.cache.has(config.roleVip3));

            if (targetIsVip) {
                return interaction.editReply({ content: '🛡️ **Imunidade VIP:** Membros VIP não podem silenciar outros VIPs. Tentativa bloqueada!' });
            }

            // ✅ APLICA O TIMEOUT (60 Segundos = 60 * 1000 milissegundos)
            await targetMember.timeout(60 * 1000, `Silenciado pelo VIP ${executor.user.tag} (Poder de Ditador)`);

            // ✅ REGISTRA O COOLDOWN NO BANCO DE DADOS
            await prisma.hypeUser.update({
                where: { id: executor.id },
                data: { lastTimeout: new Date() }
            });

            // 📢 A HUMILHAÇÃO PÚBLICA (Manda no canal onde o VIP usou o comando)
            await interaction.channel.send({
                content: `🤫 **O patrão mandou calar a boca!**\nO <@${targetId}> falou demais e foi silenciado por **60 segundos** pelo Camarote <@${executor.id}>. Abram alas para o VIP! 👑`
            });

            // ✅ RESPOSTA PRIVADA DE SUCESSO
            const successComponents = [
                {
                    "type": 17, "accent_color": 5763719,
                    "components": [
                        { "type": 10, "content": `## ✅ Ordem Executada!\nVocê calou a boca de <@${targetId}> com sucesso. O chat já está a ver o seu poder.` },
                        { "type": 14, "divider": true, "spacing": 2 },
                        {
                            "type": 1, 
                            "components": [{ "type": 2, "style": 2, "label": "Voltar", "emoji": { "name": "↩️" }, "custom_id": "eco_panel_vip_2" }]
                        }
                    ]
                }
            ];

            await interaction.editReply({ components: successComponents });

        } catch (error) {
            console.error('❌ Erro no Cala a Boca:', error);
            await interaction.editReply({ content: '❌ Ocorreu um erro. Verifique se o Bot tem a permissão de "Aplicar Castigo" (Timeout) e se o meu cargo está acima do cargo da vítima.' });
        }
    }
};