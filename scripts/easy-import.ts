#!/usr/bin/env tsx

/**
 * Easy Import - Drag & Drop Your Research Files
 * 
 * Simple interface to import your research goldmine
 */

import * as readline from 'readline';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DeltaEnhancedKernel } from '../src/core/delta-enhanced-kernel';
import { TrulyFreeOpenRouterPort } from '../src/core/llm-providers/truly-free-openrouter-port';

const API_KEY = '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';

class EasyImporter {
  private kernel: DeltaEnhancedKernel;
  private rl: readline.Interface;

  constructor() {
    const port = new TrulyFreeOpenRouterPort({
      apiKey: API_KEY,
      model: 'openrouter/sonoma-dusk-alpha',
      temperature: 0.6,
      maxTokens: 700
    });

    this.kernel = new DeltaEnhancedKernel(port, { deltaEnabled: true });
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log('📂 RESEARCH GOLDMINE → ΞKernel');
    console.log('==============================');
    console.log('💎 Import your conversation files, research notes, and data');
    console.log('🆓 FREE processing with Sonoma Dusk Alpha');
    console.log('🔍 φ/Δ/Λ epistemic analysis included\n');

    await this.showQuickStart();
    await this.interactiveLoop();
  }

  private async showQuickStart() {
    console.log('🚀 QUICK START OPTIONS:');
    console.log('=======================');
    console.log('1. 📄 Import single file: type file path');
    console.log('2. 📂 Import entire folder: type folder path'); 
    console.log('3. 🔍 Query imported knowledge: type "query: your question"');
    console.log('4. 📊 Show import status: type "status"');
    console.log('5. 💬 Chat with imported data: type "chat"');
    console.log('6. ❓ Help: type "help"');
    console.log('7. 🚪 Exit: type "quit"\n');
  }

  private async interactiveLoop() {
    while (true) {
      try {
        const input = await this.getUserInput('📥 What would you like to import or do? ');
        
        if (!input.trim()) continue;

        if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
          console.log('👋 Import session complete! Your knowledge is preserved in ΞKernel.');
          break;
        }

        await this.handleInput(input);

      } catch (error) {
        console.log(`❌ Error: ${error.message}\n`);
      }
    }
  }

  private async getUserInput(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  private async handleInput(input: string) {
    const lowerInput = input.toLowerCase();

    if (lowerInput === 'help') {
      await this.showHelp();
    } else if (lowerInput === 'status') {
      await this.showStatus();
    } else if (lowerInput === 'chat') {
      await this.startChatMode();
    } else if (lowerInput.startsWith('query:')) {
      const query = input.slice(6).trim();
      await this.queryKnowledge(query);
    } else {
      // Assume it's a file or directory path
      await this.importPath(input);
    }
  }

  private async showHelp() {
    console.log('\n📖 IMPORT HELP');
    console.log('===============');
    console.log('📄 File formats supported:');
    console.log('   • .txt, .md (text files, conversation logs)');
    console.log('   • .json (structured data, chat exports)');
    console.log('   • .csv (data tables, research results)');
    console.log('   • Any text-based research file');
    console.log();
    console.log('💡 Pro tips:');
    console.log('   • Drag files into terminal, then press Enter');
    console.log('   • Use full paths: C:\\Users\\You\\research\\notes.txt');
    console.log('   • Import folders to process multiple files at once');
    console.log('   • Files with "conversation", "chat", "research" in name are auto-detected');
    console.log();
    console.log('🔍 Querying:');
    console.log('   • Type: query: What are the main themes in my research?');
    console.log('   • Type: query: Summarize the key findings');
    console.log('   • Type: query: What contradictions did you find?');
    console.log();
  }

  private async showStatus() {
    const state = this.kernel.exportState();
    const epistemicReport = await this.kernel.generateEpistemicReport();
    
    console.log('\n📊 IMPORT STATUS');
    console.log('================');
    console.log(`💎 Total knowledge items: ${state.metadata.totalSymbols}`);
    console.log(`📊 Average quality: ${epistemicReport.avgEpistemicScore.toFixed(3)}/1.000`);
    console.log(`🔗 Relationships: ${state.metadata.totalEdges}`);
    console.log(`⏰ Last import: ${state.metadata.lastModified}`);
    
    if (epistemicReport.phiCount > 0) {
      console.log(`φ Uncertainties: ${epistemicReport.phiCount}`);
    }
    if (epistemicReport.deltaCount > 0) {
      console.log(`Δ Contradictions: ${epistemicReport.deltaCount}`);
    }
    if (epistemicReport.lacunaCount > 0) {
      console.log(`Λ Knowledge gaps: ${epistemicReport.lacunaCount}`);
    }

    if (state.metadata.totalSymbols > 0) {
      console.log('\n📝 Recent imports:');
      const recentSymbols = Object.entries(state.symbols)
        .filter(([_, symbol]) => symbol.meta.importedResearch)
        .slice(-3);
        
      recentSymbols.forEach(([id, symbol]) => {
        const preview = symbol.payload.toString().slice(0, 80);
        console.log(`   • ${symbol.meta.sourceFile || id}: "${preview}..."`);
      });
    } else {
      console.log('\n💡 No research imported yet. Try importing a file or folder!');
    }
    console.log();
  }

  private async importPath(inputPath: string) {
    try {
      // Clean up the path (remove quotes if drag-dropped)
      const cleanPath = inputPath.replace(/^["']|["']$/g, '');
      const stat = await fs.stat(cleanPath);
      
      if (stat.isFile()) {
        console.log(`\n📄 Importing file: ${path.basename(cleanPath)}`);
        await this.importSingleFile(cleanPath);
      } else if (stat.isDirectory()) {
        console.log(`\n📂 Importing directory: ${cleanPath}`);
        await this.importDirectory(cleanPath);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`\n❌ File or directory not found: ${inputPath}`);
        console.log('💡 Try dragging the file into the terminal or using full path');
      } else {
        console.log(`\n❌ Cannot import ${inputPath}: ${error.message}`);
      }
    }
  }

  private async importSingleFile(filePath: string) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath);
      
      console.log('🧠 AI is processing your research...\n');
      
      // Process the file content
      const symbolId = `research_${Date.now()}`;
      const response = await this.kernel.prompt(symbolId, {
        symbolId,
        task: `Extract and organize the key knowledge from this research file: "${content}"
        
Please:
1. Identify the main topics and themes
2. Extract important facts, findings, and insights  
3. Note any questions, hypotheses, or areas of uncertainty
4. Summarize key conclusions or recommendations
5. Preserve important details and context

Format the knowledge in a clear, structured way.`,
        context: {
          importedResearch: true,
          sourceFile: fileName,
          fullPath: filePath,
          importType: 'single_file',
          timestamp: new Date().toISOString()
        },
        constraints: { maxTokens: 600 }
      });

      console.log('✅ KNOWLEDGE EXTRACTED:');
      console.log('=======================');
      console.log(response.payload);
      console.log();
      console.log(`💸 Processing cost: $${response.cost?.toFixed(6) || '0.000000'}`);
      console.log(`📄 Source: ${fileName}`);
      console.log(`💎 Knowledge preserved in ΞKernel\n`);
      
    } catch (error) {
      console.log(`❌ Failed to import ${path.basename(filePath)}: ${error.message}\n`);
    }
  }

  private async importDirectory(dirPath: string) {
    try {
      const files = await this.findImportableFiles(dirPath);
      
      if (files.length === 0) {
        console.log('❌ No importable files found in directory');
        console.log('💡 Looking for: .txt, .md, .json, .csv files\n');
        return;
      }

      console.log(`📋 Found ${files.length} files to import`);
      const shouldProceed = await this.getUserInput(`Proceed with importing all ${files.length} files? (y/n): `);
      
      if (shouldProceed.toLowerCase() !== 'y' && shouldProceed.toLowerCase() !== 'yes') {
        console.log('Import cancelled.\n');
        return;
      }

      console.log('\n🚀 Starting batch import...\n');
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📄 Processing ${i + 1}/${files.length}: ${path.basename(file)}`);
        await this.importSingleFile(file);
      }

      console.log('🎉 Batch import complete!\n');
      await this.showStatus();
      
    } catch (error) {
      console.log(`❌ Directory import failed: ${error.message}\n`);
    }
  }

  private async findImportableFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.txt', '.md', '.json', '.csv', '.log'];
    
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          files.push(path.join(dirPath, entry.name));
        }
      }
    }
    
    return files;
  }

  private async queryKnowledge(query: string) {
    if (!query.trim()) {
      console.log('❌ Please provide a query. Example: query: What are the main themes?\n');
      return;
    }

    console.log(`\n🔍 Searching your research for: "${query}"`);
    console.log('🧠 AI is analyzing your imported knowledge...\n');
    
    const response = await this.kernel.prompt('research_query', {
      symbolId: 'research_query',
      task: `Based on all the research knowledge I've imported and stored, please answer this query: "${query}"
      
Draw insights from the research data, identify patterns, and provide a comprehensive answer based on the imported knowledge.`,
      context: {
        queryingImportedResearch: true,
        query: query,
        timestamp: new Date().toISOString()
      },
      constraints: { maxTokens: 700 }
    });

    console.log('🎯 RESEARCH INSIGHTS:');
    console.log('=====================');
    console.log(response.payload);
    console.log();
    console.log(`💸 Query cost: $${response.cost?.toFixed(6) || '0.000000'}\n`);
  }

  private async startChatMode() {
    console.log('\n💬 CHAT MODE WITH YOUR RESEARCH');
    console.log('===============================');
    console.log('Type questions about your imported research. Type "back" to return.\n');

    while (true) {
      const question = await this.getUserInput('💬 Ask about your research: ');
      
      if (question.toLowerCase() === 'back') {
        console.log('Returning to main menu...\n');
        break;
      }
      
      if (question.trim()) {
        await this.queryKnowledge(question);
      }
    }
  }

  close() {
    this.rl.close();
  }
}

// Start the easy importer
if (require.main === module) {
  const importer = new EasyImporter();
  
  process.on('SIGINT', () => {
    console.log('\n\n👋 Research import session ended.');
    importer.close();
    process.exit(0);
  });
  
  importer.start().catch((error) => {
    console.error('❌ Import Error:', error);
    importer.close();
    process.exit(1);
  });
}