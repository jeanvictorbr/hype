const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'eco_user_store_buy',

    async execute(interaction, client) {
        await interaction.deferUpdate();

        const userId = interaction.user.id;
        const itemId = interaction.values[0]; 

        try {
            // Busca o Item e o Perfil para validar antes de confirmar
            const item = await prisma.storeItem.findUnique({ where: { id: itemId } });
            if (!item) return interaction.followUp({ content: '❌ Item não encontrado.', flags: [MessageFlags.Ephemeral] });

            let userProfile = await prisma.hypeUser.findUnique({ where: { id: userId } });
            
            // Se não tem saldo, já barra aqui
            if (!userProfile || userProfile.hypeCash < item.price) {
                const poorText = new TextDisplayBuilder()
                    .setContent(`## ❌ Saldo Insuficiente!\nVocê quer comprar **${item.name}**, mas ele custa 💰 **${item.price} HC**.\nSeu saldo é de apenas 💰 **${userProfile ? userProfile.hypeCash : 0} HC**.`);
                const poorContainer = new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(poorText);
                return interaction.editReply({ components: [poorContainer], flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] });
            }

            // 🛑 GERA A DUPLA CONFIRMAÇÃO
            const confirmText = new TextDisplayBuilder()
                .setContent(`# 🛒 Confirmar Compra\nVocê está prestes a gastar o seu precioso HypeCash. Confirma os detalhes abaixo?\n\n**📦 Item:** ${item.name}\n**💰 Valor:** ${item.price} HC\n**💳 Seu Saldo Após a Compra:** ${userProfile.hypeCash - item.price} HC`);

            // Botões de SIM ou NÃO passando o ID do item
            const rowConfirm = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`eco_confirm_buy_${itemId}`)
                    .setLabel('Confirmar e Pagar')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('💸'),
                new ButtonBuilder()
                    .setCustomId('eco_cancel_buy')
                    .setLabel('Cancelar')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('✖️')
            );

            const confirmContainer = new ContainerBuilder()
                .setAccentColor(0xFEE75C) // Amarelo de Atenção
                .addTextDisplayComponents(confirmText)
                .addActionRowComponents(rowConfirm);

            await interaction.editReply({ 
                components: [confirmContainer], 
                flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] 
            });

        } catch (error) {
            console.error('❌ Erro na confirmação:', error);
        }
    }
};