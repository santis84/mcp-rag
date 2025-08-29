# MCP RAG

Um servidor MCP (Model Context Protocol) completo para RAG (Retrieval-Augmented Generation) com gerenciamento de arquivos e memória vetorial para agentes.

## 🚀 Características

- **📄 Gerenciamento de Arquivos**: Adicione, remova e pesquise documentos em diversos formatos (PDF, DOCX, TXT, MD, CSV, JSON)
- **🧠 Memória Vetorial**: Sistema separado para que agentes armazenem informações importantes para uso futuro
- **🔍 Busca Semântica**: Utiliza embeddings do Hugging Face para busca semântica avançada
- **💾 Banco Vetorial Local**: ChromaDB local para armazenamento eficiente de vetores e metadados
- **🛠️ Script de Manutenção**: CLI completo para gerenciamento e manutenção do sistema
- **📚 Documentação Completa**: HTML para GitHub Pages com guias de configuração

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Chave da API do Hugging Face

## 🛠️ Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/mcp-rag.git
   cd mcp-rag
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` e configure sua chave da API do Hugging Face:
   ```env
   HUGGINGFACE_API_KEY=sua_chave_aqui
   ```

4. **Compile o projeto**
   ```bash
   npm run build
   ```

## 🔧 Configuração

### Cursor

Adicione a seguinte configuração no arquivo de configurações do MCP:

```json
{
  "mcpServers": {
    "mcp-rag": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/caminho/para/mcp-rag"
    }
  }
}
```

### Claude Desktop

Adicione a configuração no arquivo `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-rag": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/caminho/para/mcp-rag"
    }
  }
}
```

### VS Code

Configure no `settings.json`:

```json
{
  "mcp.servers": {
    "mcp-rag": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/caminho/para/mcp-rag"
    }
  }
}
```

## 🛠️ Script de Manutenção

O projeto inclui um CLI completo para manutenção:

```bash
# Adicionar arquivo
npm run maintenance add-file /caminho/para/arquivo.pdf

# Adicionar diretório
npm run maintenance add-dir /caminho/para/diretorio

# Buscar arquivos
npm run maintenance search-files "sua consulta"

# Listar arquivos
npm run maintenance list-files

# Gerenciar memória
npm run maintenance add-memory "conteúdo" "agent-id" "session-id"
npm run maintenance search-memory "sua consulta"

# Ver estatísticas
npm run maintenance stats

# Limpar dados
npm run maintenance clear all
```

## 🔍 Ferramentas MCP Disponíveis

### Gerenciamento de Arquivos
- `add_file`: Adiciona um arquivo ao sistema RAG
- `search_files`: Busca documentos relevantes
- `remove_file`: Remove um arquivo do sistema
- `list_files`: Lista todos os arquivos no sistema

### Gerenciamento de Memória
- `add_memory`: Adiciona informação à memória do agente
- `search_memory`: Busca na memória do agente
- `remove_memory`: Remove uma entrada da memória
- `get_memory_by_agent`: Obtém toda a memória de um agente

### Utilitários
- `get_stats`: Obtém estatísticas do sistema
- `clear_data`: Limpa dados do sistema
- `test_connection`: Testa a conexão com o serviço de embeddings

## 📊 Formatos Suportados

- **PDF**: Documentos PDF com texto extraível
- **DOCX**: Documentos do Microsoft Word
- **TXT**: Arquivos de texto simples
- **MD**: Arquivos Markdown
- **CSV**: Arquivos de dados separados por vírgula
- **JSON**: Arquivos de dados JSON

## ⚙️ Configurações

### Variáveis de Ambiente

```env
# MCP Configuration
MCP_SERVER_NAME=mcp-rag
MCP_SERVER_VERSION=1.0.0

# Hugging Face Configuration
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
HUGGINGFACE_MODEL=sentence-transformers/all-MiniLM-L6-v2

# ChromaDB Configuration
CHROMA_PERSIST_DIRECTORY=./data/chroma
CHROMA_COLLECTION_FILES=rag_files
CHROMA_COLLECTION_MEMORY=agent_memory

# File Processing Configuration
MAX_FILE_SIZE_MB=50
SUPPORTED_EXTENSIONS=.pdf,.docx,.txt,.md,.csv,.json

# Vector Configuration
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
EMBEDDING_DIMENSION=384

# Logging
LOG_LEVEL=info
```

## 🚀 Uso

### Iniciando o Servidor

```bash
npm start
```

### Desenvolvimento

```bash
npm run dev
```

### Testes

```bash
npm test
```

## 📚 Documentação

A documentação completa está disponível em HTML para GitHub Pages em `docs/index.html`. Ela inclui:

- Guias de instalação e configuração
- Instruções para Cursor, Claude Desktop e VS Code
- Exemplos de uso
- Solução de problemas
- Referência completa das ferramentas

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙏 Agradecimentos

- [Model Context Protocol](https://github.com/modelcontextprotocol) - Protocolo base
- [Hugging Face](https://huggingface.co/) - Serviço de embeddings
- [ChromaDB](https://www.trychroma.com/) - Banco de dados vetorial
- [Anthropic](https://www.anthropic.com/) - Claude e MCP

## 📞 Suporte

Se você encontrar problemas ou tiver dúvidas:

1. Verifique a [documentação HTML](docs/index.html)
2. Abra uma [issue](https://github.com/seu-usuario/mcp-rag/issues)
3. Consulte a seção de solução de problemas na documentação

---

Desenvolvido com ❤️ para a comunidade de IA