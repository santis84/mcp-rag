# 🚀 Guia Rápido - MCP RAG

## Inicialização Local

### 1. **Configuração Inicial**
```bash
# Clone e instale
git clone <seu-repositorio>
cd mcp-rag
npm install

# Configure a chave do Hugging Face
cp .env.example .env
# Edite o .env e adicione sua HUGGINGFACE_API_KEY
```

### 2. **Iniciar o MCP Server**

#### Opção A: Script Automático (Recomendado)
```bash
npm run start:mcp
```

#### Opção B: Manual
```bash
npm run build
npm start
```

#### Opção C: Modo Desenvolvimento
```bash
npm run dev
```

### 3. **Testar o MCP**
```bash
# Teste completo
npm run test:mcp

# Teste apenas o script de manutenção
npm run maintenance stats
```

## 🔧 Configuração no Editor

### Cursor
1. Abra as configurações do MCP
2. Adicione:
```json
{
  "mcpServers": {
    "mcp-rag": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/caminho/completo/para/mcp-rag"
    }
  }
}
```

### Claude Desktop
1. Edite `claude_desktop_config.json`
2. Adicione a mesma configuração acima

## 🛠️ Comandos Úteis

```bash
# Adicionar arquivo
npm run maintenance add-file documento.pdf

# Buscar arquivos
npm run maintenance search-files "sua consulta"

# Adicionar memória
npm run maintenance add-memory "info importante" "agent-001" "session-123"

# Ver estatísticas
npm run maintenance stats

# Limpar dados
npm run maintenance clear all
```

## 🐛 Solução de Problemas

### Erro: "HUGGINGFACE_API_KEY is required"
- Verifique se o arquivo `.env` existe e tem a chave configurada

### Erro: "Cannot find module"
- Execute `npm run build` primeiro

### Servidor não inicia
- Verifique se a porta não está em uso
- Verifique os logs de erro

### MCP não aparece no editor
- Verifique o caminho no arquivo de configuração
- Reinicie o editor após configurar
- Verifique se o servidor está rodando

## 📞 Ajuda

- Documentação completa: `docs/index.html`
- Exemplos: `examples/usage-examples.md`
- Issues: [GitHub Issues](https://github.com/seu-usuario/mcp-rag/issues)