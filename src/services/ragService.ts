import { FileProcessor } from '../utils/fileProcessor.js';
import { VectorDatabase } from './vectorDatabase.js';
import { EmbeddingService } from './embeddingService.js';
import { DocumentChunk, MemoryEntry, SearchResult, SearchOptions, FileInfo } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export class RAGService {
  private fileProcessor: FileProcessor;
  private vectorDatabase: VectorDatabase;
  private embeddingService: EmbeddingService;

  constructor() {
    this.fileProcessor = new FileProcessor();
    this.embeddingService = new EmbeddingService();
    this.vectorDatabase = new VectorDatabase(this.embeddingService);
  }

  async initialize(): Promise<void> {
    try {
      await this.vectorDatabase.initialize();
      logger.info('RAG Service initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize RAG Service: ${error}`);
      throw error;
    }
  }

  // File Management Methods
  async addFile(filePath: string): Promise<{
    success: boolean;
    chunks: number;
    message: string;
  }> {
    try {
      logger.info(`Adding file to RAG: ${filePath}`);

      // Check if file exists and is supported
      if (!await this.fileProcessor.isSupportedFile(filePath.split('/').pop() || '')) {
        throw new Error('Unsupported file type');
      }

      // Process file into chunks
      const chunks = await this.fileProcessor.processFile(filePath);
      
      if (chunks.length === 0) {
        throw new Error('No content could be extracted from the file');
      }

      // Add chunks to vector database
      await this.vectorDatabase.addDocuments(chunks);

      logger.info(`Successfully added file: ${filePath} (${chunks.length} chunks)`);
      
      return {
        success: true,
        chunks: chunks.length,
        message: `File added successfully with ${chunks.length} chunks`
      };
    } catch (error) {
      logger.error(`Error adding file: ${error}`);
      return {
        success: false,
        chunks: 0,
        message: `Failed to add file: ${error}`
      };
    }
  }

  async searchFiles(
    query: string, 
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    try {
      logger.info(`Searching files with query: "${query}"`);
      return await this.vectorDatabase.searchDocuments(query, options);
    } catch (error) {
      logger.error(`Error searching files: ${error}`);
      throw new Error(`Search failed: ${error}`);
    }
  }

  async removeFile(filePath: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      logger.info(`Removing file from RAG: ${filePath}`);
      
      await this.vectorDatabase.deleteDocumentsBySource(filePath);
      
      logger.info(`Successfully removed file: ${filePath}`);
      
      return {
        success: true,
        message: 'File removed successfully'
      };
    } catch (error) {
      logger.error(`Error removing file: ${error}`);
      return {
        success: false,
        message: `Failed to remove file: ${error}`
      };
    }
  }

  async listFiles(): Promise<FileInfo[]> {
    try {
      // This would need to be implemented to track files in the database
      // For now, return empty array
      logger.info('Listing files in RAG system');
      return [];
    } catch (error) {
      logger.error(`Error listing files: ${error}`);
      throw new Error(`Failed to list files: ${error}`);
    }
  }

  // Memory Management Methods
  async addMemory(
    content: string,
    agentId: string,
    sessionId: string,
    category: string = 'general',
    importance: number = 1,
    tags: string[] = []
  ): Promise<{
    success: boolean;
    memoryId: string;
    message: string;
  }> {
    try {
      const memoryId = uuidv4();
      
      const memoryEntry: MemoryEntry = {
        id: memoryId,
        content,
        metadata: {
          agentId,
          sessionId,
          timestamp: new Date().toISOString(),
          category,
          importance,
          tags
        }
      };

      await this.vectorDatabase.addMemory(memoryEntry);
      
      logger.info(`Added memory entry: ${memoryId}`);
      
      return {
        success: true,
        memoryId,
        message: 'Memory added successfully'
      };
    } catch (error) {
      logger.error(`Error adding memory: ${error}`);
      return {
        success: false,
        memoryId: '',
        message: `Failed to add memory: ${error}`
      };
    }
  }

  async searchMemory(
    query: string,
    agentId?: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    try {
      logger.info(`Searching memory with query: "${query}"`);
      
      const searchOptions = { ...options };
      if (agentId) {
        searchOptions.filter = { ...searchOptions.filter, agentId };
      }
      
      return await this.vectorDatabase.searchMemory(query, searchOptions);
    } catch (error) {
      logger.error(`Error searching memory: ${error}`);
      throw new Error(`Memory search failed: ${error}`);
    }
  }

  async removeMemory(memoryId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      logger.info(`Removing memory entry: ${memoryId}`);
      
      await this.vectorDatabase.deleteMemory(memoryId);
      
      logger.info(`Successfully removed memory entry: ${memoryId}`);
      
      return {
        success: true,
        message: 'Memory removed successfully'
      };
    } catch (error) {
      logger.error(`Error removing memory: ${error}`);
      return {
        success: false,
        message: `Failed to remove memory: ${error}`
      };
    }
  }

  async getMemoryByAgent(agentId: string): Promise<SearchResult[]> {
    try {
      logger.info(`Getting memory for agent: ${agentId}`);
      return await this.vectorDatabase.getMemoryByAgent(agentId);
    } catch (error) {
      logger.error(`Error getting memory by agent: ${error}`);
      throw new Error(`Failed to get memory by agent: ${error}`);
    }
  }

  // Utility Methods
  async getStats(): Promise<{
    documents: number;
    memory: number;
    total: number;
  }> {
    try {
      return await this.vectorDatabase.getCollectionStats();
    } catch (error) {
      logger.error(`Error getting stats: ${error}`);
      return { documents: 0, memory: 0, total: 0 };
    }
  }

  async clearData(type: 'files' | 'memory' | 'all'): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (type === 'files' || type === 'all') {
        await this.vectorDatabase.clearCollection('files');
      }
      
      if (type === 'memory' || type === 'all') {
        await this.vectorDatabase.clearCollection('memory');
      }
      
      logger.info(`Cleared ${type} data`);
      
      return {
        success: true,
        message: `${type} data cleared successfully`
      };
    } catch (error) {
      logger.error(`Error clearing data: ${error}`);
      return {
        success: false,
        message: `Failed to clear data: ${error}`
      };
    }
  }

  async testEmbeddingService(): Promise<boolean> {
    try {
      return await this.embeddingService.testConnection();
    } catch (error) {
      logger.error(`Embedding service test failed: ${error}`);
      return false;
    }
  }

  async close(): Promise<void> {
    try {
      await this.vectorDatabase.close();
      logger.info('RAG Service closed');
    } catch (error) {
      logger.error(`Error closing RAG Service: ${error}`);
    }
  }
}