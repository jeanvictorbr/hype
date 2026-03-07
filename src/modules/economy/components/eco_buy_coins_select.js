const { AttachmentBuilder, EmbedBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { prisma } = require('../../../core/database');
const { createPixPayment } = require('../../../utils/mercadopago');

module.exports = {
    customId: 'eco_buy_coins_select',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        // O valor do menu vem no formato: "QUANTIDADE_PREÇO" (ex: 10000000_20)
        const [amountStr, priceStr] = interaction.values[0].split('_');
        const amount = parseInt(amountStr);
        const price = parseFloat(priceStr);
        const guildId = interaction.guild.id;

        const config = await prisma.vipConfig.findUnique({ where: { guildId } });
        const mpToken = config?.mpAccessToken;
        
        if (!mpToken) return interaction.editReply('❌ O Mercado Pago não está configurado neste servidor. Avise a Administração.');

        let formattedAmount = amount >= 1000000000 ? `${amount / 1000000000} Bilhões` : `${amount / 1000000} Milhões`;
        if (amount === 1000000000) formattedAmount = '1 Bilhão';

        const payment = await createPixPayment(mpToken, price, `COINS ${formattedAmount} - ${interaction.user.tag}`);
        if (!payment) return interaction.editReply('❌ Ocorreu um erro ao gerar o PIX. Verifique se o Token é válido.');

        const buffer = Buffer.from(payment.qrCodeBase64, 'base64');
        const attachment = new AttachmentBuilder(buffer, { name: 'qrcode.png' });

        const embed = new EmbedBuilder()
            .setTitle('🪙 Pagamento PIX Gerado!')
            .setDescription(`Você está adquirindo **${formattedAmount} de Hype Coins** por **R$ ${price.toFixed(2)}**.\n\n📱 **1.** Abra o app do seu banco.\n🔍 **2.** Escaneie o QR Code abaixo ou cole o código Copia e Cola.\n✅ **3.** Após pagar, clique em **Já Paguei**.\n\n*(O dinheiro é injetado diretamente na sua carteira na hora!)*`)
            .setImage('attachment://qrcode.png')
            .setColor('#57F287');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`eco_check_pix_${payment.id}_coins_${amount}_${price}`)
                .setLabel('✅ Já Paguei (Verificar)')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('eco_cancel_buy')
                .setLabel('Cancelar Compra')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.editReply({ 
            content: `**PIX Copia e Cola:**\n\`${payment.copiaECola}\``,
            embeds: [embed], 
            files: [attachment],
            components: [row]
        });
    }
};