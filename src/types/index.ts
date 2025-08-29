export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    filename: string;
    chunkIndex: number;
    totalChunks: number;
    timestamp: string;
    fileType: string;
    size: number;
  };
}

export interface MemoryEntry {
  id: string;
  content: string;
  metadata: {
    agentId: string;
    sessionId: string;
    timestamp: string;
    category: string;
    importance: number;
    tags: string[];
  };
}

export interface SearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
}

export interface FileInfo {
  filename: string;
  path: string;
  size: number;
  type: string;
  lastModified: Date;
  chunks: number;
}

export interface ProcessingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  includeMetadata?: boolean;
}

export interface SearchOptions {
  limit?: number | undefined;
  threshold?: number | undefined;
  includeMetadata?: boolean;
  filter?: Record<string, any>;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface ProcessingStatus {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  error?: string;
}