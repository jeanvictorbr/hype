const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customIdPrefix: 'eco_cooldown_confirm_',

    async execute(interaction, client) {
        await interaction.deferUpdate();

        // Extrai o ID do alvo que escondemos no botão
        const targetUserId = interaction.customId.replace('eco_cooldown_confirm_', '');
        const guildId = interaction.guild.id;

        try {
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: targetUserId } });

            if (!userProfile) {
                return interaction.editReply({ content: '❌ Este jogador não tem perfil na base de dados.', embeds: [], components: [] });
            }

            // 1. Zera TODOS os timers do utilizador (Salários, Social, Jogos e VIP)
            await prisma.hypeUser.update({
                where: { id: targetUserId },
                data: {
                    // Economia Base
                    lastDaily: null,
                    lastSemanal: null,
                    lastMensal: null,
                    lastRob: null,
                    lastGame: null,
                    
                    // Comandos Sociais
                    lastBeijar: null,
                    lastTapa: null,
                    lastAbracar: null,
                    lastMorder: null,
                    lastPat: null,
                    lastSocar: null,
                    lastCafune: null,
                    lastVipDaily: null,

                    // VIP & Moderação
                    lastAnnounce: null,
                    lastTimeout: null,
                    lastBlackout: null,
                    lastMoneyRain: null,
                    banRequestsCount: 0,
                    banRequestReset: null
                }
            });

            // 2. Bónus: Se ele era o Agiota atual deste servidor, removemos o imposto dele!
            const guildConfig = await prisma.vipConfig.findUnique({ where: { guildId } });
            if (guildConfig && guildConfig.agiotaId === targetUserId) {
                await prisma.vipConfig.update({
                    where: { guildId },
                    data: { agiotaId: null, agiotaExpires: null }
                });
            }

            await interaction.editReply({ 
                content: `✅ **Sucesso Absoluto!**\nTodos os cooldowns de <@${targetUserId}> (Salários, Ações Sociais, Jogos e VIP) foram purificados da Matrix! 💥`, 
                embeds: [], 
                components: [] 
            });

        } catch (error) {
            console.error('❌ Erro no painel de Reset:', error);
            await interaction.editReply({ content: '❌ Ocorreu um erro ao atualizar o banco de dados.', embeds: [], components: [] });
        }
    }
};