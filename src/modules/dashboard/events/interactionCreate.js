module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        
        // ==========================================
        // 1. ROTEADOR DE COMANDOS DE BARRA (/hype, /devpanel)
        // ==========================================
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(`❌ Erro ao executar comando ${interaction.commandName}:`, error);
                
                // Evita crash se a interação já tiver sido respondida ou expirado
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: '❌ Ocorreu um erro interno ao executar este comando.', 
                        ephemeral: true 
                    });
                }
            }
        }
        
        // ==========================================
        // 2. ROTEADOR DE COMPONENTES V2 E MODALS
        // ==========================================
        else if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
            
            // Tenta achar o arquivo do componente pelo ID exato
            let component = client.components.get(interaction.customId);
            
            // Se não achar um ID exato, procura por componentes dinâmicos (Prefixos)
            // Exemplo: O nosso 'dev_inject_feature_123456789'
            if (!component) {
                component = client.components.find(c => 
                    c.customIdPrefix && interaction.customId.startsWith(c.customIdPrefix)
                );
            }

            // Se o botão não existir no nosso código, ignora
            if (!component) return;

            try {
                // Roteia a execução direto para o arquivo correto
                await component.execute(interaction, client);
            } catch (error) {
                console.error(`❌ Erro no componente ${interaction.customId}:`, error);
                
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
                        content: '❌ Erro ao processar essa ação na interface.', 
                        ephemeral: true 
                    });
                }
            }
        }
    }
};