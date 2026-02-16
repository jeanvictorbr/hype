const { 
    ChannelType, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SeparatorBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');
const { prisma } = require('../../../core/database');

module.exports = {
    customId: 'autovoice_btn_setup',

    async execute(interaction, client) {
        
        // ==========================================
        // 1. TELA DE CARREGAMENTO (UX de App Nativo)
        // ==========================================
        const loadingText = new TextDisplayBuilder()
            .setContent('# ⏳ Configurando Infraestrutura...\nCriando canais, ajustando permissões e sincronizando com o banco de dados. Aguarde um instante.');
        
        // 🛠️ CORREÇÃO V2 APLICADA
        const loadingContainer = new ContainerBuilder()
            .setAccentColor(0xFEE75C)
            .addTextDisplayComponents(loadingText);

        await interaction.update({ components: [loadingContainer] });

        try {
            const guildId = interaction.guild.id;

            // Cria a Categoria
            const tempCategory = await interaction.guild.channels.create({
                name: '🎧 Salas Dinâmicas',
                type: ChannelType.GuildCategory,
            });

            // Cria o Canal Gatilho
            const triggerChannel = await interaction.guild.channels.create({
                name: '➕ Criar Sala',
                type: ChannelType.GuildVoice,
                parent: tempCategory.id,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone.id,
                        allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel],
                        deny: [PermissionFlagsBits.Speak],
                    },
                ],
            });

            // Sincroniza com Prisma
            await prisma.guild.upsert({
                where: { id: guildId },
                update: {},
                create: { id: guildId },
            });

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
                    bypassRoles: [],
                },
            });

            // ==========================================
            // 4. TELA DE SUCESSO
            // ==========================================
            const successText = new TextDisplayBuilder()
                .setContent(`# ✅ Setup Concluído!\nSua infraestrutura de **Auto-Voice** está montada e pronta para uso. O bot fará a gestão automática das salas.\n\n**Categoria base:** <#${tempCategory.id}>\n**Canal Gatilho:** <#${triggerChannel.id}>`);
            
            const divider = new SeparatorBuilder();

            const backRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('dashboard_btn_back')
                    .setLabel('◀ Voltar ao Painel')
                    .setStyle(ButtonStyle.Secondary)
            );

            // 🛠️ CORREÇÃO V2 APLICADA
            const successContainer = new ContainerBuilder()
                .setAccentColor(0x57F287)
                .addTextDisplayComponents(successText)
                .addSeparatorComponents(divider)
                .addActionRowComponents(backRow);

            await interaction.editReply({ components: [successContainer] });

        } catch (error) {
            console.error('❌ Erro no Setup Automático:', error);
            
            const errorText = new TextDisplayBuilder()
                .setContent('# ❌ Ocorreu um erro\nNão foi possível criar os canais. Verifique se o meu cargo possui a permissão de **Gerenciar Canais** e **Ver Canais** neste servidor.');
            
            // 🛠️ CORREÇÃO V2 APLICADA
            const errorContainer = new ContainerBuilder()
                .setAccentColor(0xED4245)
                .addTextDisplayComponents(errorText);

            await interaction.editReply({ components: [errorContainer] });
        }
    }
};