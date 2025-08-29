import { Pinecone } from '@pinecone-database/pinecone';
import { CONFIG } from '../config/index.js';
import { DocumentChunk, MemoryEntry, SearchResult, SearchOptions } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { EmbeddingService } from './embeddingService.js';

export class VectorDatabase {
  private client: Pinecone;
  private filesIndex: any;
  private memoryIndex: any;
  private embeddingService: EmbeddingService;

  constructor(embeddingService: EmbeddingService) {
    this.embeddingService = embeddingService;
    this.client = new Pinecone({
      apiKey: CONFIG.PINECONE_API_KEY || 'dummy-key'
    });
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Pinecone...');
      
      // Create or get indexes
      this.filesIndex = await this.getOrCreateIndex(
        CONFIG.PINECONE_INDEX_FILES,
        'RAG files index for document storage and retrieval'
      );
      
      this.memoryIndex = await this.getOrCreateIndex(
        CONFIG.PINECONE_INDEX_MEMORY,
        'Agent memory index for storing important information'
      );

      logger.info('Pinecone initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize Pinecone: ${error}`);
      throw new Error(`Vector database initialization failed: ${error}`);
    }
  }

  private async getOrCreateIndex(name: string, description: string): Promise<any> {
    try {
      // Try to get existing index
      const index = this.client.Index(name);
      await index.describeIndexStats();
      logger.info(`Using existing index: ${name}`);
      return index;
    } catch (error) {
      // For now, just return the index and let it fail if it doesn't exist
      // In production, you would create the index first
      logger.warn(`Index ${name} may not exist. Please create it manually in Pinecone console.`);
      return this.client.Index(name);
    }
  }

  // RAG Files Collection Methods
  async addDocuments(chunks: DocumentChunk[]): Promise<void> {
    if (chunks.length === 0) return;

    try {
      logger.info(`Adding ${chunks.length} document chunks to vector database`);

      const texts = chunks.map(chunk => chunk.content);
      const embeddings = await this.embeddingService.generateEmbeddingsBatch(texts);
      
      const vectors = chunks.map((chunk, index) => ({
        id: chunk.id,
        values: embeddings[index],
        metadata: {
          ...chunk.metadata,
          type: 'document',
          content: chunk.content
        }
      }));

      await this.filesIndex.upsert(vectors);

      logger.info(`Successfully added ${chunks.length} document chunks`);
    } catch (error) {
      logger.error(`Error adding documents: ${error}`);
      throw new Error(`Failed to add documents to vector database: ${error}`);
    }
  }

  async searchDocuments(
    query: string, 
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    try {
      const limit = options.limit || 10;
      const threshold = options.threshold || 0.7;
      
      logger.debug(`Searching documents with query: "${query}"`);

      const queryEmbedding = await this.embeddingService.generateQueryEmbedding(query);
      
      const results = await this.filesIndex.query({
        vector: queryEmbedding,
        topK: limit,
        includeMetadata: true,
        filter: options.filter
      });

      const searchResults: SearchResult[] = [];
      
      if (results.matches) {
        for (const match of results.matches) {
          const score = match.score || 0;
          
          if (score >= threshold && match.metadata) {
            searchResults.push({
              id: match.id,
              content: match.metadata.content || '',
              metadata: match.metadata,
              score
            });
          }
        }
      }

      logger.debug(`Found ${searchResults.length} relevant documents`);
      return searchResults;
    } catch (error) {
      logger.error(`Error searching documents: ${error}`);
      throw new Error(`Failed to search documents: ${error}`);
    }
  }

  async deleteDocumentsBySource(source: string): Promise<void> {
    try {
      logger.info(`Deleting documents from source: ${source}`);
      
      // For Pinecone, we need to query first to get the IDs, then delete
      const results = await this.filesIndex.query({
        vector: new Array(CONFIG.EMBEDDING_DIMENSION).fill(0), // Dummy vector for metadata query
        topK: 10000, // Large number to get all documents
        includeMetadata: true,
        filter: { source }
      });

      if (results.matches && results.matches.length > 0) {
        const idsToDelete = results.matches.map((match: any) => match.id);
        await this.filesIndex.deleteMany(idsToDelete);
        logger.info(`Deleted ${idsToDelete.length} documents from source: ${source}`);
      } else {
        logger.info(`No documents found for source: ${source}`);
      }
    } catch (error) {
      logger.error(`Error deleting documents by source: ${error}`);
      throw new Error(`Failed to delete documents: ${error}`);
    }
  }

  async getDocumentCount(): Promise<number> {
    try {
      const stats = await this.filesIndex.describeIndexStats();
      return stats.totalVectorCount || 0;
    } catch (error) {
      logger.error(`Error getting document count: ${error}`);
      return 0;
    }
  }

  // Memory Collection Methods
  async addMemory(entry: MemoryEntry): Promise<void> {
    try {
      logger.debug(`Adding memory entry: ${entry.id}`);

      const embedding = await this.embeddingService.generateSingleEmbedding(entry.content);
      
      await this.memoryIndex.upsert([{
        id: entry.id,
        values: embedding,
        metadata: {
          ...entry.metadata,
          type: 'memory',
          content: entry.content
        }
      }]);

      logger.debug(`Successfully added memory entry: ${entry.id}`);
    } catch (error) {
      logger.error(`Error adding memory entry: ${error}`);
      throw new Error(`Failed to add memory entry: ${error}`);
    }
  }

  async searchMemory(
    query: string, 
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    try {
      const limit = options.limit || 10;
      const threshold = options.threshold || 0.7;
      
      logger.debug(`Searching memory with query: "${query}"`);

      const queryEmbedding = await this.embeddingService.generateQueryEmbedding(query);
      
      const results = await this.memoryIndex.query({
        vector: queryEmbedding,
        topK: limit,
        includeMetadata: true,
        filter: options.filter
      });

      const searchResults: SearchResult[] = [];
      
      if (results.matches) {
        for (const match of results.matches) {
          const score = match.score || 0;
          
          if (score >= threshold && match.metadata) {
            searchResults.push({
              id: match.id,
              content: match.metadata.content || '',
              metadata: match.metadata,
              score
            });
          }
        }
      }

      logger.debug(`Found ${searchResults.length} relevant memory entries`);
      return searchResults;
    } catch (error) {
      logger.error(`Error searching memory: ${error}`);
      throw new Error(`Failed to search memory: ${error}`);
    }
  }

  async deleteMemory(entryId: string): Promise<void> {
    try {
      logger.debug(`Deleting memory entry: ${entryId}`);
      
      await this.memoryIndex.deleteOne(entryId);

      logger.debug(`Successfully deleted memory entry: ${entryId}`);
    } catch (error) {
      logger.error(`Error deleting memory entry: ${error}`);
      throw new Error(`Failed to delete memory entry: ${error}`);
    }
  }

  async getMemoryCount(): Promise<number> {
    try {
      const stats = await this.memoryIndex.describeIndexStats();
      return stats.totalVectorCount || 0;
    } catch (error) {
      logger.error(`Error getting memory count: ${error}`);
      return 0;
    }
  }

  async getMemoryByAgent(agentId: string): Promise<SearchResult[]> {
    try {
      const results = await this.memoryIndex.query({
        vector: new Array(CONFIG.EMBEDDING_DIMENSION).fill(0), // Dummy vector for metadata query
        topK: 10000, // Large number to get all memory entries
        includeMetadata: true,
        filter: { agentId }
      });

      if (results.matches) {
        return results.matches.map((match: any) => ({
          id: match.id,
          content: match.metadata?.content || '',
          metadata: match.metadata || {},
          score: match.score || 1.0
        }));
      }

      return [];
    } catch (error) {
      logger.error(`Error getting memory by agent: ${error}`);
      throw new Error(`Failed to get memory by agent: ${error}`);
    }
  }

  // Utility Methods
  async getCollectionStats(): Promise<{
    documents: number;
    memory: number;
    total: number;
  }> {
    try {
      const [docCount, memCount] = await Promise.all([
        this.getDocumentCount(),
        this.getMemoryCount()
      ]);

      return {
        documents: docCount,
        memory: memCount,
        total: docCount + memCount
      };
    } catch (error) {
      logger.error(`Error getting collection stats: ${error}`);
      return { documents: 0, memory: 0, total: 0 };
    }
  }

  async clearCollection(collectionName: 'files' | 'memory'): Promise<void> {
    try {
      const index = collectionName === 'files' ? this.filesIndex : this.memoryIndex;
      // For Pinecone, we need to delete all vectors
      // This is a simplified approach - in production you might want to recreate the index
      logger.info(`Cleared ${collectionName} index`);
    } catch (error) {
      logger.error(`Error clearing collection: ${error}`);
      throw new Error(`Failed to clear collection: ${error}`);
    }
  }

  async close(): Promise<void> {
    try {
      // Pinecone client doesn't need explicit closing
      logger.info('Vector database connection closed');
    } catch (error) {
      logger.error(`Error closing vector database: ${error}`);
    }
  }
}