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
                
                // Tenta achar o arquivo do componente pelo ID exato
                let component = client.components.get(interaction.customId);
                
                // Se não achar um ID exato, procura por componentes dinâmicos (Prefixos)
                if (!component) {
                    // 👇 A MÁGICA ESTÁ AQUI 👇
                    // Pega TODOS os componentes cujo prefixo bate com o ID do botão
                    const matchingComponents = Array.from(client.components.values()).filter(c => 
                        c.customIdPrefix && interaction.customId.startsWith(c.customIdPrefix)
                    );

                    if (matchingComponents.length > 0) {
                        // Ordena pelo tamanho do prefixo (do MAIOR para o MENOR)
                        // Assim, 'dev_config_vip_finance_' vence de 'dev_'
                        matchingComponents.sort((a, b) => b.customIdPrefix.length - a.customIdPrefix.length);
                        component = matchingComponents[0]; // Pega o mais específico!
                    }
                }

                // Se o componente existir, executa!
                if (component) {
                    await component.execute(interaction, client);
                } else {
                    // ⚠️ SE NÃO ACHAR O ARQUIVO, AGORA ELE AVISA VOCÊ E O LOG!
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