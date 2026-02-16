const { 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder,
    ActionRowBuilder, 
    RoleSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

module.exports = {
    customId: 'autovoice_btn_bypass',

    async execute(interaction, client) {
        
        // ==========================================
        // CONSTRUINDO A TELA DE PASSE LIVRE (App V2)
        // ==========================================
        const headerText = new TextDisplayBuilder()
            .setContent('# 🎟️ Configurar Passe Livre\nSelecione no menu abaixo os cargos da sua Staff. Membros com estes cargos poderão entrar em **qualquer sala temporária**, mesmo se o dono tiver trancado a porta com o cadeado 🔒.\n\n*Dica: Você pode selecionar múltiplos cargos de uma vez.*');

        const divider = new SeparatorBuilder();

        // 🎛️ O Menu Nativo de Cargos do Discord
        const roleMenuRow = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
                .setCustomId('select_bypass_role') // O ID que vai salvar no banco
                .setPlaceholder('Selecione os cargos da Staff...')
                .setMinValues(1)
                .setMaxValues(10) // Permite selecionar até 10 cargos numa tacada só
        );

        // Botão de voltar para não deixar o usuário preso nesta tela
        const backButtonRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('dashboard_select_module') // Reutilizamos o ID para forçar a volta, ou criamos um específico de "voltar para auto-voice"
                .setLabel('◀ Voltar')
                .setStyle(ButtonStyle.Secondary)
        );

        const bypassContainer = new ContainerBuilder()
            .setAccentColor(0x5865F2) // Blurple
            .addComponents(headerText, divider, roleMenuRow, backButtonRow);

        // Transição de tela instantânea
        await interaction.update({ components: [bypassContainer] });
    }
};