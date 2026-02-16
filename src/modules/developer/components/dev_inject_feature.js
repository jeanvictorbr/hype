const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    // ⚠️ ATENÇÃO: Mudamos a forma de identificar. Em vez de ser um ID exato, 
    // exportamos uma função para checar se o customId COMEÇA com 'dev_inject_feature_'
    customIdPrefix: 'dev_inject_feature_',

    async execute(interaction, client) {
        // Trava de segurança extra
        if (interaction.user.id !== process.env.OWNER_ID) return;

        // Extrai o ID do servidor que estava escondido no customId do menu
        const targetGuildId = interaction.customId.split('_').pop();
        const selectedAction = interaction.values[0];

        let newFeatures = [];
        let statusMessage = '';
        let color = 0x57F287; // Verde padrão

        // ==========================================
        // 🔄 LÓGICA DE NEGÓCIO (Planos SaaS)
        // ==========================================
        if (selectedAction === 'feature_add_all') {
            newFeatures = ['all'];
            statusMessage = 'O cliente agora possui o plano **VIP Total (All)**. Todos os módulos estão liberados.';
        } 
        else if (selectedAction === 'feature_add_tickets') {
            newFeatures = ['tickets'];
            statusMessage = 'O **Módulo de Tickets** foi injetado na conta deste cliente.';
        } 
        else if (selectedAction === 'feature_remove_all') {
            newFeatures = []; // Zera o array
            statusMessage = 'Acesso premium revogado. O cliente retornou ao **Plano Free**.';
            color = 0xED4245; // Vermelho
        }

        // ==========================================
        // 💾 SALVANDO NO POSTGRESQL
        // ==========================================
        await prisma.guild.update({
            where: { id: targetGuildId },
            data: { features: newFeatures }
        });

        // Atualiza a interface V2 do Dev confirmando o sucesso
        const successText = new TextDisplayBuilder()
            .setContent(`# ✅ Operação Concluída\nServidor alvo: \`${targetGuildId}\`\n\n**Status:** ${statusMessage}`);

        const successContainer = new ContainerBuilder()
            .setAccentColor(color)
            .addComponents(successText);

        await interaction.update({ components: [successContainer] });
    }
};