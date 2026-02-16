require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { loadModules } = require('./core/loader');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates, // Essencial para o Auto-Voice
        GatewayIntentBits.GuildMessages
    ]
});

// Criamos coleções para armazenar tudo na RAM e acessar super rápido
client.commands = new Collection();
client.components = new Collection();

// Chama o nosso motor inteligente que vai ler todas as pastas
loadModules(client);

// Liga a nave!
client.login(process.env.DISCORD_TOKEN);