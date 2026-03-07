const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('comprarvip')
        .setDescription('🛒 Adquira VIP ou Hype Coins via PIX (Entrega Automática)'),

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const config = await prisma.vipConfig.findUnique({ where: { guildId: interaction.guild.id } });

        const p1 = config?.priceVip1 || 10.00;
        const p2 = config?.priceVip2 || 25.00;
        const p3 = config?.priceVip3 || 40.00;
        const p4 = config?.priceVip4 || 60.00;
        const p5 = config?.priceVip5 || 100.00;

        const embed = new EmbedBuilder()
            .setTitle('🛒 Central de Compras Hype')
            .setDescription('O pagamento é processado de forma 100% segura e automática via **Mercado Pago (PIX)**. A sua recompensa é entregue na mesma hora!')
            .addFields(
                { 
                    name: '💎 PLANOS VIP (30 Dias)', 
                    value: `🥉 **Booster:** R$ ${p1.toFixed(2)}\n🥈 **Prime:** R$ ${p2.toFixed(2)}\n🥇 **Exclusive:** R$ ${p3.toFixed(2)}\n💎 **Elite:** R$ ${p4.toFixed(2)}\n👑 **Supreme:** R$ ${p5.toFixed(2)}`, 
                    inline: true 
                },
                { 
                    name: '💰 PACOTES DE COINS (Dinheiro)', 
                    value: `💵 **10M:** R$ 20,00\n💵 **50M:** R$ 100,00\n💵 **100M:** R$ 200,00\n💵 **200M:** R$ 400,00\n💵 **300M:** R$ 600,00\n💵 **500M:** R$ 1.000,00\n💼 **1B:** R$ 2.000,00\n💼 **2B:** R$ 4.000,00\n💼 **5B:** R$ 10.000,00`, 
                    inline: true 
                }
            )
            .setColor('#5865F2');

        const menuVip = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('eco_buy_vip_select')
                .setPlaceholder('💎 Selecione um Plano VIP...')
                .addOptions([
                    { label: 'VIP BOOSTER', description: `R$ ${p1.toFixed(2)} - Duração: 30 Dias`, value: '1', emoji: '🥉' },
                    { label: 'VIP PRIME', description: `R$ ${p2.toFixed(2)} - Duração: 30 Dias`, value: '2', emoji: '🥈' },
                    { label: 'VIP EXCLUSIVE', description: `R$ ${p3.toFixed(2)} - Duração: 30 Dias`, value: '3', emoji: '🥇' },
                    { label: 'VIP ELITE', description: `R$ ${p4.toFixed(2)} - Duração: 30 Dias`, value: '4', emoji: '💎' },
                    { label: 'VIP SUPREME', description: `R$ ${p5.toFixed(2)} - Duração: 30 Dias`, value: '5', emoji: '👑' }
                ])
        );

        const menuCoins = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('eco_buy_coins_select')
                .setPlaceholder('💰 Selecione um Pacote de Coins...')
                .addOptions([
                    { label: '10 Milhões de Coins', description: 'R$ 20,00', value: '10000000_20', emoji: '💵' },
                    { label: '50 Milhões de Coins', description: 'R$ 100,00', value: '50000000_100', emoji: '💵' },
                    { label: '100 Milhões de Coins', description: 'R$ 200,00', value: '100000000_200', emoji: '💵' },
                    { label: '200 Milhões de Coins', description: 'R$ 400,00', value: '200000000_400', emoji: '💵' },
                    { label: '300 Milhões de Coins', description: 'R$ 600,00', value: '300000000_600', emoji: '💵' },
                    { label: '500 Milhões de Coins', description: 'R$ 1.000,00', value: '500000000_1000', emoji: '💵' },
                    { label: '1 Bilhão de Coins', description: 'R$ 2.000,00', value: '1000000000_2000', emoji: '💼' },
                    { label: '2 Bilhões de Coins', description: 'R$ 4.000,00', value: '2000000000_4000', emoji: '💼' },
                    { label: '5 Bilhões de Coins', description: 'R$ 10.000,00', value: '5000000000_10000', emoji: '💼' }
                ])
        );

        await interaction.editReply({ embeds: [embed], components: [menuVip, menuCoins] });
    }
};