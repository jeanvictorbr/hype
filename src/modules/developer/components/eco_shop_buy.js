const { MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    // Captura qualquer botão que comece com eco_shop_
    customIdPrefix: 'eco_shop_',

    async execute(interaction) {
        const parts = interaction.customId.replace('eco_shop_', '').split('_');
        const item = parts[0]; // 'colete' ou 'pecabra'
        const ownerId = parts[1];

        // Trava de segurança para impedir terceiros de clicarem
        if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: '❌ Usa o comando `hloja` para abrires o teu próprio balcão de compras!', flags: [MessageFlags.Ephemeral] });
        }

        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        try {
            const userProfile = await prisma.hypeUser.findUnique({ where: { id: ownerId } });
            if (!userProfile) return interaction.editReply('❌ Não tens registo na economia.');

            // Preços e Regras
            const prices = {
                'colete': 300000,
                'pecabra': 250000
            };
            const itemPrice = prices[item];

            // Verifica se tem dinheiro no Banco
            if (userProfile.hypeCash < itemPrice) {
                return interaction.editReply(`❌ O traficante recusa-se a vender. Precisas de **R$ ${itemPrice.toLocaleString('pt-BR')}** no **Banco (Cartão)** para comprar isto.`);
            }

            // Lógica Específica do Colete
            if (item === 'colete') {
                if (userProfile.hasColete) {
                    return interaction.editReply('🛡️ Tu já tens um Colete à Prova de Balas equipado debaixo da roupa! Vai usá-lo primeiro.');
                }
                
                await prisma.hypeUser.update({
                    where: { id: ownerId },
                    data: { hypeCash: { decrement: itemPrice }, hasColete: true }
                });

                return interaction.editReply('✅ **Compra Secreta Concluída!**\nVestiste o `🛡️ Colete à Prova de Balas`. O próximo jogador que tentar assaltar a tua carteira vai falhar automaticamente!');
            }

            // Lógica Específica do Pé de Cabra
            if (item === 'pecabra') {
                const now = new Date();
                // Se já tem um ativo, não deixa comprar outro para não sobrepor
                if (userProfile.peDeCabraExp && new Date(userProfile.peDeCabraExp).getTime() > now.getTime()) {
                    const expireUnix = Math.floor(new Date(userProfile.peDeCabraExp).getTime() / 1000);
                    return interaction.editReply(`🪓 O teu Pé de Cabra ainda está afiado! Ele só perde a validade em <t:${expireUnix}:f>.`);
                }

                // Dá o buff de 24 horas (86400000 ms)
                const expireDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

                await prisma.hypeUser.update({
                    where: { id: ownerId },
                    data: { hypeCash: { decrement: itemPrice }, peDeCabraExp: expireDate }
                });

                return interaction.editReply('✅ **Equipamento Comprado!**\nEscondeste o `🪓 Pé de Cabra` no casaco. As tuas chances de sucesso em assaltos aumentaram em **15%** durante as próximas 24 horas!');
            }

        } catch (error) {
            console.error('❌ Erro na Loja do Mercado Negro:', error);
            await interaction.editReply('❌ Ocorreu um erro ao processar o pagamento no submundo.');
        }
    }
};