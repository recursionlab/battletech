#!/usr/bin/env tsx

/**
 * ΞKernel CLI - Interactive AI Knowledge Assistant
 * 
 * Simple command-line interface for daily AI interaction
 */

import * as readline from 'readline';
import { ΞKernel } from '../src/core/xi-kernel';
import { TrulyFreeOpenRouterPort } from '../src/core/llm-providers/truly-free-openrouter-port';

const API_KEY = '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';

class XiCLI {
  private kernel: ΞKernel;
  private rl: readline.Interface;
  private sessionCost: number = 0;

  constructor() {
    const port = new TrulyFreeOpenRouterPort({
      apiKey: API_KEY,
      model: 'openrouter/sonoma-dusk-alpha',
      temperature: 0.7,
      maxTokens: 600
    });

    this.kernel = new ΞKernel(port);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log('🧠 ΞKernel AI Assistant - Interactive Mode');
    console.log('==========================================');
    console.log('💸 Using FREE Sonoma Dusk Alpha model');
    console.log('📝 Type your questions or knowledge to store');
    console.log('⌨️  Commands: /help /status /export /quit\n');

    await this.interactiveLoop();
  }

  private async interactiveLoop() {
    while (true) {
      try {
        const input = await this.getUserInput('🤔 You: ');
        
        if (input.startsWith('/')) {
          const shouldContinue = await this.handleCommand(input);
          if (!shouldContinue) break;
        } else {
          await this.handleUserMessage(input);
        }
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

  private async handleCommand(command: string): Promise<boolean> {
    const cmd = command.toLowerCase();
    
    switch (cmd) {
      case '/help':
        this.showHelp();
        return true;

      case '/status':
        await this.showStatus();
        return true;

      case '/export':
        await this.exportKnowledge();
        return true;

      case '/quit':
      case '/exit':
        console.log('👋 Goodbye! Your knowledge is saved in the kernel.');
        return false;

      default:
        console.log(`❓ Unknown command: ${command}`);
        console.log('Type /help for available commands\n');
        return true;
    }
  }

  private async handleUserMessage(input: string) {
    console.log('🧠 AI is thinking...\n');
    
    // Generate a unique ID for this interaction
    const timestamp = Date.now();
    const symbolId = `interaction_${timestamp}`;

    // Determine if this is a question or knowledge to store
    const isQuestion = input.includes('?') || 
                      input.toLowerCase().startsWith('what') ||
                      input.toLowerCase().startsWith('how') ||
                      input.toLowerCase().startsWith('why') ||
                      input.toLowerCase().startsWith('explain') ||
                      input.toLowerCase().startsWith('analyze');

    const taskPrefix = isQuestion ? 
      'Answer this question: ' : 
      'Store and understand this information: ';

    const response = await this.kernel.prompt(symbolId, {
      symbolId,
      task: taskPrefix + input,
      context: { 
        userInteraction: true,
        type: isQuestion ? 'question' : 'knowledge_storage',
        timestamp: new Date().toISOString()
      },
      constraints: { maxTokens: 500 }
    });

    console.log('🤖 AI Assistant:');
    console.log('----------------');
    console.log(response.payload);
    
    // Update session stats
    this.sessionCost += response.cost || 0;
    
    console.log(`\n💸 Cost: $${response.cost?.toFixed(6) || '0.000000'} | Session: $${this.sessionCost.toFixed(6)}\n`);
  }

  private showHelp() {
    console.log('\n📖 ΞKernel AI Assistant Commands');
    console.log('================================');
    console.log('/help     - Show this help message');
    console.log('/status   - Show knowledge base statistics');
    console.log('/export   - Export your knowledge graph');
    console.log('/quit     - Exit the assistant');
    console.log();
    console.log('💡 Usage Tips:');
    console.log('- Just type questions naturally: "What is machine learning?"');
    console.log('- Store knowledge: "Remember that I work at Acme Corp"');
    console.log('- Ask about stored info: "What do you know about my work?"');
    console.log('- The AI remembers everything across sessions!');
    console.log();
  }

  private async showStatus() {
    const state = this.kernel.exportState();
    
    console.log('\n📊 Knowledge Base Status');
    console.log('========================');
    console.log(`🧠 Stored Knowledge: ${state.metadata.totalSymbols} items`);
    console.log(`🔗 Relationships: ${state.metadata.totalEdges}`);
    console.log(`💸 Session Cost: $${this.sessionCost.toFixed(6)}`);
    console.log(`🛡️  System Status: ${state.metadata.invariantViolations.length === 0 ? '✅ Healthy' : '⚠️  Issues'}`);
    console.log(`⏰ Last Updated: ${state.metadata.lastModified}`);
    
    if (state.metadata.totalSymbols > 0) {
      console.log('\n📝 Recent Knowledge:');
      const recentSymbols = Object.entries(state.symbols)
        .slice(-3)
        .reverse();
      
      recentSymbols.forEach(([id, symbol]) => {
        const preview = symbol.payload.toString().slice(0, 60);
        console.log(`   • ${id}: "${preview}..."`);
      });
    }
    
    console.log();
  }

  private async exportKnowledge() {
    const state = this.kernel.exportState();
    const exportData = {
      exported: new Date().toISOString(),
      totalSymbols: state.metadata.totalSymbols,
      totalRelationships: state.metadata.totalEdges,
      knowledge: {}
    };

    // Convert symbols to readable format
    for (const [id, symbol] of Object.entries(state.symbols)) {
      exportData.knowledge[id] = {
        content: symbol.payload,
        type: symbol.typ,
        created: symbol.meta.timestamp,
        cost: symbol.meta.cost || 0
      };
    }

    // Save to file
    const filename = `xi-knowledge-export-${Date.now()}.json`;
    require('fs').writeFileSync(filename, JSON.stringify(exportData, null, 2));
    
    console.log(`\n📤 Knowledge Exported`);
    console.log('====================');
    console.log(`File: ${filename}`);
    console.log(`Items: ${state.metadata.totalSymbols} pieces of knowledge`);
    console.log(`Size: ${Math.round(JSON.stringify(exportData).length / 1024)} KB`);
    console.log();
  }

  close() {
    this.rl.close();
  }
}

// Start the CLI if run directly
if (require.main === module) {
  const cli = new XiCLI();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down ΞKernel CLI...');
    cli.close();
    process.exit(0);
  });
  
  cli.start().catch((error) => {
    console.error('❌ CLI Error:', error);
    cli.close();
    process.exit(1);
  });
}