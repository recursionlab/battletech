/**
 * Markdown Loader Utility
 * 
 * Loads and processes markdown files with frontmatter for training/knowledge ingestion
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

export interface MarkdownDocument {
  id: string;
  title: string;
  content: string;
  htmlContent: string;
  metadata: Record<string, any>;
  filePath: string;
  lastModified: Date;
  tags?: string[];
  category?: string;
  type?: 'training' | 'knowledge';
}

export interface MarkdownLoadOptions {
  parseHtml?: boolean;
  includeMetadata?: boolean;
  filterTags?: string[];
  filterCategory?: string;
  recursive?: boolean;
}

export class MarkdownLoader {
  private cache: Map<string, MarkdownDocument> = new Map();
  
  constructor(
    private basePath: string = 'data',
    private options: MarkdownLoadOptions = {}
  ) {
    this.options = {
      parseHtml: true,
      includeMetadata: true,
      recursive: true,
      ...options
    };
  }

  /**
   * Load a single markdown file
   */
  async loadFile(filePath: string): Promise<MarkdownDocument> {
    const fullPath = path.resolve(filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const stats = await fs.stat(fullPath);
    
    // Parse frontmatter and content
    const { data: metadata, content: markdownContent } = matter(content);
    
    // Generate unique ID from file path
    const id = this.generateId(filePath);
    
    // Parse HTML if requested
    const htmlContent = this.options.parseHtml 
      ? await marked(markdownContent)
      : '';
    
    const document: MarkdownDocument = {
      id,
      title: metadata.title || path.basename(filePath, '.md'),
      content: markdownContent,
      htmlContent,
      metadata: this.options.includeMetadata ? metadata : {},
      filePath: fullPath,
      lastModified: stats.mtime,
      tags: metadata.tags || [],
      category: metadata.category,
      type: this.inferType(filePath)
    };
    
    // Cache the document
    this.cache.set(id, document);
    
    return document;
  }

  /**
   * Load all markdown files from a directory
   */
  async loadDirectory(dirPath: string): Promise<MarkdownDocument[]> {
    const fullDirPath = path.resolve(this.basePath, dirPath);
    const documents: MarkdownDocument[] = [];
    
    try {
      await this.walkDirectory(fullDirPath, documents);
    } catch (error) {
      throw new Error(`Failed to load directory ${fullDirPath}: ${error}`);
    }
    
    return this.applyFilters(documents);
  }

  /**
   * Load all training data
   */
  async loadTrainingData(): Promise<MarkdownDocument[]> {
    return this.loadDirectory('training');
  }

  /**
   * Load all knowledge base data
   */
  async loadKnowledgeBase(): Promise<MarkdownDocument[]> {
    return this.loadDirectory('knowledge');
  }

  /**
   * Load all markdown data
   */
  async loadAll(): Promise<MarkdownDocument[]> {
    const [training, knowledge] = await Promise.all([
      this.loadTrainingData(),
      this.loadKnowledgeBase()
    ]);
    
    return [...training, ...knowledge];
  }

  /**
   * Search documents by content or metadata
   */
  searchDocuments(
    query: string, 
    documents: MarkdownDocument[],
    searchFields: Array<keyof MarkdownDocument> = ['title', 'content', 'tags']
  ): MarkdownDocument[] {
    const lowerQuery = query.toLowerCase();
    
    return documents.filter(doc => {
      return searchFields.some(field => {
        const value = doc[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerQuery);
        } else if (Array.isArray(value)) {
          return value.some(item => 
            typeof item === 'string' && item.toLowerCase().includes(lowerQuery)
          );
        }
        return false;
      });
    });
  }

  /**
   * Get documents by tag
   */
  getDocumentsByTag(tag: string, documents: MarkdownDocument[]): MarkdownDocument[] {
    return documents.filter(doc => doc.tags?.includes(tag));
  }

  /**
   * Get documents by category
   */
  getDocumentsByCategory(category: string, documents: MarkdownDocument[]): MarkdownDocument[] {
    return documents.filter(doc => doc.category === category);
  }

  /**
   * Get cached document by ID
   */
  getCachedDocument(id: string): MarkdownDocument | undefined {
    return this.cache.get(id);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; documents: string[] } {
    return {
      size: this.cache.size,
      documents: Array.from(this.cache.keys())
    };
  }

  // === PRIVATE METHODS ===

  private async walkDirectory(dirPath: string, documents: MarkdownDocument[]): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory() && this.options.recursive) {
          await this.walkDirectory(fullPath, documents);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          try {
            const document = await this.loadFile(fullPath);
            documents.push(document);
          } catch (error) {
            console.warn(`Failed to load ${fullPath}:`, error);
          }
        }
      }
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private applyFilters(documents: MarkdownDocument[]): MarkdownDocument[] {
    let filtered = [...documents];
    
    if (this.options.filterTags?.length) {
      filtered = filtered.filter(doc => 
        this.options.filterTags!.some(tag => doc.tags?.includes(tag))
      );
    }
    
    if (this.options.filterCategory) {
      filtered = filtered.filter(doc => doc.category === this.options.filterCategory);
    }
    
    return filtered;
  }

  private generateId(filePath: string): string {
    // Create ID from relative path
    const relativePath = path.relative(this.basePath, filePath);
    return relativePath.replace(/\\/g, '/').replace(/\.md$/, '');
  }

  private inferType(filePath: string): 'training' | 'knowledge' | undefined {
    if (filePath.includes('training')) return 'training';
    if (filePath.includes('knowledge')) return 'knowledge';
    return undefined;
  }
}

// === UTILITY FUNCTIONS ===

/**
 * Create a pre-configured loader for training data
 */
export function createTrainingLoader(basePath?: string): MarkdownLoader {
  return new MarkdownLoader(basePath, {
    parseHtml: true,
    includeMetadata: true,
    recursive: true
  });
}

/**
 * Create a pre-configured loader for knowledge base
 */
export function createKnowledgeLoader(basePath?: string): MarkdownLoader {
  return new MarkdownLoader(basePath, {
    parseHtml: false, // Knowledge base might not need HTML
    includeMetadata: true,
    recursive: true
  });
}

/**
 * Quick load utility - loads all markdown from default paths
 */
export async function quickLoadAll(): Promise<MarkdownDocument[]> {
  const loader = new MarkdownLoader();
  return loader.loadAll();
}