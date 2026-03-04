const { prisma } = require('../../../core/database'); // Ajuste o caminho se necessário

module.exports = {
    customId: 'select_perfil_cor',
    async execute(interaction) {
        // Pega as escolhas que o utilizador selecionou no menu
        const escolhas = interaction.values; 
        
        // 🔄 Se a pessoa selecionou "Padrão", o sistema reseta e ignora as outras cores
        if (escolhas.includes('padrao')) {
            await prisma.hypeUser.update({
                where: { id: interaction.user.id },
                data: { customColor1: null, customColor2: null }
            });

            return interaction.update({ 
                content: `🎨 **Cores Restauradas!**\n\nO seu perfil voltou a usar a cor padrão do seu nível VIP.`, 
                components: [] 
            });
        }

        // A primeira escolha vai para a cor 1
        const color1 = escolhas[0];
        
        // Se ele escolheu uma segunda cor, guarda na color 2. Se não, guarda null.
        const color2 = escolhas.length > 1 ? escolhas[1] : null;

        // Salva na Base de Dados (Prisma)
        await prisma.hypeUser.update({
            where: { id: interaction.user.id },
            data: { 
                customColor1: color1,
                customColor2: color2
            }
        });

        // Apaga o menu e envia a confirmação
        await interaction.update({ 
            content: `🎨 **Cores atualizadas com sucesso!**\n\n✨ **Cor Principal:** \`${color1}\`\n🌌 **Cor Secundária:** \`${color2 || 'Nenhuma (Mesma da Cor Principal)'}\`\n\nUse o comando \`hperfil\` no chat para ver a mágica aplicada.`, 
            components: [] // Remove o select menu da tela
        });
    }
};