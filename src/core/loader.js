const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

async function loadModules(client) {
    const modulesPath = path.join(__dirname, '../modules');
    
    if (!fs.existsSync(modulesPath)) return;
    
    const modules = fs.readdirSync(modulesPath);
    const slashCommands = [];

    console.log('🔄 Iniciando leitura dos módulos...');

    for (const moduleFolder of modules) {
        const modulePath = path.join(modulesPath, moduleFolder);
        
        // 1️⃣ Carregar Comandos (/hype, /ranking, etc)
        const commandsPath = path.join(modulePath, 'commands');
        if (fs.existsSync(commandsPath)) {
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                try {
                    const command = require(filePath);

                    // 🛡️ BLINDAGEM: Verifica se é um comando válido antes de carregar
                    if (command && command.data && command.data.name) {
                        client.commands.set(command.data.name, command);
                        slashCommands.push(command.data.toJSON());
                    } else {
                        console.warn(`⚠️ [Loader] O arquivo '${file}' em '${moduleFolder}' foi ignorado pois não possui estrutura de comando (data.name). Verifique se não é um componente.`);
                    }
                } catch (error) {
                    console.error(`❌ [Loader] Erro ao carregar o comando '${file}':`, error);
                }
            }
        }

        // 2️⃣ Carregar Eventos (voiceStateUpdate, interactionCreate)
        const eventsPath = path.join(modulePath, 'events');
        if (fs.existsSync(eventsPath)) {
            const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
            for (const file of eventFiles) {
                const event = require(path.join(eventsPath, file));
                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args, client));
                } else {
                    client.on(event.name, (...args) => event.execute(...args, client));
                }
            }
        }

        // 3️⃣ Carregar Componentes V2 (Botões, Menus, Modals)
        const componentsPath = path.join(modulePath, 'components');
        if (fs.existsSync(componentsPath)) {
            const componentFiles = fs.readdirSync(componentsPath).filter(file => file.endsWith('.js'));
            for (const file of componentFiles) {
                try {
                    const component = require(path.join(componentsPath, file));
                    
                    // 👇 A CORREÇÃO ESTÁ AQUI: Agora aceita customId ou customIdPrefix
                    if (component.customId) {
                        client.components.set(component.customId, component);
                    } else if (component.customIdPrefix) {
                        client.components.set(component.customIdPrefix, component);
                    }
                    
                } catch (error) {
                    console.error(`❌ [Loader] Erro ao carregar componente '${file}':`, error);
                }
            }
        }
    }

    // 🔥 Registrar os comandos na API do Discord
    client.once('clientReady', async () => {
        console.log(`🤖 Nave online! Logado como ${client.user.tag}`);
        
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        
        try {
            if (process.env.GUILD_TEST_ID) {
                await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_TEST_ID),
                    { body: slashCommands }
                );
                console.log(`🛠️  Comandos registrados instantaneamente na Guilda de Testes.`);
            } else {
                await rest.put(
                    Routes.applicationCommands(process.env.CLIENT_ID),
                    { body: slashCommands }
                );
                console.log('🌍 Comandos registrados GLOBALMENTE.');
            }
        } catch (error) {
            console.error('❌ Erro ao registrar comandos:', error);
        }
    });
}

module.exports = { loadModules };