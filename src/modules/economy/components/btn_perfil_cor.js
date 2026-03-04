const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const { prisma } = require('../../../core/database'); // Ajuste o caminho se necessário

module.exports = {
    customId: 'btn_perfil_cor',
    async execute(interaction) {
        const userData = await prisma.hypeUser.findUnique({ where: { id: interaction.user.id } });
        
        // 🛡️ Apenas VIPs podem customizar as cores!
        if (!userData || userData.vipLevel === 0) {
            return interaction.reply({ content: '❌ Apenas membros **VIP** podem customizar as cores do perfil!', ephemeral: true });
        }

        // 🎨 Cria o Menu de Seleção com 25 Opções (1 Padrão + 24 Cores Premium)
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_perfil_cor')
            .setPlaceholder('Escolha 1 ou 2 cores mágicas...')
            .setMinValues(1) // Obrigatório escolher pelo menos 1
            .setMaxValues(2) // Pode escolher no máximo 2
            .addOptions([
                { label: '🔄 RESTAURAR PADRÃO', description: 'Voltar para a cor original do seu nível', value: 'padrao', emoji: '🎨' },
                { label: 'Vermelho Neon', description: 'O clássico vermelho vibrante', value: '#FF003C', emoji: '🔴' },
                { label: 'Azul Cyberpunk', description: 'Brilho azul futurista', value: '#00F0FF', emoji: '🔵' },
                { label: 'Verde Matrix', description: 'O verde dos hackers', value: '#00FF00', emoji: '🟢' },
                { label: 'Amarelo Ouro', description: 'Cor da riqueza e ostentação', value: '#FFD700', emoji: '🟡' },
                { label: 'Roxo Deep Web', description: 'Misterioso e profundo', value: '#8A2BE2', emoji: '🟣' },
                { label: 'Rosa Choque', description: 'Vibrante e chamativo', value: '#FF00FF', emoji: '🌸' },
                { label: 'Laranja Fogo', description: 'Quente e agressivo', value: '#FF4500', emoji: '🟠' },
                { label: 'Branco Puro', description: 'Minimalista e limpo', value: '#FFFFFF', emoji: '⚪' },
                { label: 'Ciano Diamante', description: 'Brilho de joia', value: '#00FFFF', emoji: '💎' },
                { label: 'Verde Limão', description: 'Ácido e vivo', value: '#32CD32', emoji: '🔋' },
                { label: 'Vermelho Sangue', description: 'Escuro e ameaçador', value: '#8A0303', emoji: '🩸' },
                { label: 'Azul Galáxia', description: 'Profundo como o espaço', value: '#0F52BA', emoji: '🌌' },
                { label: 'Violeta Místico', description: 'Magia e poder', value: '#EE82EE', emoji: '🍇' },
                { label: 'Dourado Rose', description: 'Luxo contemporâneo', value: '#B76E79', emoji: '👑' },
                { label: 'Verde Esmeralda', description: 'Precioso e raro', value: '#50C878', emoji: '🌿' },
                { label: 'Azul Meia-Noite', description: 'Discreto e elegante', value: '#191970', emoji: '🌙' },
                { label: 'Coral Suave', description: 'Tranquilo e moderno', value: '#FF7F50', emoji: '🍑' },
                { label: 'Prata Metálico', description: 'Frio e calculista', value: '#C0C0C0', emoji: '⚙️' },
                { label: 'Turquesa', description: 'Fresco e tropical', value: '#40E0D0', emoji: '🌊' },
                { label: 'Magenta Escuro', description: 'Sério e imponente', value: '#8B008B', emoji: '🔮' },
                { label: 'Amarelo Tóxico', description: 'Aviso de perigo', value: '#CCFF00', emoji: '☢️' },
                { label: 'Azul Gelo', description: 'Frio e cortante', value: '#A5F2F3', emoji: '🧊' },
                { label: 'Vinho Tinto', description: 'Sofisticado e maduro', value: '#722F37', emoji: '🍷' },
                { label: 'Marrom Luxo', description: 'Estilo couro premium', value: '#8B4513', emoji: '💼' }
            ]);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // Envia o menu apenas para o utilizador (ephemeral)
        await interaction.reply({ 
            content: '🎨 **Personalização VIP de Cores**\n\nSelecione na lista abaixo:\n👉 **Padrão:** Devolve o perfil à cor original.\n👉 **1 Cor:** Todo o perfil usa essa cor.\n👉 **2 Cores:** A primeira é o Brilho Principal, a segunda é o Fundo!', 
            components: [row], 
            ephemeral: true 
        });
    }
};