#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { RAGService } from './services/ragService.js';
import { FileProcessor } from './utils/fileProcessor.js';
import { CONFIG } from './config/index.js';
import { logger } from './utils/logger.js';

class MaintenanceCLI {
  private ragService: RAGService;
  private fileProcessor: FileProcessor;

  constructor() {
    this.ragService = new RAGService();
    this.fileProcessor = new FileProcessor();
  }

  async initialize(): Promise<void> {
    try {
      await this.ragService.initialize();
      logger.info('Maintenance CLI initialized');
    } catch (error) {
      logger.error(`Failed to initialize maintenance CLI: ${error}`);
      throw error;
    }
  }

  async addFile(filePath: string): Promise<void> {
    try {
      console.log(`Adding file: ${filePath}`);
      
      if (!await fs.pathExists(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const result = await this.ragService.addFile(filePath);
      
      if (result.success) {
        console.log(`✅ File added successfully: ${result.chunks} chunks created`);
      } else {
        console.log(`❌ Failed to add file: ${result.message}`);
        process.exit(1);
      }
    } catch (error) {
      console.log(`❌ Error adding file: ${error}`);
      process.exit(1);
    }
  }

  async addDirectory(dirPath: string): Promise<void> {
    try {
      console.log(`Adding directory: ${dirPath}`);
      
      if (!await fs.pathExists(dirPath)) {
        throw new Error(`Directory not found: ${dirPath}`);
      }

      const files = await this.fileProcessor.listFiles(dirPath);
      let successCount = 0;
      let errorCount = 0;

      for (const file of files) {
        try {
          console.log(`Processing: ${file.filename}`);
          const result = await this.ragService.addFile(file.path);
          
          if (result.success) {
            console.log(`  ✅ Added: ${result.chunks} chunks`);
            successCount++;
          } else {
            console.log(`  ❌ Failed: ${result.message}`);
            errorCount++;
          }
        } catch (error) {
          console.log(`  ❌ Error: ${error}`);
          errorCount++;
        }
      }

      console.log(`\n📊 Summary:`);
      console.log(`  ✅ Successfully added: ${successCount} files`);
      console.log(`  ❌ Failed: ${errorCount} files`);
    } catch (error) {
      console.log(`❌ Error adding directory: ${error}`);
      process.exit(1);
    }
  }

  async removeFile(filePath: string): Promise<void> {
    try {
      console.log(`Removing file: ${filePath}`);
      
      const result = await this.ragService.removeFile(filePath);
      
      if (result.success) {
        console.log(`✅ File removed successfully`);
      } else {
        console.log(`❌ Failed to remove file: ${result.message}`);
        process.exit(1);
      }
    } catch (error) {
      console.log(`❌ Error removing file: ${error}`);
      process.exit(1);
    }
  }

  async listFiles(): Promise<void> {
    try {
      console.log('📁 Files in RAG system:');
      
      const files = await this.ragService.listFiles();
      
      if (files.length === 0) {
        console.log('  No files found');
        return;
      }

      files.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.filename}`);
        console.log(`     Path: ${file.path}`);
        console.log(`     Size: ${(file.size / 1024).toFixed(2)} KB`);
        console.log(`     Type: ${file.type}`);
        console.log(`     Modified: ${file.lastModified.toISOString()}`);
        console.log(`     Chunks: ${file.chunks}`);
        console.log('');
      });
    } catch (error) {
      console.log(`❌ Error listing files: ${error}`);
      process.exit(1);
    }
  }

  async searchFiles(query: string, limit: number = 10): Promise<void> {
    try {
      console.log(`🔍 Searching files with query: "${query}"`);
      
      const results = await this.ragService.searchFiles(query, { limit });
      
      if (results.length === 0) {
        console.log('  No results found');
        return;
      }

      results.forEach((result, index) => {
        console.log(`  ${index + 1}. Score: ${result.score.toFixed(3)}`);
        console.log(`     File: ${result.metadata.filename}`);
        console.log(`     Content: ${result.content.substring(0, 200)}...`);
        console.log('');
      });
    } catch (error) {
      console.log(`❌ Error searching files: ${error}`);
      process.exit(1);
    }
  }

  async getStats(): Promise<void> {
    try {
      console.log('📊 RAG System Statistics:');
      
      const stats = await this.ragService.getStats();
      
      console.log(`  Documents: ${stats.documents}`);
      console.log(`  Memory entries: ${stats.memory}`);
      console.log(`  Total entries: ${stats.total}`);
      
      // Test embedding service
      console.log('\n🔗 Service Status:');
      const isConnected = await this.ragService.testEmbeddingService();
      console.log(`  Embedding service: ${isConnected ? '✅ Connected' : '❌ Disconnected'}`);
    } catch (error) {
      console.log(`❌ Error getting stats: ${error}`);
      process.exit(1);
    }
  }

  async clearData(type: 'files' | 'memory' | 'all'): Promise<void> {
    try {
      console.log(`🗑️  Clearing ${type} data...`);
      
      const result = await this.ragService.clearData(type);
      
      if (result.success) {
        console.log(`✅ ${result.message}`);
      } else {
        console.log(`❌ Failed to clear data: ${result.message}`);
        process.exit(1);
      }
    } catch (error) {
      console.log(`❌ Error clearing data: ${error}`);
      process.exit(1);
    }
  }

  async addMemory(
    content: string,
    agentId: string,
    sessionId: string,
    category: string = 'general',
    importance: number = 1,
    tags: string[] = []
  ): Promise<void> {
    try {
      console.log(`Adding memory entry...`);
      
      const result = await this.ragService.addMemory(
        content,
        agentId,
        sessionId,
        category,
        importance,
        tags
      );
      
      if (result.success) {
        console.log(`✅ Memory added successfully: ${result.memoryId}`);
      } else {
        console.log(`❌ Failed to add memory: ${result.message}`);
        process.exit(1);
      }
    } catch (error) {
      console.log(`❌ Error adding memory: ${error}`);
      process.exit(1);
    }
  }

  async searchMemory(query: string, agentId?: string, limit: number = 10): Promise<void> {
    try {
      console.log(`🔍 Searching memory with query: "${query}"`);
      if (agentId) {
        console.log(`   Filtering by agent: ${agentId}`);
      }
      
      const results = await this.ragService.searchMemory(query, agentId, { limit });
      
      if (results.length === 0) {
        console.log('  No results found');
        return;
      }

      results.forEach((result, index) => {
        console.log(`  ${index + 1}. Score: ${result.score.toFixed(3)}`);
        console.log(`     Agent: ${result.metadata.agentId}`);
        console.log(`     Category: ${result.metadata.category}`);
        console.log(`     Content: ${result.content.substring(0, 200)}...`);
        console.log('');
      });
    } catch (error) {
      console.log(`❌ Error searching memory: ${error}`);
      process.exit(1);
    }
  }

  async removeMemory(memoryId: string): Promise<void> {
    try {
      console.log(`Removing memory entry: ${memoryId}`);
      
      const result = await this.ragService.removeMemory(memoryId);
      
      if (result.success) {
        console.log(`✅ Memory removed successfully`);
      } else {
        console.log(`❌ Failed to remove memory: ${result.message}`);
        process.exit(1);
      }
    } catch (error) {
      console.log(`❌ Error removing memory: ${error}`);
      process.exit(1);
    }
  }

  async getMemoryByAgent(agentId: string): Promise<void> {
    try {
      console.log(`📝 Memory entries for agent: ${agentId}`);
      
      const results = await this.ragService.getMemoryByAgent(agentId);
      
      if (results.length === 0) {
        console.log('  No memory entries found');
        return;
      }

      results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.metadata.category} (${result.metadata.importance}/10)`);
        console.log(`     Timestamp: ${result.metadata.timestamp}`);
        console.log(`     Content: ${result.content.substring(0, 200)}...`);
        console.log('');
      });
    } catch (error) {
      console.log(`❌ Error getting memory by agent: ${error}`);
      process.exit(1);
    }
  }

  async close(): Promise<void> {
    try {
      await this.ragService.close();
    } catch (error) {
      logger.error(`Error closing maintenance CLI: ${error}`);
    }
  }
}

// CLI Setup
const program = new Command();

program
  .name('mcp-rag-maintenance')
  .description('MCP RAG Maintenance CLI')
  .version('1.0.0');

// File management commands
program
  .command('add-file')
  .description('Add a file to the RAG system')
  .argument('<filePath>', 'Path to the file to add')
  .action(async (filePath: string) => {
    const cli = new MaintenanceCLI();
    try {
      await cli.initialize();
      await cli.addFile(filePath);
    } finally {
      await cli.close();
    }
  });

program
  .command('add-dir')
  .description('Add all supported files from a directory to the RAG system')
  .argument('<dirPath>', 'Path to the directory to add')
  .action(async (dirPath: string) => {
    const cli = new MaintenanceCLI();
    try {
      await cli.initialize();
      await cli.addDirectory(dirPath);
    } finally {
      await cli.close();
    }
  });

program
  .command('remove-file')
  .description('Remove a file from the RAG system')
  .argument('<filePath>', 'Path to the file to remove')
  .action(async (filePath: string) => {
    const cli = new MaintenanceCLI();
    try {
      await cli.initialize();
      await cli.removeFile(filePath);
    } finally {
      await cli.close();
    }
  });

program
  .command('list-files')
  .description('List all files in the RAG system')
  .action(async () => {
    const cli = new MaintenanceCLI();
    try {
      await cli.initialize();
      await cli.listFiles();
    } finally {
      await cli.close();
    }
  });

program
  .command('search-files')
  .description('Search for files in the RAG system')
  .argument('<query>', 'Search query')
  .option('-l, --limit <number>', 'Maximum number of results', '10')
  .action(async (query: string, options: any) => {
    const cli = new MaintenanceCLI();
    try {
      await cli.initialize();
      await cli.searchFiles(query, parseInt(options.limit));
    } finally {
      await cli.close();
    }
  });

// Memory management commands
program
  .command('add-memory')
  .description('Add a memory entry to the agent memory system')
  .argument('<content>', 'Content to store in memory')
  .argument('<agentId>', 'ID of the agent')
  .argument('<sessionId>', 'ID of the session')
  .option('-c, --category <category>', 'Category for the memory', 'general')
  .option('-i, --importance <number>', 'Importance level (1-10)', '1')
  .option('-t, --tags <tags>', 'Comma-separated tags', '')
  .action(async (content: string, agentId: string, sessionId: string, options: any) => {
    const cli = new MaintenanceCLI();
    try {
      await cli.initialize();
      const tags = options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [];
      await cli.addMemory(content, agentId, sessionId, options.category, parseInt(options.importance), tags);
    } finally {
      await cli.close();
    }
  });

program
  .command('search-memory')
  .description('Search for memory entries')
  .argument('<query>', 'Search query')
  .option('-a, --agent <agentId>', 'Filter by agent ID')
  .option('-l, --limit <number>', 'Maximum number of results', '10')
  .action(async (query: string, options: any) => {
    const cli = new MaintenanceCLI();
    try {
      await cli.initialize();
      await cli.searchMemory(query, options.agent, parseInt(options.limit));
    } finally {
      await cli.close();
    }
  });

program
  .command('remove-memory')
  .description('Remove a memory entry')
  .argument('<memoryId>', 'ID of the memory entry to remove')
  .action(async (memoryId: string) => {
    const cli = new MaintenanceCLI();
    try {
      await cli.initialize();
      await cli.removeMemory(memoryId);
    } finally {
      await cli.close();
    }
  });

program
  .command('get-memory')
  .description('Get all memory entries for a specific agent')
  .argument('<agentId>', 'ID of the agent')
  .action(async (agentId: string) => {
    const cli = new MaintenanceCLI();
    try {
      await cli.initialize();
      await cli.getMemoryByAgent(agentId);
    } finally {
      await cli.close();
    }
  });

// Utility commands
program
  .command('stats')
  .description('Get RAG system statistics')
  .action(async () => {
    const cli = new MaintenanceCLI();
    try {
      await cli.initialize();
      await cli.getStats();
    } finally {
      await cli.close();
    }
  });

program
  .command('clear')
  .description('Clear data from the RAG system')
  .argument('<type>', 'Type of data to clear (files, memory, all)')
  .action(async (type: string) => {
    if (!['files', 'memory', 'all'].includes(type)) {
      console.log('❌ Invalid type. Must be: files, memory, or all');
      process.exit(1);
    }
    
    const cli = new MaintenanceCLI();
    try {
      await cli.initialize();
      await cli.clearData(type as 'files' | 'memory' | 'all');
    } finally {
      await cli.close();
    }
  });

// Parse command line arguments
program.parse();