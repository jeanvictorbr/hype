const { MessageFlags, AttachmentBuilder } = require('discord.js');
const { prisma } = require('../../../core/database');
const { generateShopReceipt } = require('../../../utils/canvasShopReceipt');

module.exports = {
    customIdPrefix: 'eco_shop_buy_',

    async execute(interaction, client) {
        // Extrai o ID do dono do menu (Trava de segurança)
        const ownerId = interaction.customId.replace('eco_shop_buy_', '');

        if (interaction.user.id !== ownerId) {
            return interaction.reply({ content: '❌╺╸O fornecedor só negocia com quem abriu o catálogo!', flags: [MessageFlags.Ephemeral] });
        }

        const item = interaction.values[0];
        const userId = interaction.user.id;

        await interaction.deferUpdate(); // Para a bolinha de "A pensar..." do Discord

        let userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
        if (!userProfile) return;

        let preco = 0;
        let updateData = {};
        let nomeItem = '';
        let iconUrl = '';

        if (item === 'colete') {
            preco = 150000;
            nomeItem = 'Colete Balístico';
            iconUrl = 'https://img.icons8.com/color/256/body-armor.png';
            updateData = { invColetes: { increment: 1 } };
        } else if (item === 'pecabra') {
            preco = 50000;
            nomeItem = 'Pé de Cabra';
            iconUrl = 'https://img.icons8.com/color/256/crowbar.png';
            updateData = { invPedeCabra: { increment: 1 } };

            
            } else if (item === 'lanterna') {
    preco = 100000;
    nomeItem = 'Lanterna Tática';
    iconUrl = 'https://cdn-icons-png.flaticon.com/512/2165/2165511.png';
    updateData = { invLanternas: { increment: 1 } };

        } else if (item === 'disfarce') {
            preco = 30000;
            nomeItem = 'Kit de Disfarce';
            iconUrl = 'https://img.icons8.com/color/256/anonymous-mask.png';
            updateData = { invDisfarces: { increment: 1 } };
        } else {
            return interaction.followUp({ content: '❌ Item desconhecido.', flags: [MessageFlags.Ephemeral] });
        }

        if (userProfile.carteira < preco) {
            return interaction.followUp({ content: `❌╺╸Tu não tens **R$ ${preco.toLocaleString('pt-BR')}** na carteira para comprar o ${nomeItem}!`, flags: [MessageFlags.Ephemeral] });
        }

        // 1. Desconta o dinheiro e adiciona na mochila no Banco de Dados
        updateData.carteira = { decrement: preco };
        await prisma.hypeUser.update({
            where: { id: userId },
            data: updateData
        });

        // 2. Avisa que está a gerar o recibo (feedback visual)
        await interaction.message.edit({ content: '🖨️╺╸`Imprimindo recibo da transação...`', components: [], files: [] }).catch(()=>{});

        // 3. Gera a Imagem do Recibo pelo Canvas
        const buffer = await generateShopReceipt(interaction.user, nomeItem, preco, iconUrl);
        const attachment = new AttachmentBuilder(buffer, { name: 'recibo_loja.png' });

        // 4. Manda a Imagem e fecha o Menu
        return interaction.message.edit({ 
            content: `📦╺╸**Transação concluída no submundo!** O item foi escondido na sua \`hmochila\`.`,
            components: [], 
            files: [attachment] 
        }).catch(()=>{});
    }
};