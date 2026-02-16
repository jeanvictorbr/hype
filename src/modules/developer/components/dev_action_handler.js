const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

// Função auxiliar para recalcular dias
const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

module.exports = {
    // Captura qualquer ID que comece com esses prefixos
    customIdPrefix: 'dev_', 

    async execute(interaction, client) {
        if (interaction.user.id !== process.env.OWNER_ID) return;

        // Ex: dev_vip_add_30_123456789
        const parts = interaction.customId.split('_');
        const actionType = parts[1]; // vip ou feat
        const action = parts[2]; // add, set, toggle
        const value = parts[3]; // 30, lifetime, tickets
        const guildId = parts[4]; // ID do servidor

        // Busca estado atual
        const guildData = await prisma.guild.findUnique({ where: { id: guildId } });
        let newExpireDate = guildData.vipExpiresAt ? new Date(guildData.vipExpiresAt) : new Date();
        
        // Se a data já passou (expirou), começamos a contar de HOJE
        if (newExpireDate < new Date()) {
            newExpireDate = new Date();
        }

        let feedbackMsg = '';
        let color = 0x57F287; // Verde

        // ==========================================
        // 🕒 LÓGICA DE TEMPO (VIP)
        // ==========================================
        if (actionType === 'vip') {
            if (action === 'add') {
                const daysToAdd = parseInt(value);
                newExpireDate = addDays(newExpireDate, daysToAdd);
                feedbackMsg = `✅ Adicionado **${daysToAdd} dias** de licença.`;
                
                // Garante que tenha a flag 'premium'
                let feats = guildData.features;
                if (!feats.includes('premium')) feats.push('premium');
                
                await prisma.guild.update({
                    where: { id: guildId },
                    data: { vipExpiresAt: newExpireDate, features: feats }
                });
            }
            else if (action === 'set' && value === 'lifetime') {
                // Lifetime = Data muito distante (ano 2099)
                newExpireDate = new Date('2099-12-31');
                feedbackMsg = `👑 Licença **LIFETIME** ativada.`;
                
                let feats = guildData.features;
                if (!feats.includes('premium')) feats.push('premium');
                 if (!feats.includes('all')) feats.push('all');

                await prisma.guild.update({
                    where: { id: guildId },
                    data: { vipExpiresAt: newExpireDate, features: feats }
                });
            }
            else if (action === 'remove') {
                await prisma.guild.update({
                    where: { id: guildId },
                    data: { vipExpiresAt: null, features: [] } // Remove tudo
                });
                feedbackMsg = `🛑 VIP removido completamente.`;
                color = 0xED4245;
            }
        }

        // ==========================================
        // 🧩 LÓGICA DE FEATURES (MODULOS)
        // ==========================================
        else if (actionType === 'feat') {
            const featureName = value;
            let feats = guildData.features;

            if (feats.includes(featureName)) {
                // Remove
                feats = feats.filter(f => f !== featureName);
                feedbackMsg = `➖ Módulo **${featureName}** desativado.`;
                color = 0xFEE75C;
            } else {
                // Adiciona
                feats.push(featureName);
                feedbackMsg = `mk➕ Módulo **${featureName}** ativado.`;
            }

            await prisma.guild.update({
                where: { id: guildId },
                data: { features: feats }
            });
        }

        // ==========================================
        // 🔄 RETORNO VISUAL
        // ==========================================
        // Aqui temos um truque: Em vez de só responder, vamos chamar o 'dev_guild_manage' 
        // de novo para RE-RENDERIZAR o painel com os dados atualizados!
        
        // Simular uma interação de menu para reaproveitar o código do painel
        interaction.values = [guildId]; 
        
        // Importa o painel dinamicamente para evitar ciclo de dependência
        const managePanel = require('./dev_guild_manage');
        await managePanel.execute(interaction, client);
        
        // Opcional: Mandar mensagem efêmera confirmando a ação
        await interaction.followUp({ 
            content: feedbackMsg, 
            flags: [MessageFlags.Ephemeral] 
        });
    }
};