#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { CONFIG, validateConfig } from './config/index.js';
import { RAGService } from './services/ragService.js';
import { logger } from './utils/logger.js';

class MCPRAGServer {
  private server: Server;
  private ragService: RAGService;

  constructor() {
    this.server = new Server({
      name: CONFIG.MCP_SERVER_NAME,
      version: CONFIG.MCP_SERVER_VERSION,
    });

    this.ragService = new RAGService();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'add_file',
            description: 'Add a file to the RAG system for document retrieval',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Path to the file to add to the RAG system',
                },
              },
              required: ['filePath'],
            },
          },
          {
            name: 'search_files',
            description: 'Search for relevant documents in the RAG system',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query to find relevant documents',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return (default: 10)',
                  default: 10,
                },
                threshold: {
                  type: 'number',
                  description: 'Minimum similarity threshold (0-1, default: 0.7)',
                  default: 0.7,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'remove_file',
            description: 'Remove a file from the RAG system',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Path to the file to remove from the RAG system',
                },
              },
              required: ['filePath'],
            },
          },
          {
            name: 'list_files',
            description: 'List all files in the RAG system',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'add_memory',
            description: 'Add information to the agent memory system',
            inputSchema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'Content to store in memory',
                },
                agentId: {
                  type: 'string',
                  description: 'ID of the agent storing the memory',
                },
                sessionId: {
                  type: 'string',
                  description: 'ID of the current session',
                },
                category: {
                  type: 'string',
                  description: 'Category for the memory entry (default: general)',
                  default: 'general',
                },
                importance: {
                  type: 'number',
                  description: 'Importance level 1-10 (default: 1)',
                  default: 1,
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Tags for the memory entry',
                  default: [],
                },
              },
              required: ['content', 'agentId', 'sessionId'],
            },
          },
          {
            name: 'search_memory',
            description: 'Search for relevant information in agent memory',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query to find relevant memory entries',
                },
                agentId: {
                  type: 'string',
                  description: 'Filter by specific agent ID (optional)',
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results to return (default: 10)',
                  default: 10,
                },
                threshold: {
                  type: 'number',
                  description: 'Minimum similarity threshold (0-1, default: 0.7)',
                  default: 0.7,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'remove_memory',
            description: 'Remove a memory entry from the agent memory system',
            inputSchema: {
              type: 'object',
              properties: {
                memoryId: {
                  type: 'string',
                  description: 'ID of the memory entry to remove',
                },
              },
              required: ['memoryId'],
            },
          },
          {
            name: 'get_memory_by_agent',
            description: 'Get all memory entries for a specific agent',
            inputSchema: {
              type: 'object',
              properties: {
                agentId: {
                  type: 'string',
                  description: 'ID of the agent to get memory for',
                },
              },
              required: ['agentId'],
            },
          },
          {
            name: 'get_stats',
            description: 'Get statistics about the RAG system',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'clear_data',
            description: 'Clear data from the RAG system',
            inputSchema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['files', 'memory', 'all'],
                  description: 'Type of data to clear',
                },
              },
              required: ['type'],
            },
          },
          {
            name: 'test_connection',
            description: 'Test the connection to the embedding service',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'add_file':
            return await this.handleAddFile(args as { filePath: string });

          case 'search_files':
            return await this.handleSearchFiles(args as {
              query: string;
              limit?: number;
              threshold?: number;
            });

          case 'remove_file':
            return await this.handleRemoveFile(args as { filePath: string });

          case 'list_files':
            return await this.handleListFiles();

          case 'add_memory':
            return await this.handleAddMemory(args as {
              content: string;
              agentId: string;
              sessionId: string;
              category?: string;
              importance?: number;
              tags?: string[];
            });

          case 'search_memory':
            return await this.handleSearchMemory(args as {
              query: string;
              agentId?: string;
              limit?: number;
              threshold?: number;
            });

          case 'remove_memory':
            return await this.handleRemoveMemory(args as { memoryId: string });

          case 'get_memory_by_agent':
            return await this.handleGetMemoryByAgent(args as { agentId: string });

          case 'get_stats':
            return await this.handleGetStats();

          case 'clear_data':
            return await this.handleClearData(args as { type: 'files' | 'memory' | 'all' });

          case 'test_connection':
            return await this.handleTestConnection();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error(`Error handling tool ${name}: ${error}`);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error}`,
            },
          ],
        };
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'rag://stats',
            name: 'RAG Statistics',
            description: 'Current statistics of the RAG system',
            mimeType: 'application/json',
          },
        ],
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      if (uri === 'rag://stats') {
        const stats = await this.ragService.getStats();
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      }

      throw new Error(`Unknown resource: ${uri}`);
    });
  }

  // Tool handlers
  private async handleAddFile(args: { filePath: string }) {
    const result = await this.ragService.addFile(args.filePath);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleSearchFiles(args: {
    query: string;
    limit?: number;
    threshold?: number;
  }) {
          const results = await this.ragService.searchFiles(args.query, {
        limit: args.limit || 10,
        threshold: args.threshold || 0.7,
      });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  private async handleRemoveFile(args: { filePath: string }) {
    const result = await this.ragService.removeFile(args.filePath);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleListFiles() {
    const files = await this.ragService.listFiles();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(files, null, 2),
        },
      ],
    };
  }

  private async handleAddMemory(args: {
    content: string;
    agentId: string;
    sessionId: string;
    category?: string;
    importance?: number;
    tags?: string[];
  }) {
    const result = await this.ragService.addMemory(
      args.content,
      args.agentId,
      args.sessionId,
      args.category,
      args.importance,
      args.tags
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleSearchMemory(args: {
    query: string;
    agentId?: string;
    limit?: number;
    threshold?: number;
  }) {
          const results = await this.ragService.searchMemory(args.query, args.agentId, {
        limit: args.limit || 10,
        threshold: args.threshold || 0.7,
      });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  private async handleRemoveMemory(args: { memoryId: string }) {
    const result = await this.ragService.removeMemory(args.memoryId);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleGetMemoryByAgent(args: { agentId: string }) {
    const results = await this.ragService.getMemoryByAgent(args.agentId);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  private async handleGetStats() {
    const stats = await this.ragService.getStats();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }

  private async handleClearData(args: { type: 'files' | 'memory' | 'all' }) {
    const result = await this.ragService.clearData(args.type);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async handleTestConnection() {
    const isConnected = await this.ragService.testEmbeddingService();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ connected: isConnected }, null, 2),
        },
      ],
    };
  }

  async start(): Promise<void> {
    try {
      // Validate configuration
      validateConfig();

      // Initialize RAG service
      await this.ragService.initialize();

      // Create transport
      const transport = new StdioServerTransport();

      // Start server
      await this.server.connect(transport);

      logger.info(`MCP RAG Server started successfully`);
      logger.info(`Server: ${CONFIG.MCP_SERVER_NAME} v${CONFIG.MCP_SERVER_VERSION}`);
    } catch (error) {
      logger.error(`Failed to start MCP RAG Server: ${error}`);
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    try {
      await this.ragService.close();
      logger.info('MCP RAG Server stopped');
    } catch (error) {
      logger.error(`Error stopping server: ${error}`);
    }
  }
}

// Start the server
async function main() {
  const server = new MCPRAGServer();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  await server.start();
}

// Run the server
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error(`Unhandled error: ${error}`);
    process.exit(1);
  });
}