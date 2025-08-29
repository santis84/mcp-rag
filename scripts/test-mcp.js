#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🧪 Testando MCP RAG Server...\n');

// Função para testar o servidor MCP
function testMCPServer() {
  return new Promise((resolve, reject) => {
    console.log('📡 Iniciando servidor MCP...');
    
    const server = spawn('node', ['dist/index.js'], {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
      console.log('📤 Output:', data.toString().trim());
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.log('❌ Error:', data.toString().trim());
    });

    // Teste básico - enviar uma requisição MCP
    setTimeout(() => {
      console.log('\n🔍 Enviando requisição de teste...');
      
      const testRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      };

      server.stdin.write(JSON.stringify(testRequest) + '\n');
      
      // Aguardar resposta
      setTimeout(() => {
        server.kill();
        
        if (output.includes('tools') || output.includes('add_file')) {
          console.log('✅ Servidor MCP funcionando corretamente!');
          resolve(true);
        } else {
          console.log('❌ Servidor MCP não respondeu corretamente');
          console.log('Output:', output);
          console.log('Error:', errorOutput);
          reject(new Error('MCP server test failed'));
        }
      }, 2000);
    }, 1000);

    server.on('close', (code) => {
      console.log(`\n🔚 Servidor encerrado com código: ${code}`);
    });

    server.on('error', (error) => {
      console.error('❌ Erro ao iniciar servidor:', error);
      reject(error);
    });
  });
}

// Função para testar o script de manutenção
async function testMaintenanceScript() {
  console.log('\n🛠️ Testando script de manutenção...');
  
  return new Promise((resolve, reject) => {
    const maintenance = spawn('node', ['dist/maintenance.js', 'stats'], {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    maintenance.stdout.on('data', (data) => {
      output += data.toString();
    });

    maintenance.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    maintenance.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Script de manutenção funcionando!');
        console.log('📊 Estatísticas:', output.trim());
        resolve(true);
      } else {
        console.log('❌ Script de manutenção falhou');
        console.log('Error:', errorOutput);
        reject(new Error('Maintenance script test failed'));
      }
    });
  });
}

// Executar testes
async function runTests() {
  try {
    console.log('🔨 Compilando projeto...');
    const build = spawn('npm', ['run', 'build'], {
      cwd: projectRoot,
      stdio: 'inherit'
    });

    await new Promise((resolve, reject) => {
      build.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Compilação concluída!\n');
          resolve(true);
        } else {
          reject(new Error('Build failed'));
        }
      });
    });

    // Testar script de manutenção
    await testMaintenanceScript();
    
    // Testar servidor MCP
    await testMCPServer();
    
    console.log('\n🎉 Todos os testes passaram! O MCP RAG está funcionando corretamente.');
    console.log('\n📋 Próximos passos:');
    console.log('1. Configure sua chave do Hugging Face no arquivo .env');
    console.log('2. Configure o MCP no seu editor (Cursor/Claude/VS Code)');
    console.log('3. Use: npm start para iniciar o servidor');
    console.log('4. Use: npm run maintenance para gerenciar arquivos');
    
  } catch (error) {
    console.error('\n❌ Teste falhou:', error.message);
    process.exit(1);
  }
}

runTests();