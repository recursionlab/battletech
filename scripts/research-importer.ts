#!/usr/bin/env tsx

/**
 * Research Goldmine Importer - Extract knowledge from conversation files
 * 
 * Converts chat logs, conversation files, and research documents into ΞKernel knowledge
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { DeltaEnhancedKernel } from '../src/core/delta-enhanced-kernel';
import { TrulyFreeOpenRouterPort } from '../src/core/llm-providers/truly-free-openrouter-port';

const API_KEY = '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';

interface ImportedKnowledge {
  id: string;
  source: string;
  content: string;
  extractedAt: Date;
  confidence: number;
  category?: string;
}

class ResearchImporter {
  private kernel: DeltaEnhancedKernel;
  private importedCount: number = 0;
  private totalCost: number = 0;

  constructor() {
    const port = new TrulyFreeOpenRouterPort({
      apiKey: API_KEY,
      model: 'openrouter/sonoma-dusk-alpha',
      temperature: 0.6,
      maxTokens: 800
    });

    this.kernel = new DeltaEnhancedKernel(port, { deltaEnabled: true });
  }

  async importResearchDirectory(dirPath: string): Promise<void> {
    console.log('📂 RESEARCH GOLDMINE IMPORTER');
    console.log('=============================');
    console.log(`🔍 Scanning directory: ${dirPath}\n`);

    try {
      const files = await this.findResearchFiles(dirPath);
      console.log(`📋 Found ${files.length} potential research files\n`);

      for (let i = 0; i < files.length; i++) {
        console.log(`📄 Processing file ${i + 1}/${files.length}: ${path.basename(files[i])}`);
        await this.processFile(files[i]);
        console.log(`✅ Imported. Total knowledge items: ${this.importedCount}\n`);
      }

      await this.generateImportSummary();

    } catch (error) {
      console.error('❌ Import failed:', error.message);
    }
  }

  async importSingleFile(filePath: string): Promise<void> {
    console.log('📄 SINGLE FILE IMPORT');
    console.log('=====================');
    console.log(`🔍 Processing: ${filePath}\n`);

    await this.processFile(filePath);
    await this.generateImportSummary();
  }

  private async findResearchFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    const scanDir = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
            await scanDir(fullPath);
          } else if (entry.isFile() && this.isResearchFile(entry.name)) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(`⚠️  Skipping directory: ${dir}`);
      }
    };

    await scanDir(dirPath);
    return files;
  }

  private shouldSkipDirectory(name: string): boolean {
    const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
    return skipDirs.includes(name) || name.startsWith('.');
  }

  private isResearchFile(filename: string): boolean {
    const extensions = ['.md', '.txt', '.json', '.csv', '.log'];
    const researchKeywords = ['conversation', 'chat', 'research', 'notes', 'analysis', 'data', 'transcript'];
    
    const ext = path.extname(filename).toLowerCase();
    const name = filename.toLowerCase();
    
    return extensions.includes(ext) || 
           researchKeywords.some(keyword => name.includes(keyword));
  }

  private async processFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const fileInfo = await fs.stat(filePath);
      
      // Extract meaningful chunks from the file
      const chunks = await this.extractKnowledgeChunks(content, filePath);
      
      for (const chunk of chunks) {
        const symbolId = `research_${Date.now()}_${this.importedCount}`;
        
        const response = await this.kernel.prompt(symbolId, {
          symbolId,
          task: `Extract and summarize the key knowledge from this research content: "${chunk.content}"
          
Focus on:
- Main concepts and ideas
- Important facts and data
- Insights and conclusions
- Research findings
- Actionable information

Provide a clear, structured summary that preserves the valuable information.`,
          context: {
            importedResearch: true,
            sourceFile: path.basename(filePath),
            fullPath: filePath,
            fileSize: fileInfo.size,
            category: chunk.category,
            timestamp: new Date().toISOString()
          },
          constraints: { maxTokens: 600 }
        });

        this.importedCount++;
        this.totalCost += response.cost || 0;
        
        console.log(`   💎 Extracted: "${response.payload.slice(0, 80)}..."`);
        console.log(`   💸 Cost: $${response.cost?.toFixed(6) || '0.000000'}`);
      }

    } catch (error) {
      console.error(`   ❌ Failed to process ${path.basename(filePath)}: ${error.message}`);
    }
  }

  private async extractKnowledgeChunks(content: string, filePath: string): Promise<Array<{content: string, category: string}>> {
    const chunks: Array<{content: string, category: string}> = [];
    
    // Handle different file types
    const extension = path.extname(filePath).toLowerCase();
    
    if (extension === '.json') {
      chunks.push(...this.extractFromJSON(content));
    } else if (extension === '.csv') {
      chunks.push(...this.extractFromCSV(content));
    } else if (extension === '.md') {
      chunks.push(...this.extractFromMarkdown(content));
    } else {
      // Plain text - split into meaningful chunks
      chunks.push(...this.extractFromText(content));
    }

    return chunks.filter(chunk => chunk.content.length > 50); // Filter out tiny chunks
  }

  private extractFromJSON(content: string): Array<{content: string, category: string}> {
    try {
      const data = JSON.parse(content);
      return this.recursiveExtractFromObject(data, 'json_data');
    } catch {
      return [{ content, category: 'json_raw' }];
    }
  }

  private recursiveExtractFromObject(obj: any, category: string): Array<{content: string, category: string}> {
    const chunks: Array<{content: string, category: string}> = [];
    
    if (typeof obj === 'string') {
      if (obj.length > 50) {
        chunks.push({ content: obj, category });
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        chunks.push(...this.recursiveExtractFromObject(item, `${category}_${index}`));
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        chunks.push(...this.recursiveExtractFromObject(value, `${category}_${key}`));
      });
    }
    
    return chunks;
  }

  private extractFromCSV(content: string): Array<{content: string, category: string}> {
    const lines = content.split('\n').filter(line => line.trim());
    const chunks: Array<{content: string, category: string}> = [];
    
    if (lines.length > 1) {
      const header = lines[0];
      const dataRows = lines.slice(1);
      
      // Group rows into meaningful chunks
      const chunkSize = Math.min(10, Math.max(1, Math.floor(dataRows.length / 5)));
      
      for (let i = 0; i < dataRows.length; i += chunkSize) {
        const chunkRows = dataRows.slice(i, i + chunkSize);
        const chunkContent = [header, ...chunkRows].join('\n');
        chunks.push({ 
          content: chunkContent, 
          category: `csv_chunk_${Math.floor(i / chunkSize) + 1}` 
        });
      }
    }
    
    return chunks;
  }

  private extractFromMarkdown(content: string): Array<{content: string, category: string}> {
    const chunks: Array<{content: string, category: string}> = [];
    
    // Split by headers
    const sections = content.split(/^#+\s/m);
    
    sections.forEach((section, index) => {
      if (section.trim().length > 100) {
        chunks.push({ 
          content: section.trim(), 
          category: `markdown_section_${index}` 
        });
      }
    });
    
    return chunks.length > 0 ? chunks : [{ content, category: 'markdown_full' }];
  }

  private extractFromText(content: string): Array<{content: string, category: string}> {
    const chunks: Array<{content: string, category: string}> = [];
    
    // Try to split by conversation patterns
    if (content.includes('Human:') || content.includes('Assistant:') || content.includes('User:') || content.includes('AI:')) {
      // Conversation format
      const parts = content.split(/(?:Human:|Assistant:|User:|AI:)/i);
      parts.forEach((part, index) => {
        if (part.trim().length > 100) {
          chunks.push({ 
            content: part.trim(), 
            category: `conversation_part_${index}` 
          });
        }
      });
    } else {
      // Split by paragraphs or line breaks
      const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 100);
      
      if (paragraphs.length > 0) {
        paragraphs.forEach((paragraph, index) => {
          chunks.push({ 
            content: paragraph.trim(), 
            category: `text_paragraph_${index}` 
          });
        });
      } else {
        // Single large chunk
        if (content.length > 500) {
          const chunkSize = 2000;
          for (let i = 0; i < content.length; i += chunkSize) {
            chunks.push({
              content: content.slice(i, i + chunkSize),
              category: `text_chunk_${Math.floor(i / chunkSize)}`
            });
          }
        } else {
          chunks.push({ content, category: 'text_full' });
        }
      }
    }
    
    return chunks;
  }

  private async generateImportSummary(): Promise<void> {
    const state = this.kernel.exportState();
    const epistemicReport = await this.kernel.generateEpistemicReport();
    
    console.log('\n🎉 IMPORT COMPLETE!');
    console.log('==================');
    console.log(`💎 Knowledge items extracted: ${this.importedCount}`);
    console.log(`💸 Total cost: $${this.totalCost.toFixed(6)}`);
    console.log(`🧠 Total symbols in kernel: ${state.metadata.totalSymbols}`);
    console.log(`📊 Average epistemic quality: ${epistemicReport.avgEpistemicScore.toFixed(3)}`);
    
    if (epistemicReport.phiCount > 0) {
      console.log(`φ Suspensions detected: ${epistemicReport.phiCount}`);
    }
    if (epistemicReport.deltaCount > 0) {
      console.log(`Δ Contradictions detected: ${epistemicReport.deltaCount}`);
    }
    if (epistemicReport.lacunaCount > 0) {
      console.log(`Λ Lacunas detected: ${epistemicReport.lacunaCount}`);
    }
    
    console.log('\n✨ Your research goldmine is now accessible via ΞKernel!');
    console.log('🔍 Use the CLI to query your imported knowledge');
  }

  async queryImportedKnowledge(query: string): Promise<void> {
    console.log(`\n🔍 Querying imported knowledge: "${query}"`);
    
    const response = await this.kernel.prompt('research_query', {
      symbolId: 'research_query',
      task: `Based on all the research I've imported, please answer: ${query}
      
Draw from the knowledge you've processed and provide insights from the research data.`,
      context: {
        queryingImportedResearch: true,
        query,
        timestamp: new Date().toISOString()
      },
      constraints: { maxTokens: 600 }
    });
    
    console.log('\n🎯 Research Insights:');
    console.log('=====================');
    console.log(response.payload);
    console.log(`\n💸 Query cost: $${response.cost?.toFixed(6) || '0.000000'}`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const importer = new ResearchImporter();
  
  if (args.length === 0) {
    console.log('📚 Research Goldmine Importer');
    console.log('=============================');
    console.log('Usage:');
    console.log('  npx tsx scripts/research-importer.ts <directory>  # Import entire directory');
    console.log('  npx tsx scripts/research-importer.ts <file.txt>   # Import single file');
    console.log('  npx tsx scripts/research-importer.ts query "your question"  # Query imported knowledge');
    console.log();
    console.log('Examples:');
    console.log('  npx tsx scripts/research-importer.ts ./research-files');
    console.log('  npx tsx scripts/research-importer.ts ./conversation.txt');
    console.log('  npx tsx scripts/research-importer.ts query "What are the main themes?"');
    return;
  }
  
  const target = args[0];
  
  if (target === 'query' && args[1]) {
    await importer.queryImportedKnowledge(args[1]);
    return;
  }
  
  try {
    const stat = await fs.stat(target);
    
    if (stat.isDirectory()) {
      await importer.importResearchDirectory(target);
    } else if (stat.isFile()) {
      await importer.importSingleFile(target);
    } else {
      console.error('❌ Target is not a file or directory');
    }
  } catch (error) {
    console.error(`❌ Cannot access ${target}: ${error.message}`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}