const { 
    SlashCommandBuilder, 
    PermissionFlagsBits, 
    EmbedBuilder,
    MessageFlags 
} = require('discord.js');

// Função de pausa inteligente
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('massrole')
        .setDescription('🚨 [ADMIN] Dá ou remove um cargo de TODOS os membros do servidor.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('acao')
                .setDescription('O que deseja fazer?')
                .setRequired(true)
                .addChoices(
                    { name: '➕ Adicionar', value: 'add' },
                    { name: '➖ Remover', value: 'remove' }
                )
        )
        .addRoleOption(option =>
            option.setName('cargo')
                .setDescription('Qual cargo será processado?')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        // 1. Mensagem de Carregamento (Privada para quem executou)
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const action = interaction.options.getString('acao');
        const role = interaction.options.getRole('cargo');
        const guild = interaction.guild;

        // ==========================================
        // 🛡️ BLINDAGEM 1: Hierarquia
        // ==========================================
        if (role.position >= guild.members.me.roles.highest.position) {
            return interaction.editReply('❌ **Erro de Permissão:** O meu cargo precisa estar acima do cargo que queres dar/remover!');
        }

        if (role.managed) {
            return interaction.editReply('❌ **Erro:** Este cargo pertence a um Bot ou Integração do Discord.');
        }

        await interaction.editReply('📡 A analisar a lista de membros do servidor...');

        // ==========================================
        // 🛡️ BLINDAGEM 2: Fetch Seguro e Filtro
        // ==========================================
        const allMembers = await guild.members.fetch().catch(() => null);
        if (!allMembers) {
             return interaction.editReply('❌ **Erro Crítico:** Não foi possível puxar os membros da API do Discord.');
        }

        // Filtra para agir APENAS em quem precisa (Humanos que têm/não têm o cargo)
        const targets = allMembers.filter(m => {
            if (m.user.bot) return false;
            const hasRole = m.roles.cache.has(role.id);
            return action === 'add' ? !hasRole : hasRole;
        });

        if (targets.size === 0) {
            return interaction.editReply(`✅ **Tudo Limpo!** Ninguém precisa de alterações no cargo **@${role.name}**.`);
        }

        // Avisa que o processo pesado vai começar
        await interaction.editReply(`🚀 **Iniciando Processo!**\nAlvos: \`${targets.size} membros\`.\n\nPodes ignorar esta mensagem, vou **marcar-te aqui no chat** quando terminar!`);

        // ==========================================
        // ⚙️ MOTOR BACKGROUND (Totalmente Solto)
        // ==========================================
        setTimeout(async () => {
            let success = 0;
            let failed = 0;

            for (const [memberId, member] of targets) {
                try {
                    if (action === 'add') {
                        await member.roles.add(role.id);
                    } else {
                        await member.roles.remove(role.id);
                    }
                    success++;
                } catch (error) {
                    console.error(`Erro ao dar cargo para ${member.user.tag}:`, error.message);
                    failed++; 
                }
                
                // Delay Dinâmico: Se tiver muita gente, vai devagar (500ms). Se for os teus 2 users, vai rápido (50ms).
                const delayMs = targets.size > 50 ? 500 : 50;
                await sleep(delayMs); 
            }

            // ==========================================
            // 📩 RELATÓRIO FINAL DIRETO NO CHAT
            // ==========================================
            const finalEmbed = new EmbedBuilder()
                .setTitle('✅ Operação em Massa Concluída')
                .setColor(action === 'add' ? 0x57F287 : 0xED4245)
                .setDescription(`Processo de **${action === 'add' ? 'Adição' : 'Remoção'}** do cargo <@&${role.id}> finalizado.`)
                .addFields(
                    { name: 'Membros Processados', value: `\`${targets.size}\``, inline: false },
                    { name: '✅ Sucessos', value: `\`${success}\``, inline: true },
                    { name: '❌ Falhas', value: `\`${failed}\``, inline: true }
                )
                .setTimestamp();

            // Envia no canal avisando o admin, zero risco de falhar por causa de DMs fechadas!
            await interaction.channel.send({ 
                content: `🔔 <@${interaction.user.id}>, o teu comando terminou!`,
                embeds: [finalEmbed]
            }).catch(err => console.error("Erro ao enviar o relatório no chat:", err));

        }, 1000); // Dá 1 segundo e "liberta" o comando principal
    }
};