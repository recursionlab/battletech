/**
 * Knowledge Service - Integrates markdown loading with ΞKernel
 * 
 * Bridges the gap between file-based knowledge and the symbolic kernel system
 */

import { MarkdownLoader, MarkdownDocument, createTrainingLoader, createKnowledgeLoader } from '../utils/markdown-loader';
import { ΞKernel, Symbol } from '../core/xi-kernel';

export interface KnowledgeIngestionOptions {
  autoEmbed?: boolean;
  createSymbols?: boolean;
  linkRelated?: boolean;
  updateExisting?: boolean;
}

export interface KnowledgeStats {
  totalDocuments: number;
  totalSymbols: number;
  trainingDocuments: number;
  knowledgeDocuments: number;
  lastUpdated: Date;
}

export class KnowledgeService {
  private trainingLoader: MarkdownLoader;
  private knowledgeLoader: MarkdownLoader;
  private kernel: ΞKernel;
  private documentSymbolMap: Map<string, string> = new Map();

  constructor(kernel: ΞKernel, basePath: string = 'data') {
    this.kernel = kernel;
    this.trainingLoader = createTrainingLoader(basePath);
    this.knowledgeLoader = createKnowledgeLoader(basePath);
  }

  /**
   * Ingest all markdown documents into the kernel
   */
  async ingestAll(options: KnowledgeIngestionOptions = {}): Promise<KnowledgeStats> {
    const defaultOptions: KnowledgeIngestionOptions = {
      autoEmbed: true,
      createSymbols: true,
      linkRelated: false,
      updateExisting: true,
      ...options
    };

    // Load all documents
    const [trainingDocs, knowledgeDocs] = await Promise.all([
      this.trainingLoader.loadTrainingData(),
      this.knowledgeLoader.loadKnowledgeBase()
    ]);

    const allDocs = [...trainingDocs, ...knowledgeDocs];
    let symbolsCreated = 0;

    // Create symbols for each document
    if (defaultOptions.createSymbols) {
      for (const doc of allDocs) {
        const symbolId = await this.createSymbolFromDocument(doc, defaultOptions);
        if (symbolId) {
          this.documentSymbolMap.set(doc.id, symbolId);
          symbolsCreated++;
        }
      }
    }

    // Link related documents if requested
    if (defaultOptions.linkRelated) {
      await this.linkRelatedDocuments(allDocs);
    }

    return {
      totalDocuments: allDocs.length,
      totalSymbols: symbolsCreated,
      trainingDocuments: trainingDocs.length,
      knowledgeDocuments: knowledgeDocs.length,
      lastUpdated: new Date()
    };
  }

  /**
   * Ingest only training data
   */
  async ingestTrainingData(options: KnowledgeIngestionOptions = {}): Promise<Symbol[]> {
    const docs = await this.trainingLoader.loadTrainingData();
    const symbols: Symbol[] = [];

    for (const doc of docs) {
      const symbolId = await this.createSymbolFromDocument(doc, options);
      if (symbolId) {
        const symbol = this.kernel.getSymbol(symbolId);
        if (symbol) symbols.push(symbol);
      }
    }

    return symbols;
  }

  /**
   * Ingest only knowledge base
   */
  async ingestKnowledgeBase(options: KnowledgeIngestionOptions = {}): Promise<Symbol[]> {
    const docs = await this.knowledgeLoader.loadKnowledgeBase();
    const symbols: Symbol[] = [];

    for (const doc of docs) {
      const symbolId = await this.createSymbolFromDocument(doc, options);
      if (symbolId) {
        const symbol = this.kernel.getSymbol(symbolId);
        if (symbol) symbols.push(symbol);
      }
    }

    return symbols;
  }

  /**
   * Search knowledge by query and return related symbols
   */
  async searchKnowledge(query: string): Promise<{
    documents: MarkdownDocument[];
    symbols: Symbol[];
  }> {
    // Search training data
    const trainingDocs = await this.trainingLoader.loadTrainingData();
    const knowledgeDocs = await this.knowledgeLoader.loadKnowledgeBase();
    
    const foundTraining = this.trainingLoader.searchDocuments(query, trainingDocs);
    const foundKnowledge = this.knowledgeLoader.searchDocuments(query, knowledgeDocs);
    
    const allFound = [...foundTraining, ...foundKnowledge];
    
    // Get corresponding symbols
    const symbols: Symbol[] = [];
    for (const doc of allFound) {
      const symbolId = this.documentSymbolMap.get(doc.id);
      if (symbolId) {
        const symbol = this.kernel.getSymbol(symbolId);
        if (symbol) symbols.push(symbol);
      }
    }

    return {
      documents: allFound,
      symbols
    };
  }

  /**
   * Get knowledge statistics
   */
  async getStats(): Promise<KnowledgeStats> {
    const [trainingDocs, knowledgeDocs] = await Promise.all([
      this.trainingLoader.loadTrainingData(),
      this.knowledgeLoader.loadKnowledgeBase()
    ]);

    return {
      totalDocuments: trainingDocs.length + knowledgeDocs.length,
      totalSymbols: this.documentSymbolMap.size,
      trainingDocuments: trainingDocs.length,
      knowledgeDocuments: knowledgeDocs.length,
      lastUpdated: new Date()
    };
  }

  /**
   * Refresh/reload all knowledge
   */
  async refresh(options: KnowledgeIngestionOptions = {}): Promise<KnowledgeStats> {
    // Clear caches
    this.trainingLoader.clearCache();
    this.knowledgeLoader.clearCache();
    this.documentSymbolMap.clear();

    // Re-ingest everything
    return this.ingestAll(options);
  }

  /**
   * Get document by symbol ID
   */
  getDocumentBySymbol(symbolId: string): string | undefined {
    for (const [docId, symId] of this.documentSymbolMap.entries()) {
      if (symId === symbolId) {
        return docId;
      }
    }
    return undefined;
  }

  /**
   * Get symbol by document ID
   */
  getSymbolByDocument(documentId: string): Symbol | undefined {
    const symbolId = this.documentSymbolMap.get(documentId);
    return symbolId ? this.kernel.getSymbol(symbolId) : undefined;
  }

  // === PRIVATE METHODS ===

  private async createSymbolFromDocument(
    doc: MarkdownDocument, 
    options: KnowledgeIngestionOptions
  ): Promise<string | null> {
    try {
      const symbolId = `doc_${doc.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      // Check if symbol already exists
      const existing = this.kernel.getSymbol(symbolId);
      if (existing && !options.updateExisting) {
        return symbolId;
      }

      // Prepare payload with document content
      const payload = {
        title: doc.title,
        content: doc.content,
        htmlContent: options.autoEmbed ? doc.htmlContent : undefined,
        type: doc.type,
        category: doc.category,
        tags: doc.tags || [],
        filePath: doc.filePath,
        lastModified: doc.lastModified.toISOString()
      };

      // Create symbol through kernel
      const symbol = await this.kernel.prompt(symbolId, {
        task: `Ingest knowledge document: ${doc.title}`,
        context: {
          documentType: doc.type,
          category: doc.category,
          tags: doc.tags,
          metadata: doc.metadata
        },
        constraints: {
          maxTokens: 1000,
          temperature: 0.1 // Low temperature for knowledge ingestion
        }
      });

      // Update payload with actual document content
      symbol.payload = payload;
      
      // Add document-specific metadata
      Object.assign(symbol.meta, {
        documentId: doc.id,
        documentType: doc.type,
        documentCategory: doc.category,
        documentTags: doc.tags,
        documentFilePath: doc.filePath,
        documentLastModified: doc.lastModified.toISOString(),
        isKnowledgeDocument: true
      });

      return symbolId;
      
    } catch (error) {
      console.warn(`Failed to create symbol for document ${doc.id}:`, error);
      return null;
    }
  }

  private async linkRelatedDocuments(documents: MarkdownDocument[]): Promise<void> {
    // Simple tag-based linking for now
    const tagGroups = new Map<string, MarkdownDocument[]>();
    
    // Group documents by tags
    for (const doc of documents) {
      if (doc.tags) {
        for (const tag of doc.tags) {
          if (!tagGroups.has(tag)) {
            tagGroups.set(tag, []);
          }
          tagGroups.get(tag)!.push(doc);
        }
      }
    }
    
    // Create links between documents with shared tags
    for (const [tag, relatedDocs] of tagGroups.entries()) {
      if (relatedDocs.length > 1) {
        for (let i = 0; i < relatedDocs.length; i++) {
          for (let j = i + 1; j < relatedDocs.length; j++) {
            const docA = relatedDocs[i];
            const docB = relatedDocs[j];
            
            const symbolA = this.documentSymbolMap.get(docA.id);
            const symbolB = this.documentSymbolMap.get(docB.id);
            
            if (symbolA && symbolB) {
              await this.kernel.link(symbolA, symbolB, `shared_tag_${tag}`);
            }
          }
        }
      }
    }
  }
}