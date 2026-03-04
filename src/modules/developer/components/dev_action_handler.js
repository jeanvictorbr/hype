const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
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
    // Prefixo real que o interactionCreate vai buscar para intercetar todas as ações DEV
    customIdPrefix: 'dev_', 

    async execute(interaction, client) {
        // ==========================================
        // 🔒 1. AUTENTICAÇÃO DE SEGURANÇA (Alta Cúpula)
        // ==========================================
        const ownerIds = process.env.OWNER_ID ? process.env.OWNER_ID.split(',') : [];
        
        if (!ownerIds.includes(interaction.user.id)) {
            // Abusa do V2 para um erro bonito e limpo
            const errContainer = new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent('🛑 **Acesso Negado:** Este painel é de uso estrito da Engenharia Koda Studios.'));
            
            return interaction.reply({ 
                components: [errContainer], 
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] 
            });
        }

        // ==========================================
        // 🛡️ 2. EXCEÇÕES DE ROTEAMENTO (Bypass)
        // ==========================================
        // Impede que este handler roube a execução de botões que têm o seu próprio ficheiro dedicado
        if (interaction.customId.startsWith('dev_config_vip_finance_')) return;
        if (interaction.customId.startsWith('dev_submit_vip_finance_')) return;

        // ==========================================
        // 🧩 3. DECODIFICADOR DE PAYLOAD (A Mágica)
        // ==========================================
        // Lê nomes de botões mutáveis. Ex: dev_vip_add_30_123456789 OU dev_eco_manage_123456789
        const parts = interaction.customId.split('_');
        
        const guildId = parts.pop(); // O ID da guilda é SEMPRE o último pedaço (resolve o bug da paginação!)
        const category = parts[1]; // 'vip', 'feat', 'eco', 'guild'
        const action = parts[2]; // 'add', 'set', 'remove', 'toggle', 'manage'
        const value = parts[3]; // '30', 'lifetime', 'tickets', 'cassino' (Pode ser undefined, e tá tudo bem)

        if (!guildId) return;

        // ==========================================
        // 🧭 4. NAVEGAÇÃO DE PÁGINAS (Frontend Router)
        // ==========================================
        // Se a ação for apenas trocar de página, redireciona para o ficheiro correto e aborta a execução aqui.
        if (category === 'eco' && action === 'manage') {
            const ecoPanel = require('./dev_eco_manage');
            return ecoPanel.execute(interaction, client);
        }
        
        if (category === 'guild' && action === 'manage') {
            const guildPanel = require('./dev_guild_manage');
            return guildPanel.execute(interaction, client);
        }

        // ==========================================
        // ⚙️ 5. EXECUÇÃO DE SISTEMA (Backend Actions)
        // ==========================================
        // Se o código chegou até aqui, é porque um botão de comando real foi clicado (ex: dar VIP).
        const guildData = await prisma.guild.findUnique({ where: { id: guildId } });
        
        if (!guildData) {
            return interaction.reply({ content: '❌ Erro Crítico: Servidor não encontrado no ecossistema.', flags: [MessageFlags.Ephemeral] });
        }

        let newExpireDate = guildData.vipExpiresAt ? new Date(guildData.vipExpiresAt) : new Date();
        
        // Se já venceu, reseta para hoje antes de adicionar tempo
        if (newExpireDate < new Date()) newExpireDate = new Date();

        let feedbackMsg = 'Ação de sistema concluída com sucesso.';

        // --- 🟢 LÓGICA VIP (Licenças de Servidor) ---
        if (category === 'vip') {
            let feats = guildData.features || [];
            
            if (action === 'add') {
                const daysToAdd = parseInt(value);
                newExpireDate = addDays(newExpireDate, daysToAdd);
                feedbackMsg = `✅ **Licença Estendida:** Adicionado +${daysToAdd} dias de SaaS.`;
                if (!feats.includes('premium')) feats.push('premium'); // Ativa a flag base
            }
            else if (action === 'set' && value === 'lifetime') {
                newExpireDate = new Date('2099-12-31'); // Código Magnata
                feedbackMsg = `👑 **Licença Suprema Ativada:** Servidor configurado para Plano Vitalício.`;
                if (!feats.includes('premium')) feats.push('premium');
                if (!feats.includes('all')) feats.push('all');
            }
            else if (action === 'remove') {
                newExpireDate = null;
                feats = []; // Formatação total
                feedbackMsg = `🛑 **Licença Revogada:** O VIP e os módulos do servidor foram desligados.`;
            }

            // Grava no Banco
            await prisma.guild.update({
                where: { id: guildId },
                data: { vipExpiresAt: newExpireDate, features: feats }
            });
        }

        // --- 🔵 LÓGICA FEATURES (Toggle de Módulos) ---
        else if (category === 'feat') {
            const featureName = value.toUpperCase(); 
            let feats = guildData.features || [];

            if (feats.includes(featureName)) {
                feats = feats.filter(f => f !== featureName); // Desliga
                feedbackMsg = `🔌 **Módulo Desligado:** A funcionalidade \`${featureName}\` foi bloqueada.`;
            } else {
                feats.push(featureName); // Liga
                feedbackMsg = `⚡ **Módulo Ativado:** A funcionalidade \`${featureName}\` foi destrancada.`;
            }

            await prisma.guild.update({
                where: { id: guildId },
                data: { features: feats }
            });
        }

        // ==========================================
        // 🔄 6. RE-RENDERIZAÇÃO (UI Update)
        // ==========================================
        // Redirecionamos a execução de volta para a Página 1 (que é onde estes botões estão)
        // O ficheiro 'dev_guild_manage' vai lidar com o `interaction.update()` para refrescar a tela.
        const managePanel = require('./dev_guild_manage');
        await managePanel.execute(interaction, client);
        
        // 💬 7. TOAST NOTIFICATION (Feedback Visual)
        // Envia uma notificação invisível com o resultado da ação por cima do painel atualizado.
        await interaction.followUp({ 
            content: feedbackMsg, 
            flags: [MessageFlags.Ephemeral] 
        });
    }
};