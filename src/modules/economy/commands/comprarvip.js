const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('comprarvip')
        .setDescription('🛒 Adquira o seu acesso VIP via PIX (Entrega Automática)'),

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        // Tenta buscar os preços na configuração da guilda (se não tiver, usa o padrão)
        const config = await prisma.vipConfig.findUnique({ where: { guildId: interaction.guild.id } });

        // Preços padrão (Podes mudar estes valores à vontade)
        const p1 = config?.priceVip1 || 15.00;
        const p2 = config?.priceVip2 || 30.00;
        const p3 = config?.priceVip3 || 50.00;

        const embed = new EmbedBuilder()
            .setTitle('💎 Loja VIP Automática')
            .setDescription('Escolha o seu plano abaixo. O pagamento é processado via **Mercado Pago (PIX)** e o cargo é entregue na mesma hora!')
            .addFields(
                { name: '🥉 Pista Premium (30 Dias)', value: `Valor: **R$ ${p1.toFixed(2)}**`, inline: true },
                { name: '🥈 Camarote (30 Dias)', value: `Valor: **R$ ${p2.toFixed(2)}**`, inline: true },
                { name: '🥇 Dono do Baile (30 Dias)', value: `Valor: **R$ ${p3.toFixed(2)}**`, inline: true }
            )
            .setColor('#5865F2');

        const menu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('eco_buy_vip_select')
                .setPlaceholder('Selecione o plano que deseja comprar...')
                .addOptions([
                    { label: 'Pista Premium', description: `R$ ${p1.toFixed(2)} - Duração: 30 Dias`, value: '1', emoji: '🥉' },
                    { label: 'Camarote', description: `R$ ${p2.toFixed(2)} - Duração: 30 Dias`, value: '2', emoji: '🥈' },
                    { label: 'Dono do Baile', description: `R$ ${p3.toFixed(2)} - Duração: 30 Dias`, value: '3', emoji: '🥇' }
                ])
        );

        await interaction.editReply({ embeds: [embed], components: [menu] });
    }
};