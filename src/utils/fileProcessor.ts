import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import csv from 'csv-parser';
import { CONFIG } from '../config/index.js';
import { DocumentChunk, FileInfo, ProcessingOptions } from '../types/index.js';
import { logger } from './logger.js';

export class FileProcessor {
  private supportedExtensions: Set<string>;

  constructor() {
    this.supportedExtensions = new Set(CONFIG.SUPPORTED_EXTENSIONS);
  }

  async processFile(filePath: string, options: ProcessingOptions = {}): Promise<DocumentChunk[]> {
    const fileInfo = await this.getFileInfo(filePath);
    
    if (!this.isSupportedFile(fileInfo.filename)) {
      throw new Error(`Unsupported file type: ${fileInfo.filename}`);
    }

    if (fileInfo.size > CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error(`File too large: ${fileInfo.size} bytes (max: ${CONFIG.MAX_FILE_SIZE_MB}MB)`);
    }

    logger.info(`Processing file: ${fileInfo.filename}`);
    
    const content = await this.extractContent(filePath, fileInfo.type);
    const chunks = this.createChunks(content, fileInfo, options);
    
    logger.info(`Created ${chunks.length} chunks for file: ${fileInfo.filename}`);
    return chunks;
  }

  async getFileInfo(filePath: string): Promise<FileInfo> {
    const stats = await fs.stat(filePath);
    const filename = path.basename(filePath);
    const ext = path.extname(filename).toLowerCase();
    
    return {
      filename,
      path: filePath,
      size: stats.size,
      type: ext,
      lastModified: stats.mtime,
      chunks: 0 // Will be updated after processing
    };
  }

  isSupportedFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return this.supportedExtensions.has(ext);
  }

  private async extractContent(filePath: string, fileType: string): Promise<string> {
    switch (fileType) {
      case '.pdf':
        return await this.extractFromPDF(filePath);
      case '.docx':
        return await this.extractFromDocx(filePath);
      case '.txt':
      case '.md':
        return await this.extractFromText(filePath);
      case '.csv':
        return await this.extractFromCSV(filePath);
      case '.json':
        return await this.extractFromJSON(filePath);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private async extractFromPDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      logger.error(`Error extracting PDF content: ${error}`);
      throw new Error(`Failed to extract PDF content: ${error}`);
    }
  }

  private async extractFromDocx(filePath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      logger.error(`Error extracting DOCX content: ${error}`);
      throw new Error(`Failed to extract DOCX content: ${error}`);
    }
  }

  private async extractFromText(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      logger.error(`Error reading text file: ${error}`);
      throw new Error(`Failed to read text file: ${error}`);
    }
  }

  private async extractFromCSV(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          resolve(JSON.stringify(results, null, 2));
        })
        .on('error', (error) => {
          logger.error(`Error reading CSV file: ${error}`);
          reject(new Error(`Failed to read CSV file: ${error}`));
        });
    });
  }

  private async extractFromJSON(filePath: string): Promise<string> {
    try {
      const data = await fs.readJSON(filePath);
      return JSON.stringify(data, null, 2);
    } catch (error) {
      logger.error(`Error reading JSON file: ${error}`);
      throw new Error(`Failed to read JSON file: ${error}`);
    }
  }

  private createChunks(
    content: string, 
    fileInfo: FileInfo, 
    options: ProcessingOptions
  ): DocumentChunk[] {
    const chunkSize = options.chunkSize || CONFIG.CHUNK_SIZE;
    const chunkOverlap = options.chunkOverlap || CONFIG.CHUNK_OVERLAP;
    
    const chunks: DocumentChunk[] = [];
    const sentences = this.splitIntoSentences(content);
    
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      
      if (sentence && currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        chunks.push(this.createChunkObject(currentChunk.trim(), fileInfo, chunkIndex, chunks.length + 1));
        chunkIndex++;
        
        // Add overlap
        const overlapText = this.getOverlapText(currentChunk, chunkOverlap);
        currentChunk = overlapText + sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(this.createChunkObject(currentChunk.trim(), fileInfo, chunkIndex, chunks.length + 1));
    }
    
    return chunks;
  }

  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitting - can be improved with more sophisticated NLP
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private getOverlapText(text: string, overlapSize: number): string {
    if (text.length <= overlapSize) return text;
    return text.slice(-overlapSize);
  }

  private createChunkObject(
    content: string, 
    fileInfo: FileInfo, 
    chunkIndex: number, 
    totalChunks: number
  ): DocumentChunk {
    return {
      id: uuidv4(),
      content,
      metadata: {
        source: fileInfo.path,
        filename: fileInfo.filename,
        chunkIndex,
        totalChunks,
        timestamp: new Date().toISOString(),
        fileType: fileInfo.type,
        size: fileInfo.size
      }
    };
  }

  async listFiles(directory: string): Promise<FileInfo[]> {
    try {
      const files = await fs.readdir(directory);
      const fileInfos: FileInfo[] = [];
      
      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile() && this.isSupportedFile(file)) {
          fileInfos.push({
            filename: file,
            path: filePath,
            size: stats.size,
            type: path.extname(file).toLowerCase(),
            lastModified: stats.mtime,
            chunks: 0 // This would need to be retrieved from the database
          });
        }
      }
      
      return fileInfos.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    } catch (error) {
      logger.error(`Error listing files: ${error}`);
      throw new Error(`Failed to list files: ${error}`);
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.remove(filePath);
      logger.info(`Deleted file: ${filePath}`);
    } catch (error) {
      logger.error(`Error deleting file: ${error}`);
      throw new Error(`Failed to delete file: ${error}`);
    }
  }
}