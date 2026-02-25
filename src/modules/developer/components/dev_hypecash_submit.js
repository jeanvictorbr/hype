const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    // Captura tanto o modal de 'add' quanto o de 'rem'
    customIdPrefix: 'modal_hypecash_',

    async execute(interaction, client) {
        // 1. Oculta o carregamento para não dar erro de tempo
        await interaction.deferUpdate();

        // Exemplo: modal_hypecash_add_123456789
        const parts = interaction.customId.split('_');
        const action = parts[2]; // 'add' ou 'rem'
        const guildId = parts[3];

        // 2. Captura o que você digitou no modal
        const targetId = interaction.fields.getTextInputValue('input_user_id').trim();
        const amountString = interaction.fields.getTextInputValue('input_amount').trim();
        
        // Converte o valor para Número Inteiro
        const amount = parseInt(amountString);

        if (isNaN(amount) || amount <= 0) {
            return interaction.followUp({ 
                content: '❌ Valor inválido. Digite apenas números maiores que zero.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        try {
            // 3. Busca ou Cria o Perfil do Usuário no Banco
            let userProfile = await prisma.hypeUser.findUnique({
                where: { id: targetId }
            });

            if (!userProfile) {
                userProfile = await prisma.hypeUser.create({
                    data: { id: targetId, hypeCash: 0, vipLevel: 0 }
                });
            }

            // 4. Faz a Matemática (Adicionar ou Remover)
            let newBalance = userProfile.hypeCash;
            let verb = '';

            if (action === 'add') {
                newBalance += amount;
                verb = 'Adicionado';
            } else if (action === 'rem') {
                newBalance -= amount;
                if (newBalance < 0) newBalance = 0; // Evita saldo negativo
                verb = 'Removido';
            }

            // 5. Salva o novo saldo no Banco
            await prisma.hypeUser.update({
                where: { id: targetId },
                data: { hypeCash: newBalance }
            });

            // 6. Confirmação Visual V2
            const successText = new TextDisplayBuilder()
                .setContent(`# 💸 Transação Concluída!\n**Ação:** ${verb} ${amount} HypeCoins\n**Usuário:** <@${targetId}> (\`${targetId}\`)\n**Novo Saldo:** 💰 ${newBalance} HypeCoins`);

            const successContainer = new ContainerBuilder()
                .setAccentColor(action === 'add' ? 0x57F287 : 0xED4245) // Verde p/ Add, Vermelho p/ Rem
                .addTextDisplayComponents(successText);

            // Substitui a tela antiga pela tela de sucesso
            await interaction.editReply({ 
                components: [successContainer], 
                flags: [MessageFlags.IsComponentsV2] 
            });

        } catch (error) {
            console.error('❌ Erro na transação de HypeCoins:', error);
            await interaction.followUp({ 
                content: '❌ Erro no banco de dados ao processar a transação.', 
                flags: [MessageFlags.Ephemeral] 
            });
        }
    }
};