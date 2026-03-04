const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('comprarvip')
        .setDescription('🛒 Adquira o seu acesso VIP via PIX (Entrega Automática)'),

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        // Busca os preços na configuração da guilda (se não tiver, usa os padrões)
        const config = await prisma.vipConfig.findUnique({ where: { guildId: interaction.guild.id } });

        const p1 = config?.priceVip1 || 10.00;
        const p2 = config?.priceVip2 || 25.00;
        const p3 = config?.priceVip3 || 40.00;
        const p4 = config?.priceVip4 || 60.00; // Elite
        const p5 = config?.priceVip5 || 100.00; // Supreme

        const embed = new EmbedBuilder()
            .setTitle('💎 Loja VIP Automática')
            .setDescription('Escolha o seu plano abaixo. O pagamento é processado via **Mercado Pago (PIX)** e o cargo/moedas são entregues na mesma hora!')
            .addFields(
                { name: '🥉 VIP BOOSTER (Nível 1)', value: `Valor: **R$ ${p1.toFixed(2)}**\n*Duração: 30 Dias*`, inline: false },
                { name: '🥈 VIP PRIME (Nível 2)', value: `Valor: **R$ ${p2.toFixed(2)}**\n*Duração: 30 Dias*`, inline: false },
                { name: '🥇 VIP EXCLUSIVE (Nível 3)', value: `Valor: **R$ ${p3.toFixed(2)}**\n*Duração: 30 Dias*`, inline: false },
                { name: '💎 VIP ELITE (Nível 4)', value: `Valor: **R$ ${p4.toFixed(2)}**\n*Duração: 30 Dias*`, inline: false },
                { name: '👑 VIP SUPREME (Nível 5)', value: `Valor: **R$ ${p5.toFixed(2)}**\n*Duração: 30 Dias*`, inline: false }
            )
            .setColor('#5865F2');

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('eco_buy_vip_select')
                .setPlaceholder('Selecione o plano VIP que deseja adquirir...')
                .addOptions([
                    { label: 'VIP BOOSTER', description: `R$ ${p1.toFixed(2)} - Duração: 30 Dias`, value: '1', emoji: '🥉' },
                    { label: 'VIP PRIME', description: `R$ ${p2.toFixed(2)} - Duração: 30 Dias`, value: '2', emoji: '🥈' },
                    { label: 'VIP EXCLUSIVE', description: `R$ ${p3.toFixed(2)} - Duração: 30 Dias`, value: '3', emoji: '🥇' },
                    { label: 'VIP ELITE', description: `R$ ${p4.toFixed(2)} - Duração: 30 Dias`, value: '4', emoji: '💎' },
                    { label: 'VIP SUPREME', description: `R$ ${p5.toFixed(2)} - Duração: 30 Dias`, value: '5', emoji: '👑' }
                ])
        );

        await interaction.editReply({ embeds: [embed], components: [menu] });
    }
};