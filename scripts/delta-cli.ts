#!/usr/bin/env tsx

/**
 * Δ-Enhanced CLI - ΞKernel with Epistemic Analysis
 * 
 * Now detects φ/Δ/Λ patterns and provides epistemic scoring
 */

import * as readline from 'readline';
import { DeltaEnhancedKernel } from '../src/core/delta-enhanced-kernel';
import { TrulyFreeOpenRouterPort } from '../src/core/llm-providers/truly-free-openrouter-port';

const API_KEY = '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';

class DeltaCLI {
  private kernel: DeltaEnhancedKernel;
  private rl: readline.Interface;
  private sessionCost: number = 0;

  constructor() {
    const port = new TrulyFreeOpenRouterPort({
      apiKey: API_KEY,
      model: 'openrouter/sonoma-dusk-alpha',
      temperature: 0.7,
      maxTokens: 600
    });

    this.kernel = new DeltaEnhancedKernel(port, { 
      deltaEnabled: true, 
      interventionMode: false // Can be toggled
    });

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log('🔮 Δ-Enhanced ΞKernel - Epistemic AI Assistant');
    console.log('==============================================');
    console.log('💸 Using FREE Sonoma Dusk Alpha model');
    console.log('📊 φ/Δ/Λ detection: ENABLED');
    console.log('⚠️  Intervention mode: DISABLED (use /intervention to enable)');
    console.log('⌨️  Commands: /help /delta /epistemic /intervention /quit\n');

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

      case '/delta':
        await this.showDeltaStatus();
        return true;

      case '/epistemic':
        await this.showEpistemicReport();
        return true;

      case '/intervention':
        await this.toggleIntervention();
        return true;

      case '/quit':
      case '/exit':
        console.log('👋 Δ-Enhanced session complete. Epistemic patterns preserved.');
        return false;

      default:
        console.log(`❓ Unknown command: ${command}`);
        return true;
    }
  }

  private async handleUserMessage(input: string) {
    console.log('🧠 AI analyzing with Δ-Layer...\n');
    
    const timestamp = Date.now();
    const symbolId = `interaction_${timestamp}`;

    const isQuestion = input.includes('?') || 
                      input.toLowerCase().startsWith('what') ||
                      input.toLowerCase().startsWith('how') ||
                      input.toLowerCase().startsWith('why') ||
                      input.toLowerCase().startsWith('explain') ||
                      input.toLowerCase().startsWith('analyze');

    const taskPrefix = isQuestion ? 
      'Answer this question: ' : 
      'Store and understand this information: ';

    // This will automatically trigger Δ-Layer analysis
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
    
    this.sessionCost += response.cost || 0;
    console.log(`\n💸 Cost: $${response.cost?.toFixed(6) || '0.000000'} | Session: $${this.sessionCost.toFixed(6)}\n`);
  }

  private showHelp() {
    console.log('\n📖 Δ-Enhanced ΞKernel Commands');
    console.log('==============================');
    console.log('/help         - Show this help');
    console.log('/delta        - Show Δ-Layer status');
    console.log('/epistemic    - Generate epistemic report');
    console.log('/intervention - Toggle intervention mode');
    console.log('/quit         - Exit assistant');
    console.log();
    console.log('🔮 Δ-Layer Features:');
    console.log('- φ: Detects suspension/uncertainty');
    console.log('- Δ: Detects contradictions');
    console.log('- Λ: Detects gaps/missing information');
    console.log('- τ: Measures meta-cognitive depth');
    console.log('- Epistemic scoring: 0.000-1.000');
    console.log();
    console.log('💡 Try these examples:');
    console.log('- "I think quantum mechanics might be uncertain"');
    console.log('- "This statement is false"');
    console.log('- "The data is [missing] but we can conclude..."');
    console.log('- "Thinking about thinking about recursion"');
    console.log();
  }

  private async showDeltaStatus() {
    const distribution = this.kernel.getEpistemicDistribution();
    
    console.log('\n📊 Δ-Layer Status');
    console.log('=================');
    console.log('🔮 Epistemic Analysis: ENABLED');
    console.log(`📈 Quality Distribution:`);
    console.log(`   High (0.7-1.0): ${distribution.high} symbols`);
    console.log(`   Medium (0.4-0.7): ${distribution.medium} symbols`);
    console.log(`   Low (0.0-0.4): ${distribution.low} symbols`);
    console.log();
  }

  private async showEpistemicReport() {
    console.log('\n📊 Generating Epistemic Report...');
    
    const report = await this.kernel.generateEpistemicReport();
    
    console.log('\n🔮 Epistemic Analysis Report');
    console.log('============================');
    console.log(`📝 Processed Symbols: ${report.totalSymbols}`);
    console.log(`📊 Average Quality: ${report.avgEpistemicScore.toFixed(3)}/1.000`);
    console.log(`φ Suspensions: ${report.phiCount}`);
    console.log(`Δ Contradictions: ${report.deltaCount}`);
    console.log(`Λ Lacunas: ${report.lacunaCount}`);
    
    if (report.topConcerns.length > 0) {
      console.log(`\n⚠️  Top Epistemic Concerns:`);
      report.topConcerns.forEach((concern, i) => {
        console.log(`   ${i + 1}. ${concern}`);
      });
    } else {
      console.log(`\n✅ No major epistemic concerns detected`);
    }
    console.log();
  }

  private async toggleIntervention() {
    // Simple toggle - would need state tracking in real implementation
    console.log('\n⚠️  Intervention Mode');
    console.log('====================');
    console.log('Toggle intervention mode? This will make the AI actively');
    console.log('address contradictions and gaps as they are detected.');
    console.log();
    
    const response = await this.getUserInput('Enable intervention mode? (y/n): ');
    
    if (response.toLowerCase() === 'y' || response.toLowerCase() === 'yes') {
      this.kernel.setDeltaMode(true, true);
      console.log('✅ Intervention mode ENABLED');
      console.log('   The AI will now actively address φ/Δ/Λ patterns');
    } else {
      this.kernel.setDeltaMode(true, false);
      console.log('ℹ️  Intervention mode DISABLED');
      console.log('   The AI will detect but not intervene on φ/Δ/Λ patterns');
    }
    console.log();
  }

  close() {
    this.rl.close();
  }
}

// Start the Δ-Enhanced CLI
if (require.main === module) {
  const cli = new DeltaCLI();
  
  process.on('SIGINT', () => {
    console.log('\n\n👋 Δ-Enhanced ΞKernel shutting down...');
    cli.close();
    process.exit(0);
  });
  
  cli.start().catch((error) => {
    console.error('❌ Δ-CLI Error:', error);
    cli.close();
    process.exit(1);
  });
}