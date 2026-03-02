require('dotenv').config();
const { execSync } = require('child_process');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

// ==========================================
// 🛡️ AUTO-MIGRATION (Blindagem da Host/Discloud)
// ==========================================
// Este bloco força a criação/atualização do Client Prisma
// ANTES de carregar qualquer ficheiro que use a base de dados.
console.log('⏳ [SaaS] Sincronizando tabelas do PostgreSQL via Prisma...');
try {
    // 1. Primeiro geramos o client (Isto resolve o erro que acabaste de ter)
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // 2. Depois fazemos o push das tabelas
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('✅ [SaaS] Banco de dados atualizado e sincronizado!');
} catch (error) {
    console.error('❌ [ERRO FATAL] Falha ao sincronizar o Banco de Dados.');
    console.error('Verifique se a DATABASE_URL no seu .env está correta.');
    process.exit(1); 
}

// 👇 IMPORTANTE: Os imports que usam a BD vêm DEPOIS do bloco acima!
const { loadModules } = require('./core/loader');
const vipChecker = require('./utils/vipChecker');

// ==========================================
// 🤖 INICIALIZAÇÃO DA NAVE
// ==========================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

// Coleções para acesso rápido via RAM
client.commands = new Collection();
client.components = new Collection();

// Chama o motor inteligente e o cron job
console.log('🔄 [Core] Carregando módulos e componentes...');
loadModules(client);
vipChecker(client);

// ==========================================
// 🛡️ SISTEMA ANTI-CRASH SUPREMO
// ==========================================
process.on('unhandledRejection', (reason, promise) => {
    console.log('🚨 [ANTI-CRASH] Uma Promessa foi rejeitada sem tratamento:');
    console.log(reason);
});

process.on('uncaughtException', (error, origin) => {
    console.log('🚨 [ANTI-CRASH] Erro crítico detetado:');
    console.log(error);
});

process.on('uncaughtExceptionMonitor', (error, origin) => {
    console.log('🚨 [ANTI-CRASH] Erro crítico no Monitor:');
    console.log(error);
});

client.on('error', (error) => {
    console.log('🔌 [ANTI-CRASH] Erro na conexão do Discord:');
    console.log(error);
});

client.on('warn', (info) => {
    console.log('⚠️ [AVISO]:', info);
});

// Liga o motor!
client.login(process.env.DISCORD_TOKEN).then(() => {
    console.log('🚀 [Koda Studios] Nave online e pronta para escalar!');
});