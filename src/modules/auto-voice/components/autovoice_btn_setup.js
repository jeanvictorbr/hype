const { 
    ChannelType, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    PermissionFlagsBits
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    // Exatamente o ID que colocamos no botão da tela anterior
    customId: 'autovoice_btn_setup',

    async execute(interaction, client) {
        
        // ==========================================
        // 1. TELA DE CARREGAMENTO (UX de App Nativo)
        // ==========================================
        const loadingText = new TextDisplayBuilder()
            .setContent('# ⏳ Configurando Infraestrutura...\nCriando canais, ajustando permissões e sincronizando com o banco de dados. Aguarde um instante.');
        
        const loadingContainer = new ContainerBuilder()
            .setAccentColor(0xFEE75C) // Amarelo (Loading)
            .addComponents(loadingText);

        // Atualiza a tela instantaneamente para dar o feedback de "carregando"
        await interaction.update({ components: [loadingContainer] });

        try {
            const guildId = interaction.guild.id;

            // ==========================================
            // 2. CRIAÇÃO DOS CANAIS NA API DO DISCORD
            // ==========================================
            
            // Cria a Categoria
            const tempCategory = await interaction.guild.channels.create({
                name: '🎧 Salas Dinâmicas',
                type: ChannelType.GuildCategory,
            });

            // Cria o Canal Gatilho dentro da Categoria
            const triggerChannel = await interaction.guild.channels.create({
                name: '➕ Criar Sala',
                type: ChannelType.GuildVoice,
                parent: tempCategory.id,
                // Regra de Ouro: Permite entrar, mas proíbe falar no canal gatilho
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone.id,
                        allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel],
                        deny: [PermissionFlagsBits.Speak],
                    },
                ],
            });

            // ==========================================
            // 3. SINCRONIZAÇÃO COM O POSTGRESQL (Prisma)
            // ==========================================
            
            // Garante que a Guilda existe na tabela principal
            await prisma.guild.upsert({
                where: { id: guildId },
                update: {},
                create: { id: guildId },
            });

            // Salva/Atualiza as configurações do Auto-Voice
            await prisma.autoVoiceConfig.upsert({
                where: { guildId: guildId },
                update: {
                    triggerChannel: triggerChannel.id,
                    tempCategory: tempCategory.id,
                },
                create: {
                    guildId: guildId,
                    triggerChannel: triggerChannel.id,
                    tempCategory: tempCategory.id,
                    bypassRoles: [], // Array de Passe Livre começa vazio
                },
            });

            // ==========================================
            // 4. TELA DE SUCESSO (Didática e Limpa)
            // ==========================================
            const successText = new TextDisplayBuilder()
                .setContent(`# ✅ Setup Concluído!\nSua infraestrutura de **Auto-Voice** está montada e pronta para uso. O bot fará a gestão automática das salas.\n\n**Categoria base:** <#${tempCategory.id}>\n**Canal Gatilho:** <#${triggerChannel.id}>`);
            
            const divider = new SeparatorBuilder();

            // Botão para o admin voltar para as configs e, quem sabe, testar adicionar o Passe Livre
            const backRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('dashboard_btn_back')
                    .setLabel('◀ Voltar ao Painel')
                    .setStyle(ButtonStyle.Secondary)
            );

            const successContainer = new ContainerBuilder()
                .setAccentColor(0x57F287) // Verde Sucesso
                .addComponents(successText, divider, backRow);

            // Troca a tela de carregamento pela tela de sucesso
            await interaction.editReply({ components: [successContainer] });

        } catch (error) {
            console.error('❌ Erro no Setup Automático:', error);
            
            // ==========================================
            // 5. TELA DE ERRO (Tratamento humanizado)
            // ==========================================
            const errorText = new TextDisplayBuilder()
                .setContent('# ❌ Ocorreu um erro\nNão foi possível criar os canais. Verifique se o meu cargo possui a permissão de **Gerenciar Canais** e **Ver Canais** neste servidor.');
            
            const errorContainer = new ContainerBuilder()
                .setAccentColor(0xED4245) // Vermelho Erro
                .addComponents(errorText);

            await interaction.editReply({ components: [errorContainer] });
        }
    }
};