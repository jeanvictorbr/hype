const { ContainerBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    // Escuta a submissão do Modal
    customIdPrefix: 'modal_store_submit_',

    async execute(interaction, client) {
        // Oculta o estado de "A pensar..."
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const guildId = interaction.customId.split('_').pop();

        // 1. Captura os valores digitados
        const name = interaction.fields.getTextInputValue('item_name').trim();
        const priceString = interaction.fields.getTextInputValue('item_price').trim();
        const description = interaction.fields.getTextInputValue('item_desc').trim() || null;
        const roleId = interaction.fields.getTextInputValue('item_role').trim() || null;

        // 2. Validação de Preço (Garante que é um número válido e positivo)
        const price = parseInt(priceString);
        if (isNaN(price) || price <= 0) {
            const errText = new TextDisplayBuilder().setContent('❌ Preço inválido! Digite apenas números maiores que zero.');
            const errContainer = new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(errText);
            return interaction.editReply({ components: [errContainer], flags: [MessageFlags.IsComponentsV2] });
        }

        // 3. Lógica Automática (Discord vs Roblox)
        // Se houver um ID de Cargo, assumimos que é uma entrega automática no Discord. Se estiver vazio, é in-game (manual/logs).
        const isGameItem = roleId === null;
        const tipoEntrega = isGameItem ? "🎮 In-Game (Entrega Manual/Script)" : `🔵 Cargo Discord (<@&${roleId}>)`;

        try {
            // 4. Salva no Banco de Dados (PostgreSQL)
            await prisma.storeItem.create({
                data: {
                    guildId: guildId,
                    name: name,
                    price: price,
                    description: description,
                    roleId: roleId,
                    isGameItem: isGameItem
                }
            });

            // 5. Interface Visual V2 de Sucesso
            const successText = new TextDisplayBuilder()
                .setContent(`# ✅ Item Criado com Sucesso!\nO item foi adicionado à vitrine da Lojinha Hype.\n\n**🛒 Nome:** ${name}\n**💰 Valor:** ${price} HypeCash\n**📦 Tipo:** ${tipoEntrega}`);

            const successContainer = new ContainerBuilder()
                .setAccentColor(0x57F287) // Verde Sucesso
                .addTextDisplayComponents(successText);

            await interaction.editReply({ components: [successContainer], flags: [MessageFlags.IsComponentsV2] });

        } catch (error) {
            console.error('❌ Erro ao salvar item na loja:', error);
            const errText = new TextDisplayBuilder().setContent('❌ Erro de banco de dados. Verifique a consola.');
            const errContainer = new ContainerBuilder().setAccentColor(0xED4245).addTextDisplayComponents(errText);
            await interaction.editReply({ components: [errContainer], flags: [MessageFlags.IsComponentsV2] });
        }
    }
};