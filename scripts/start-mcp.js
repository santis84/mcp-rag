#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🚀 Iniciando MCP RAG Server...\n');

// Verificar se o projeto foi compilado
import { existsSync } from 'fs';
const distPath = join(projectRoot, 'dist', 'index.js');

if (!existsSync(distPath)) {
  console.log('🔨 Compilando projeto primeiro...');
  
  const build = spawn('npm', ['run', 'build'], {
    cwd: projectRoot,
    stdio: 'inherit'
  });

  build.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Compilação concluída! Iniciando servidor...\n');
      startServer();
    } else {
      console.error('❌ Falha na compilação');
      process.exit(1);
    }
  });
} else {
  startServer();
}

function startServer() {
  console.log('📡 Iniciando servidor MCP...');
  console.log('💡 Para parar o servidor, pressione Ctrl+C\n');
  
  const server = spawn('node', ['dist/index.js'], {
    cwd: projectRoot,
    stdio: 'inherit'
  });

  server.on('close', (code) => {
    console.log(`\n🔚 Servidor encerrado com código: ${code}`);
  });

  server.on('error', (error) => {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  });

  // Tratar sinais de interrupção
  process.on('SIGINT', () => {
    console.log('\n🛑 Recebido SIGINT, encerrando servidor...');
    server.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Recebido SIGTERM, encerrando servidor...');
    server.kill('SIGTERM');
  });
}