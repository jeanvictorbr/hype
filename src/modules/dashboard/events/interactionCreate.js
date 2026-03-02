module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        
        try {
            // ==========================================
            // 1. ROTEADOR DE COMANDOS DE BARRA (/hype, /devpanel)
            // ==========================================
            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) return;

                await command.execute(interaction, client);
            }
            
            // ==========================================
            // 2. ROTEADOR INTELIGENTE DE COMPONENTES V2 E MODALS
            // ==========================================
            else if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
                
                // 👇 LISTA DE BLOQUEIO (IGNORAR COMPONENTES PROCESSADOS INLINE) 👇
                // Se o ID do botão for da ajuda ou das apostas, este roteador ignora e sai.
                // Isso evita o erro de "Unknown interaction" e conflitos com o messageCreate.
                if (interaction.customId) {
                    const inlineIds = ['hap_', 'next_help', 'prev_help', 'page_indicator','roleta_', 'rank_'];
                    if (inlineIds.some(id => interaction.customId.startsWith(id))) {
                        return; // Aborta silenciosamente e deixa o messageCreate trabalhar
                    }
                }

                // Tenta achar o arquivo do componente pelo ID exato
                let component = client.components.get(interaction.customId);
                
                // Se não achar um ID exato, procura por componentes dinâmicos (Prefixos)
                if (!component) {
                    const matchingComponents = Array.from(client.components.values()).filter(c => 
                        c.customIdPrefix && interaction.customId.startsWith(c.customIdPrefix)
                    );

                    if (matchingComponents.length > 0) {
                        // Ordena pelo tamanho do prefixo (do MAIOR para o MENOR)
                        matchingComponents.sort((a, b) => b.customIdPrefix.length - a.customIdPrefix.length);
                        component = matchingComponents[0]; 
                    }
                }

                // Se o componente existir, executa!
                if (component) {
                    await component.execute(interaction, client);
                } else {
                    // Log apenas para IDs que realmente deveriam ter um arquivo e não têm
                    console.warn(`⚠️ [Roteador] Nenhum arquivo foi encontrado para processar o ID: ${interaction.customId}`);
                    
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ 
                            content: '❌ O código deste botão ainda não foi implementado ou não foi carregado.', 
                            ephemeral: true 
                        }).catch(() => {});
                    }
                }
            }

        } catch (error) {
            // ==========================================
            // 🛡️ BLINDAGEM ANTI-CRASH (AIRBAG)
            // ==========================================
            const ignoreCodes = [ 10062, 40060, 50035 ];

            if (ignoreCodes.includes(error.code)) {
                return; // Ignora erros de delay do Discord
            }

            console.error(`❌ Erro grave na interação ${interaction.customId || interaction.commandName}:`, error);
            
            try {
                const payload = { content: '❌ Ocorreu um erro ao processar. Tente novamente.', ephemeral: true };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(payload).catch(() => {});
                } else {
                    await interaction.reply(payload).catch(() => {});
                }
            } catch (e) {}
        }
    }
};