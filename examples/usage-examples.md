# Exemplos de Uso do MCP RAG

Este arquivo contém exemplos práticos de como usar o MCP RAG em diferentes cenários.

## 📄 Gerenciamento de Documentos

### Adicionando um Documento

```bash
# Via CLI
npm run maintenance add-file ./documentos/manual-usuario.pdf

# Via MCP (no Cursor/Claude)
# Use a ferramenta add_file com o caminho do arquivo
```

### Buscando Informações em Documentos

```bash
# Via CLI
npm run maintenance search-files "como configurar o sistema de backup"

# Via MCP
# Use a ferramenta search_files com sua consulta
```

### Listando Documentos

```bash
# Via CLI
npm run maintenance list-files

# Via MCP
# Use a ferramenta list_files
```

## 🧠 Gerenciamento de Memória do Agente

### Armazenando Informações Importantes

```bash
# Via CLI
npm run maintenance add-memory "O usuário prefere Python para automação" "agent-001" "session-123" "preferences" 8 "python,automation"

# Via MCP
# Use a ferramenta add_memory com os parâmetros:
# - content: "O usuário prefere Python para automação"
# - agentId: "agent-001"
# - sessionId: "session-123"
# - category: "preferences"
# - importance: 8
# - tags: ["python", "automation"]
```

### Buscando na Memória

```bash
# Via CLI - Busca geral
npm run maintenance search-memory "preferências do usuário"

# Via CLI - Busca por agente específico
npm run maintenance search-memory "automação" --agent agent-001

# Via MCP
# Use a ferramenta search_memory com query e opcionalmente agentId
```

### Obtendo Memória de um Agente

```bash
# Via CLI
npm run maintenance get-memory agent-001

# Via MCP
# Use a ferramenta get_memory_by_agent com o agentId
```

## 🔧 Cenários de Uso Práticos

### Cenário 1: Assistente de Documentação

```bash
# 1. Adicionar documentação da empresa
npm run maintenance add-dir ./documentacao-empresa/

# 2. Buscar informações sobre políticas
npm run maintenance search-files "política de férias"

# 3. Armazenar preferências do usuário
npm run maintenance add-memory "Usuário trabalha no departamento de TI" "assistant-001" "session-456" "user-info" 9 "department,IT"
```

### Cenário 2: Agente de Suporte Técnico

```bash
# 1. Adicionar manuais técnicos
npm run maintenance add-file ./manuais/manual-servidor.pdf

# 2. Buscar soluções para problemas
npm run maintenance search-files "erro de conexão banco de dados"

# 3. Armazenar histórico de problemas resolvidos
npm run maintenance add-memory "Problema de conexão DB resolvido reiniciando serviço MySQL" "support-001" "session-789" "solutions" 7 "database,mysql,connection"
```

### Cenário 3: Agente de Pesquisa

```bash
# 1. Adicionar artigos de pesquisa
npm run maintenance add-dir ./artigos-pesquisa/

# 2. Buscar informações específicas
npm run maintenance search-files "machine learning aplicado em medicina"

# 3. Armazenar descobertas importantes
npm run maintenance add-memory "Algoritmo X mostrou 95% de precisão em diagnóstico de câncer" "research-001" "session-101" "findings" 10 "ml,medicine,cancer,algorithm"
```

## 📊 Monitoramento e Estatísticas

### Verificando Estatísticas do Sistema

```bash
# Via CLI
npm run maintenance stats

# Via MCP
# Use a ferramenta get_stats
```

### Testando Conexão

```bash
# Via CLI
npm run maintenance test-connection

# Via MCP
# Use a ferramenta test_connection
```

## 🗑️ Limpeza e Manutenção

### Limpando Dados

```bash
# Limpar apenas arquivos
npm run maintenance clear files

# Limpar apenas memória
npm run maintenance clear memory

# Limpar tudo
npm run maintenance clear all
```

### Removendo Arquivos Específicos

```bash
# Via CLI
npm run maintenance remove-file ./documentos/arquivo-antigo.pdf

# Via MCP
# Use a ferramenta remove_file com o caminho do arquivo
```

### Removendo Memória Específica

```bash
# Via CLI
npm run maintenance remove-memory "memory-id-123"

# Via MCP
# Use a ferramenta remove_memory com o ID da memória
```

## 🔍 Dicas de Busca

### Busca Eficiente

1. **Use termos específicos**: Em vez de "problema", use "erro de conexão"
2. **Combine palavras-chave**: "Python automação script"
3. **Use sinônimos**: "configuração" ou "setup"
4. **Ajuste o threshold**: Para resultados mais precisos, use threshold 0.8

### Exemplos de Consultas

```bash
# Busca específica
npm run maintenance search-files "configuração do servidor Apache" --limit 5

# Busca com threshold alto
npm run maintenance search-files "erro 500" --limit 3

# Busca na memória por categoria
npm run maintenance search-memory "soluções" --agent support-001
```

## 🚀 Integração com Agentes

### Exemplo de Integração com Claude

```javascript
// Exemplo de como um agente pode usar o MCP RAG
async function searchDocumentation(query) {
  // Usar a ferramenta search_files do MCP
  const results = await mcpClient.callTool('search_files', {
    query: query,
    limit: 5,
    threshold: 0.7
  });
  
  return results;
}

async function storeImportantInfo(content, agentId, sessionId) {
  // Usar a ferramenta add_memory do MCP
  const result = await mcpClient.callTool('add_memory', {
    content: content,
    agentId: agentId,
    sessionId: sessionId,
    category: 'important',
    importance: 8,
    tags: ['important', 'user-preference']
  });
  
  return result;
}
```

## 📝 Logs e Debugging

### Verificando Logs

```bash
# Logs do servidor MCP
npm start

# Logs do script de manutenção
npm run maintenance stats
```

### Solução de Problemas Comuns

1. **Erro de API Key**: Verifique se `HUGGINGFACE_API_KEY` está configurada
2. **Arquivo não suportado**: Verifique se a extensão está em `SUPPORTED_EXTENSIONS`
3. **Arquivo muito grande**: Ajuste `MAX_FILE_SIZE_MB` se necessário
4. **Rate limit**: Aguarde alguns minutos antes de tentar novamente