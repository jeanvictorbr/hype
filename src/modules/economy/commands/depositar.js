const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('depositar')
        .setDescription('🏦 Guarde o dinheiro da carteira no seu Cartão Hype.')
        .addIntegerOption(option => 
            option.setName('valor')
                .setDescription('Quanto deseja depositar? (Coloque 0 para depositar TUDO)')
                .setRequired(true)
                .setMinValue(0)
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        let valor = interaction.options.getInteger('valor');
        
        const user = await prisma.hypeUser.findUnique({ where: { id: interaction.user.id } });
        if (!user || user.carteira <= 0) return interaction.editReply('❌ Você não tem dinheiro na carteira!');
        
        // Se colocar 0, deposita TUDO
        if (valor === 0) valor = user.carteira;
        
        if (user.carteira < valor) return interaction.editReply(`❌ Você só tem R$ ${user.carteira} na carteira.`);

        // Transfere da Carteira para o Banco (hypeCash)
        await prisma.hypeUser.update({
            where: { id: user.id },
            data: {
                carteira: { decrement: valor },
                hypeCash: { increment: valor }
            }
        });

        await interaction.editReply(`✅ **Depósito Concluído!**\nVocê depositou **R$ ${valor}** no seu Cartão Hype. Está seguro agora!`);
    }
};