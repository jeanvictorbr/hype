const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('extrato')
        .setDescription('📊 [Admin] Veja o relatório financeiro de vendas VIP do servidor')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator), // Bloqueia para quem não é Admin!

    async execute(interaction, client) {
        // Mensagem ephemeral para que a equipa não veja o painel
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const guildId = interaction.guild.id;

        try {
            // Busca TODAS as vendas aprovadas deste servidor no banco de dados
            const sales = await prisma.vipSale.findMany({
                where: {
                    guildId: guildId,
                    status: 'APPROVED'
                },
                orderBy: {
                    approvedAt: 'desc'
                }
            });

            if (sales.length === 0) {
                return interaction.editReply('📉 Ainda não existem vendas VIP registadas neste servidor.');
            }

            // Variáveis de Tempo
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Início do dia de hoje
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 dias atrás
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 dias atrás

            // Contadores
            let stats = {
                daily: { total: 0, client: 0, dev: 0, count: 0 },
                weekly: { total: 0, client: 0, dev: 0, count: 0 },
                monthly: { total: 0, client: 0, dev: 0, count: 0 },
                allTime: { total: 0, client: 0, dev: 0, count: 0 }
            };

            // Matemática Rápida: Varre todas as vendas e separa por datas
            sales.forEach(sale => {
                const date = new Date(sale.approvedAt);
                const price = sale.price || 0;
                const clientShare = sale.clientShare || 0;
                const devShare = sale.devShare || 0;

                // TOTAL (Desde o início)
                stats.allTime.total += price;
                stats.allTime.client += clientShare;
                stats.allTime.dev += devShare;
                stats.allTime.count++;

                // MENSAL (Últimos 30 Dias)
                if (date >= monthAgo) {
                    stats.monthly.total += price;
                    stats.monthly.client += clientShare;
                    stats.monthly.dev += devShare;
                    stats.monthly.count++;
                }

                // SEMANAL (Últimos 7 Dias)
                if (date >= weekAgo) {
                    stats.weekly.total += price;
                    stats.weekly.client += clientShare;
                    stats.weekly.dev += devShare;
                    stats.weekly.count++;
                }

                // DIÁRIO (Hoje)
                if (date >= today) {
                    stats.daily.total += price;
                    stats.daily.client += clientShare;
                    stats.daily.dev += devShare;
                    stats.daily.count++;
                }
            });

            // Função para deixar o dinheiro bonito (R$ 15,00)
            const formatMoney = (value) => `R$ ${value.toFixed(2).replace('.', ',')}`;

            // Construir o Design do Extrato
            const embed = new EmbedBuilder()
                .setTitle('📊 Relatório Financeiro Automático')
                .setDescription('Extrato de vendas de Planos VIP via PIX processadas pelo sistema.')
                .setColor('#2ecc71')
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .addFields(
                    {
                        name: '📅 Hoje (Diário)',
                        value: `**Vendas:** ${stats.daily.count}\n**Faturamento:** ${formatMoney(stats.daily.total)}\nLíquido Servidor (60%): **${formatMoney(stats.daily.client)}**\nTaxa SaaS (40%): ${formatMoney(stats.daily.dev)}`,
                        inline: false
                    },
                    {
                        name: '📆 Últimos 7 Dias (Semanal)',
                        value: `**Vendas:** ${stats.weekly.count}\n**Faturamento:** ${formatMoney(stats.weekly.total)}\nLíquido Servidor (60%): **${formatMoney(stats.weekly.client)}**\nTaxa SaaS (40%): ${formatMoney(stats.weekly.dev)}`,
                        inline: false
                    },
                    {
                        name: '🗓️ Últimos 30 Dias (Mensal)',
                        value: `**Vendas:** ${stats.monthly.count}\n**Faturamento:** ${formatMoney(stats.monthly.total)}\nLíquido Servidor (60%): **${formatMoney(stats.monthly.client)}**\nTaxa SaaS (40%): ${formatMoney(stats.monthly.dev)}`,
                        inline: false
                    },
                    {
                        name: '📈 Período Total (All-Time)',
                        value: `**Total de Vendas:** ${stats.allTime.count}\n**Faturamento Total:** ${formatMoney(stats.allTime.total)}\nLíquido Servidor (60%): **${formatMoney(stats.allTime.client)}**\nTaxa SaaS (40%): ${formatMoney(stats.allTime.dev)}`,
                        inline: false
                    }
                )
                .setFooter({ text: 'Sistema de Split Integrado • Transparência 100%' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('❌ Erro ao gerar extrato:', error);
            await interaction.editReply('❌ Ocorreu um erro ao gerar o relatório financeiro.');
        }
    }
};