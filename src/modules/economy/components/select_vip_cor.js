const { prisma } = require('../../../core/database'); // Ajuste o caminho

module.exports = {
    customId: 'select_vip_cor',
    async execute(interaction) {
        const escolhas = interaction.values; 
        
        // Se a pessoa selecionou "Padrão" (mesmo que tenha clicado noutra cor junto), o sistema reseta.
        if (escolhas.includes('padrao')) {
            await prisma.hypeUser.update({
                where: { id: interaction.user.id },
                data: { customVipColor1: null, customVipColor2: null }
            });

            return interaction.update({ 
                content: `💳 **Cartão Restaurado!** A cor do seu Cartão VIP voltou ao padrão do seu nível.`, 
                components: [] 
            });
        }

        // Se escolheu cores normais
        const color1 = escolhas[0];
        const color2 = escolhas.length > 1 ? escolhas[1] : null;

        await prisma.hypeUser.update({
            where: { id: interaction.user.id },
            data: { 
                customVipColor1: color1,
                customVipColor2: color2
            }
        });

        await interaction.update({ 
            content: `💳 **Cartão Forjado com Sucesso!**\n\n✨ **Cor Principal:** \`${color1}\`\n🌌 **Cor Secundária:** \`${color2 || 'Nenhuma'}\`\n\nGere o seu painel VIP para ver a nova máquina!`, 
            components: []
        });
    }
};