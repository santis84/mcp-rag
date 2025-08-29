import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config();

export const CONFIG = {
  // MCP Configuration
  MCP_SERVER_NAME: process.env.MCP_SERVER_NAME || 'mcp-rag',
  MCP_SERVER_VERSION: process.env.MCP_SERVER_VERSION || '1.0.0',
  
  // Hugging Face Configuration
  HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY || '',
  HUGGINGFACE_MODEL: process.env.HUGGINGFACE_MODEL || 'sentence-transformers/all-MiniLM-L6-v2',
  
  // Pinecone Configuration
  PINECONE_API_KEY: process.env.PINECONE_API_KEY || '',
  PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp',
  PINECONE_INDEX_FILES: process.env.PINECONE_INDEX_FILES || 'rag-files',
  PINECONE_INDEX_MEMORY: process.env.PINECONE_INDEX_MEMORY || 'agent-memory',
  
  // File Processing Configuration
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '50'),
  SUPPORTED_EXTENSIONS: (process.env.SUPPORTED_EXTENSIONS || '.pdf,.docx,.txt,.md,.csv,.json').split(','),
  
  // Vector Configuration
  CHUNK_SIZE: parseInt(process.env.CHUNK_SIZE || '1000'),
  CHUNK_OVERLAP: parseInt(process.env.CHUNK_OVERLAP || '200'),
  EMBEDDING_DIMENSION: parseInt(process.env.EMBEDDING_DIMENSION || '384'),
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Paths
  DATA_DIR: join(process.cwd(), 'data'),
  UPLOADS_DIR: join(process.cwd(), 'data', 'uploads'),
  TEMP_DIR: join(process.cwd(), 'data', 'temp'),
} as const;

// Validate required configuration
export function validateConfig(): void {
  if (!CONFIG.HUGGINGFACE_API_KEY) {
    throw new Error('HUGGINGFACE_API_KEY is required. Please set it in your .env file.');
  }
}

export default CONFIG;