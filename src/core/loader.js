const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

async function loadModules(client) {
    const modulesPath = path.join(__dirname, '../modules');
    
    // Se a pasta modules não existir, não quebra o bot
    if (!fs.existsSync(modulesPath)) return;
    
    const modules = fs.readdirSync(modulesPath);
    const slashCommands = [];

    console.log('🔄 Iniciando leitura dos módulos...');

    for (const moduleFolder of modules) {
        const modulePath = path.join(modulesPath, moduleFolder);
        
        // 1️⃣ Carregar Comandos (/hype, etc)
        const commandsPath = path.join(modulePath, 'commands');
        if (fs.existsSync(commandsPath)) {
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const command = require(path.join(commandsPath, file));
                client.commands.set(command.data.name, command);
                slashCommands.push(command.data.toJSON());
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
                const component = require(path.join(componentsPath, file));
                // A chave de busca será o customId (ex: 'autovoice_lock')
                client.components.set(component.customId, component);
            }
        }
    }

    // 🔥 Registrar os comandos na API do Discord quando o bot ficar online
    client.once('ready', async () => {
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