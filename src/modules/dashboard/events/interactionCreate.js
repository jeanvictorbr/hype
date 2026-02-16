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
            // 2. ROTEADOR DE COMPONENTES V2 E MODALS
            // ==========================================
            else if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
                
                // Tenta achar o arquivo do componente pelo ID exato
                let component = client.components.get(interaction.customId);
                
                // Se não achar um ID exato, procura por componentes dinâmicos (Prefixos)
                // Exemplo: 'dev_inject_feature_123' ou 'ticket_open_select'
                if (!component) {
                    component = client.components.find(c => 
                        c.customIdPrefix && interaction.customId.startsWith(c.customIdPrefix)
                    );
                }

                // Se o componente existir, executa
                if (component) {
                    await component.execute(interaction, client);
                }
            }

        } catch (error) {
            // ==========================================
            // 🛡️ BLINDAGEM ANTI-CRASH (AIRBAG)
            // ==========================================
            
            // Lista de códigos de erro que devemos ignorar (são erros de rede/tempo do Discord)
            const ignoreCodes = [
                10062, // Unknown interaction (Tempo esgotado / Já respondido)
                40060, // Interaction has already been acknowledged
                50035  // Invalid Form Body (Erro de validação interna)
            ];

            // Se for um desses erros, apenas ignoramos para não sujar o terminal
            if (ignoreCodes.includes(error.code)) {
                // console.warn(`⚠️ [Anti-Crash] Ignorando erro de interação expirada (${interaction.customId})`);
                return;
            }

            // Se for um erro real de código, logamos o erro completo
            console.error(`❌ Erro grave na interação ${interaction.customId || interaction.commandName}:`, error);
            
            // Tenta avisar o usuário amigavelmente se a interação ainda estiver viva
            try {
                const payload = { content: '❌ Ocorreu um erro ao processar. Tente novamente.', ephemeral: true };
                
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(payload).catch(() => {});
                } else {
                    await interaction.reply(payload).catch(() => {});
                }
            } catch (e) { 
                // Se falhar o aviso, não faz nada (usuário já deve ter percebido o erro)
            }
        }
    }
};