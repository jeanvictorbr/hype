const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sacar')
        .setDescription('🏧 Retire dinheiro do seu Cartão Hype para a carteira.')
        .addIntegerOption(option => 
            option.setName('valor')
                .setDescription('Quanto deseja sacar?')
                .setRequired(true)
                .setMinValue(1)
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        const valor = interaction.options.getInteger('valor');
        
        const user = await prisma.hypeUser.findUnique({ where: { id: interaction.user.id } });
        
        if (!user || user.hypeCash < valor) return interaction.editReply(`❌ Saldo insuficiente no banco. Você tem R$ ${user?.hypeCash || 0}.`);

        await prisma.hypeUser.update({
            where: { id: user.id },
            data: {
                hypeCash: { decrement: valor },
                carteira: { increment: valor }
            }
        });

        await interaction.editReply(`✅ **Saque Concluído!**\nVocê sacou **R$ ${valor}**. Cuidado para não ser roubado!`);
    }
};