const { AttachmentBuilder, EmbedBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { prisma } = require('../../../core/database');
const { createPixPayment } = require('../../../utils/mercadopago');

module.exports = {
    customId: 'eco_buy_vip_select',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const level = parseInt(interaction.values[0]); // Vai de 1 a 5
        const guildId = interaction.guild.id;

        // 1. Busca Configurações no Banco
        const config = await prisma.vipConfig.findUnique({ where: { guildId } });
        const mpToken = config?.mpAccessToken;
        
        if (!mpToken) return interaction.editReply('❌ O Mercado Pago não está configurado neste servidor. Avise a Administração.');

        // 5 Preços e 5 Nomes
        const prices = { 
            1: config?.priceVip1 || 10.00, 
            2: config?.priceVip2 || 25.00, 
            3: config?.priceVip3 || 40.00,
            4: config?.priceVip4 || 60.00,
            5: config?.priceVip5 || 100.00 
        };
        
        const names = { 
            1: 'BOOSTER (Nível 1)', 
            2: 'PRIME (Nível 2)', 
            3: 'EXCLUSIVE (Nível 3)',
            4: 'ELITE (Nível 4)',
            5: 'SUPREME (Nível 5)'
        };

        const price = prices[level];
        const planName = names[level];

        // 2. GERA O PIX
        const payment = await createPixPayment(mpToken, price, `VIP ${planName} - ${interaction.user.tag}`);
        if (!payment) return interaction.editReply('❌ Ocorreu um erro ao gerar o PIX. Verifique se o Token no painel dev é válido.');

        // 3. MONTA A MENSAGEM COM O QR CODE E OS BOTÕES
        const buffer = Buffer.from(payment.qrCodeBase64, 'base64');
        const attachment = new AttachmentBuilder(buffer, { name: 'qrcode.png' });

        const embed = new EmbedBuilder()
            .setTitle('🪙 Pagamento PIX Gerado!')
            .setDescription(`Você está adquirindo o **VIP ${planName}** por **R$ ${price.toFixed(2)}**.\n\n📱 **1.** Abra o app do seu banco.\n🔍 **2.** Escaneie o QR Code abaixo ou cole o código Copia e Cola.\n✅ **3.** Após pagar, clique em **Já Paguei**.\n\n*(Duração do plano: 30 Dias)*`)
            .setImage('attachment://qrcode.png')
            .setColor('#00B1EA');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                // Salvamos o ID do pagamento e o nível escolhido no botão para o arquivo check_pix ler
                .setCustomId(`eco_check_pix_${payment.id}_${level}`)
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