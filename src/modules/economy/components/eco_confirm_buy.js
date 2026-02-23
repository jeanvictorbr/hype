const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    MessageFlags 
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    // Escuta qualquer botão de confirmação de compra
    customIdPrefix: 'eco_confirm_buy_',

    async execute(interaction, client) {
        await interaction.deferUpdate();

        const userId = interaction.user.id;
        const itemId = interaction.customId.split('_').pop();

        try {
            const item = await prisma.storeItem.findUnique({ where: { id: itemId } });
            let userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });

            // Segunda validação de segurança (caso ele tenha gasto noutro lado enquanto a janela estava aberta)
            if (!item || !userProfile || userProfile.hypeCash < item.price) {
                return interaction.followUp({ content: '❌ Erro na transação. Saldo insuficiente ou item inválido.', flags: [MessageFlags.Ephemeral] });
            }

            // 💸 DESCONTA O DINHEIRO DO BANCO
            await prisma.hypeUser.update({
                where: { id: userId },
                data: { hypeCash: { decrement: item.price } }
            });

            // 📦 LÓGICA DE ENTREGA
            let isAuto = false;
            if (!item.isGameItem && item.roleId) {
                const role = interaction.guild.roles.cache.get(item.roleId);
                if (role) {
                    await interaction.member.roles.add(role).catch(() => {});
                    isAuto = true;
                }
            }

            // 🧾 GERAÇÃO DO RECIBO
            const numRecibo = Math.floor(100000 + Math.random() * 900000); // Ex: 483921
            const dataCompra = new Date().toLocaleString('pt-BR');

            // Recibo que vai para a TELA do canal
            const successTextScreen = new TextDisplayBuilder()
                .setContent(`# 🎉 Transação Aprovada!\nSua compra de **${item.name}** foi um sucesso!\n\nFoi enviado um **Recibo Detalhado** para a sua DM (Mensagem Direta). Guarde-o com segurança.`);
            
            const successContainerScreen = new ContainerBuilder()
                .setAccentColor(0x57F287)
                .addTextDisplayComponents(successTextScreen);

            await interaction.editReply({ components: [successContainerScreen], flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });

            // 📬 ENVIA O RECIBO PARA A DM DO JOGADOR
            let dmText = `# 🧾 RECIBO DA HYPE STORE\n**Data:** ${dataCompra}\n**Nº do Pedido:** #${numRecibo}\n\n**Comprador:** <@${userId}> (\`${userId}\`)\n**Item Adquirido:** ${item.name}\n**Valor Pago:** 💰 ${item.price} HC\n\n---`;

            if (isAuto) {
                dmText += `\n\n✅ **Status:** ENTREGUE\nSeu benefício foi ativado automaticamente no servidor do Discord. Curta o seu novo nível de ostentação!`;
            } else {
                dmText += `\n\n⚠️ **Status:** AGUARDANDO ENTREGA NO ROBLOX\n\n**Como resgatar seu item:**\n1. Copie o número do pedido acima ou tire um Print desta mensagem.\n2. Vá até o servidor do Discord e abra um **Ticket de Suporte**.\n3. Envie o Print do recibo e digite o seu **Nick do Roblox** e **ID do Roblox** no ticket.\n4. Aguarde a staff do Baile entregar o item na sua conta!`;
            }

            const receiptDisplay = new TextDisplayBuilder().setContent(dmText);
            const receiptContainer = new ContainerBuilder()
                .setAccentColor(0x5865F2)
                .addTextDisplayComponents(receiptDisplay);

            await interaction.user.send({
                components: [receiptContainer],
                flags: [MessageFlags.IsComponentsV2]
            }).catch(err => {
                // Se a DM estiver fechada, manda o aviso na tela do servidor
                console.log('DM do usuário fechada.');
                interaction.followUp({ content: '⚠️ Sua DM está fechada! Não conseguimos enviar o recibo de resgate. Tire print desta tela: **Nº do Pedido #' + numRecibo + '**', flags: [MessageFlags.Ephemeral] });
            });

        } catch (error) {
            console.error('Erro ao confirmar compra:', error);
        }
    }
};