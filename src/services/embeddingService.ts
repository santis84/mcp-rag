import axios from 'axios';
import { CONFIG } from '../config/index.js';
import { EmbeddingResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class EmbeddingService {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = CONFIG.HUGGINGFACE_API_KEY;
    this.model = CONFIG.HUGGINGFACE_MODEL;
    this.baseUrl = 'https://api-inference.huggingface.co/models';
    
    if (!this.apiKey) {
      throw new Error('Hugging Face API key is required');
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    logger.debug(`Generating embeddings for ${texts.length} texts using model: ${this.model}`);

    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.model}`,
        {
          inputs: texts,
          options: {
            wait_for_model: true,
            use_cache: true
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      if (response.status !== 200) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const embeddings = response.data;
      
      // Validate embeddings format
      if (!Array.isArray(embeddings)) {
        throw new Error('Invalid embeddings response format');
      }

      // Ensure all embeddings have the expected dimension
      const validEmbeddings = embeddings.filter((embedding: any) => 
        Array.isArray(embedding) && embedding.length === CONFIG.EMBEDDING_DIMENSION
      );

      if (validEmbeddings.length !== embeddings.length) {
        logger.warn(`Some embeddings were filtered out. Expected: ${embeddings.length}, Valid: ${validEmbeddings.length}`);
      }

      logger.debug(`Successfully generated ${validEmbeddings.length} embeddings`);
      return validEmbeddings;

    } catch (error) {
      logger.error(`Error generating embeddings: ${error}`);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Hugging Face API key');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (error.response?.status === 503) {
          throw new Error('Model is currently loading. Please try again in a few moments.');
        } else {
          throw new Error(`API error: ${error.response?.status} - ${error.response?.statusText}`);
        }
      }
      
      throw new Error(`Failed to generate embeddings: ${error}`);
    }
  }

  async generateSingleEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0] || [];
  }

  async generateQueryEmbedding(query: string): Promise<number[]> {
    // For query embeddings, we might want to use a different approach
    // or preprocessing to optimize for search
    return this.generateSingleEmbedding(query);
  }

  // Batch processing with retry logic
  async generateEmbeddingsBatch(
    texts: string[], 
    batchSize: number = 10,
    maxRetries: number = 3
  ): Promise<number[][]> {
    const allEmbeddings: number[][] = [];
    
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      let retries = 0;
      let success = false;
      
      while (retries < maxRetries && !success) {
        try {
          const batchEmbeddings = await this.generateEmbeddings(batch);
          allEmbeddings.push(...batchEmbeddings);
          success = true;
          
          // Add small delay between batches to respect rate limits
          if (i + batchSize < texts.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          retries++;
          logger.warn(`Batch ${i / batchSize + 1} failed (attempt ${retries}/${maxRetries}): ${error}`);
          
          if (retries >= maxRetries) {
            throw error;
          }
          
          // Exponential backoff
          const delay = Math.pow(2, retries) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    return allEmbeddings;
  }

  // Utility method to calculate cosine similarity
  calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i]! * embedding2[i]!;
      norm1 += embedding1[i]! * embedding1[i]!;
      norm2 += embedding2[i]! * embedding2[i]!;
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (norm1 * norm2);
  }

  // Get model information
  getModelInfo(): { name: string; dimension: number } {
    return {
      name: this.model,
      dimension: CONFIG.EMBEDDING_DIMENSION
    };
  }

  // Test the embedding service
  async testConnection(): Promise<boolean> {
    try {
      const testEmbedding = await this.generateSingleEmbedding('test');
      return testEmbedding.length === CONFIG.EMBEDDING_DIMENSION;
    } catch (error) {
      logger.error(`Embedding service test failed: ${error}`);
      return false;
    }
  }
}