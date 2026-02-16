require('dotenv').config();
const { execSync } = require('child_process');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { loadModules } = require('./core/loader');

// ==========================================
// 🛡️ AUTO-MIGRATION (Blindagem da Host/Discloud)
// ==========================================
// Este bloco força a criação/atualização das tabelas no PostgreSQL
// antes de carregar qualquer módulo do bot.
console.log('⏳ [SaaS] Sincronizando tabelas do PostgreSQL via Prisma...');
try {
    // stdio: 'inherit' faz com que os logs do Prisma apareçam no seu console da Discloud
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ [SaaS] Banco de dados atualizado e sincronizado!');
} catch (error) {
    console.error('❌ [ERRO FATAL] Falha ao sincronizar o Banco de Dados.');
    console.error('Verifique se a DATABASE_URL no seu .env está correta.');
    // Se o banco falhar, não adianta ligar o bot, ele vai crashar nos módulos.
    process.exit(1); 
}

// ==========================================
// 🤖 INICIALIZAÇÃO DA NAVE
// ==========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates, // Essencial para o Auto-Voice
        GatewayIntentBits.GuildMessages
    ]
});

// Coleções para acesso rápido via RAM (Comandos, Botões, Menus, Modals)
client.commands = new Collection();
client.components = new Collection();

// Chama o motor inteligente que lê as pastas de módulos
console.log('🔄 [Core] Carregando módulos e componentes...');
loadModules(client);

// Liga o motor!
client.login(process.env.DISCORD_TOKEN).then(() => {
    console.log('🚀 [Koda Studios] Nave online e pronta para escalar!');
});