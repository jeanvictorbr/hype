const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

// Função auxiliar para somar dias na data
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

module.exports = {
    // ID Placeholder para garantir carregamento no loader
    customId: 'dev_action_handler_placeholder',
    // Prefixo real que o interactionCreate vai buscar
    customIdPrefix: 'dev_', 

    async execute(interaction, client) {
        if (interaction.user.id !== process.env.OWNER_ID) return;

        // Formato esperado: dev_TIPO_ACAO_VALOR_GUILDID
        // Ex: dev_vip_add_30_123456789
        const parts = interaction.customId.split('_');
        const actionType = parts[1]; // vip ou feat
        const action = parts[2]; // add, set, remove, toggle
        const value = parts[3]; // 30, lifetime, tickets
        const guildId = parts[4]; // ID do servidor

        if (!guildId) return;

        const guildData = await prisma.guild.findUnique({ where: { id: guildId } });
        let newExpireDate = guildData.vipExpiresAt ? new Date(guildData.vipExpiresAt) : new Date();
        
        // Se já venceu, reseta para hoje antes de adicionar
        if (newExpireDate < new Date()) newExpireDate = new Date();

        let feedbackMsg = '';

        // --- LÓGICA VIP (DATAS) ---
        if (actionType === 'vip') {
            let feats = guildData.features;
            
            if (action === 'add') {
                const daysToAdd = parseInt(value);
                newExpireDate = addDays(newExpireDate, daysToAdd);
                feedbackMsg = `✅ Adicionado **${daysToAdd} dias** de licença.`;
                if (!feats.includes('premium')) feats.push('premium'); // Garante flag premium
            }
            else if (action === 'set' && value === 'lifetime') {
                newExpireDate = new Date('2099-12-31'); // Data longínqua
                feedbackMsg = `👑 Licença **LIFETIME** ativada.`;
                if (!feats.includes('premium')) feats.push('premium');
                if (!feats.includes('all')) feats.push('all');
            }
            else if (action === 'remove') {
                newExpireDate = null;
                feats = []; // Remove tudo (Reset)
                feedbackMsg = `🛑 VIP e Features removidos.`;
            }

            // Salva no Banco
            await prisma.guild.update({
                where: { id: guildId },
                data: { vipExpiresAt: newExpireDate, features: feats }
            });
        }

        // --- LÓGICA FEATURES (TOGGLE) ---
        else if (actionType === 'feat') {
            const featureName = value;
            let feats = guildData.features;

            if (feats.includes(featureName)) {
                feats = feats.filter(f => f !== featureName); // Remove
                feedbackMsg = `➖ Módulo **${featureName}** desativado.`;
            } else {
                feats.push(featureName); // Adiciona
                feedbackMsg = `➕ Módulo **${featureName}** ativado.`;
            }

            await prisma.guild.update({
                where: { id: guildId },
                data: { features: feats }
            });
        }

        // ==========================================
        // 🔄 RE-RENDERIZAÇÃO (Atualiza o painel)
        // ==========================================
        // Truque: Chamamos o arquivo do painel novamente para atualizar a tela
        interaction.values = [guildId]; 
        const managePanel = require('./dev_guild_manage');
        await managePanel.execute(interaction, client);
        
        // Confirmação invisível
        await interaction.followUp({ 
            content: feedbackMsg, 
            flags: [MessageFlags.Ephemeral] 
        });
    }
};