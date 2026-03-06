const { MessageFlags } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        
        try {
            // ==========================================
            // 1. TRAVA CIRÚRGICA (SÓ PARA JOGOS INLINE)
            // ==========================================
            if (interaction.isMessageComponent()) {
                const inlineIds = [
                    'opt1', 'opt2', 'opt3', 'heist_', 'choice_', // Assalto
                    'race_bet_', // Corrida
                    'hap_', // Apostas Cara ou Coroa
                    'prev_help', 'next_help', 'page_indicator', 'help_select_menu' // Paginador de Ajuda
                ];
                
                // Se o ID do botão for um destes de cima, o roteador ignora e deixa o minigame rodar!
                if (inlineIds.some(prefix => interaction.customId.startsWith(prefix))) {
                    return; 
                }
            }

            // ==========================================
            // 2. ROTEADOR DE COMANDOS DE BARRA (/hype, /devpanel)
            // ==========================================
            if (interaction.isChatInputCommand()) {
                const command = client.commands.get(interaction.commandName);
                if (!command) return;

                await command.execute(interaction, client);
            }
            
            // ==========================================
            // 3. ROTEADOR INTELIGENTE DE COMPONENTES V2 E MODALS
            // ==========================================
            else if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
                
                let component = client.components.get(interaction.customId);
                
                if (!component) {
                    const matchingComponents = Array.from(client.components.values()).filter(c => 
                        c.customIdPrefix && interaction.customId.startsWith(c.customIdPrefix)
                    );

                    if (matchingComponents.length > 0) {
                        matchingComponents.sort((a, b) => b.customIdPrefix.length - a.customIdPrefix.length);
                        component = matchingComponents[0]; 
                    }
                }

                if (component) {
                    await component.execute(interaction, client);
                } else {
                    console.warn(`⚠️ [Roteador] Nenhum arquivo foi encontrado para processar o ID: ${interaction.customId}`);
                    
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ 
                            content: '❌ O código deste botão ainda não foi implementado ou não foi carregado.', 
                            flags: [MessageFlags.Ephemeral] 
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
                const payload = { content: '❌ Ocorreu um erro ao processar. Tente novamente.', flags: [MessageFlags.Ephemeral] };
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(payload).catch(() => {});
                } else {
                    await interaction.reply(payload).catch(() => {});
                }
            } catch (e) {}
        }
    }
};