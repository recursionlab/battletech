#!/usr/bin/env tsx

/**
 * Self-Upgrade CLI - Watch AI+Kernel Recursively Improve Itself
 * 
 * Interface to observe and guide the AI's self-improvement process
 */

import * as readline from 'readline';
import { DeltaEnhancedKernel } from '../src/core/delta-enhanced-kernel';
import { TrulyFreeOpenRouterPort } from '../src/core/llm-providers/truly-free-openrouter-port';
import { SelfUpgradeEngine, UpgradeAttempt } from '../src/core/self-upgrade-engine';

const API_KEY = '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';

class SelfUpgradeCLI {
  private kernel: DeltaEnhancedKernel;
  private upgradeEngine: SelfUpgradeEngine;
  private rl: readline.Interface;
  private sessionCost: number = 0;

  constructor() {
    const port = new TrulyFreeOpenRouterPort({
      apiKey: API_KEY,
      model: 'openrouter/sonoma-dusk-alpha',
      temperature: 0.8, // Higher creativity for self-improvement
      maxTokens: 700
    });

    this.kernel = new DeltaEnhancedKernel(port, { 
      deltaEnabled: true, 
      interventionMode: true // Active improvement mode
    });

    this.upgradeEngine = new SelfUpgradeEngine(this.kernel);
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log('🚀 AI RECURSIVE SELF-UPGRADE LABORATORY');
    console.log('=======================================');
    console.log('🧠 Watching AI+Kernel improve itself recursively');
    console.log('📊 φ/Δ/Λ analysis active');
    console.log('🔄 Upgrade learning and effectiveness tracking');
    console.log('⚠️  Intervention mode: ACTIVE');
    console.log();
    console.log('⌨️  Commands:');
    console.log('   upgrade     - Run single upgrade cycle');
    console.log('   cycles N    - Run N upgrade cycles');
    console.log('   status      - Show upgrade history');
    console.log('   metrics     - Current capability metrics');
    console.log('   learnings   - What AI has learned about upgrading itself');
    console.log('   watch       - Watch live upgrade process');
    console.log('   help        - Show detailed help');
    console.log('   quit        - Exit laboratory\n');

    await this.interactiveLoop();
  }

  private async interactiveLoop() {
    while (true) {
      try {
        const input = await this.getUserInput('🔬 Laboratory Command: ');
        
        if (!input.trim()) continue;

        if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
          console.log('👋 Self-upgrade laboratory session ended.');
          console.log('🧠 AI upgrade knowledge preserved in kernel.');
          break;
        }

        await this.handleCommand(input);

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

  private async handleCommand(input: string) {
    const [command, ...args] = input.toLowerCase().split(' ');
    
    switch (command) {
      case 'upgrade':
        await this.runSingleUpgrade();
        break;
        
      case 'cycles':
        const count = parseInt(args[0]) || 3;
        await this.runMultipleCycles(count);
        break;
        
      case 'status':
        await this.showUpgradeStatus();
        break;
        
      case 'metrics':
        await this.showCurrentMetrics();
        break;
        
      case 'learnings':
        await this.showLearnings();
        break;
        
      case 'watch':
        await this.watchUpgradeProcess();
        break;
        
      case 'help':
        this.showHelp();
        break;
        
      default:
        console.log(`❓ Unknown command: ${command}`);
        console.log('Type "help" for available commands\n');
    }
  }

  private async runSingleUpgrade() {
    console.log('\n🚀 INITIATING SINGLE UPGRADE CYCLE');
    console.log('==================================');
    console.log('🧠 AI will now analyze itself and propose improvements...\n');

    const startTime = Date.now();
    const attempt = await this.upgradeEngine.performSelfUpgrade();
    const duration = (Date.now() - startTime) / 1000;

    console.log('📊 UPGRADE CYCLE COMPLETE');
    console.log('=========================');
    console.log(`⏱️  Duration: ${duration.toFixed(1)}s`);
    console.log(`📈 Success Score: ${attempt.successScore.toFixed(3)}/1.000`);
    console.log(`🎯 Target: ${attempt.description}`);
    console.log(`🧪 Hypothesis: ${attempt.hypothesis}`);
    
    if (attempt.successScore > 0.6) {
      console.log('✅ Upgrade appears SUCCESSFUL');
    } else if (attempt.successScore > 0.3) {
      console.log('🔶 Upgrade had MIXED results');
    } else {
      console.log('❌ Upgrade appears to have FAILED');
    }

    if (attempt.learnings.length > 0) {
      console.log(`\n🧠 Key Learnings:`);
      attempt.learnings.slice(0, 3).forEach((learning, i) => {
        console.log(`   ${i + 1}. ${learning}`);
      });
    }

    if (attempt.nextUpgradeIdeas.length > 0) {
      console.log(`\n💡 Next Ideas Generated:`);
      attempt.nextUpgradeIdeas.slice(0, 2).forEach((idea, i) => {
        console.log(`   ${i + 1}. ${idea}`);
      });
    }

    console.log(`\n💸 Cycle cost: $${this.calculateCycleCost()} (FREE model)`);
    console.log();
  }

  private async runMultipleCycles(count: number) {
    console.log(`\n🔄 INITIATING ${count} RECURSIVE UPGRADE CYCLES`);
    console.log('='.repeat(40 + count.toString().length));
    console.log('🧠 AI will recursively improve its own upgrade capabilities...\n');

    const startTime = Date.now();
    const attempts = await this.upgradeEngine.runUpgradeCycles(count);
    const duration = (Date.now() - startTime) / 1000;

    console.log('\n📊 RECURSIVE UPGRADE CYCLES COMPLETE');
    console.log('====================================');
    console.log(`⏱️  Total duration: ${duration.toFixed(1)}s`);
    console.log(`🔄 Cycles completed: ${attempts.length}`);

    // Show progression
    const scores = attempts.map(a => a.successScore);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const improvement = scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0;
    
    console.log(`📈 Average success: ${avgScore.toFixed(3)}/1.000`);
    console.log(`📊 Overall improvement: ${improvement >= 0 ? '+' : ''}${improvement.toFixed(3)}`);
    
    if (improvement > 0.1) {
      console.log('✅ AI is getting BETTER at upgrading itself');
    } else if (improvement > 0) {
      console.log('🔶 Modest improvement in upgrade capability');
    } else {
      console.log('❌ No improvement in upgrade effectiveness');
    }

    // Show progression chart
    console.log('\n📈 Upgrade Success Progression:');
    scores.forEach((score, i) => {
      const bar = '█'.repeat(Math.round(score * 20));
      const spaces = ' '.repeat(20 - Math.round(score * 20));
      console.log(`   Cycle ${i + 1}: [${bar}${spaces}] ${score.toFixed(3)}`);
    });

    console.log(`\n💸 Total cost: $${this.calculateCycleCost() * count} (FREE model)`);
    console.log();
  }

  private async showUpgradeStatus() {
    const history = this.upgradeEngine.getUpgradeHistory();
    const effectiveness = this.upgradeEngine.getCurrentEffectiveness();
    
    console.log('\n📊 UPGRADE STATUS REPORT');
    console.log('========================');
    console.log(`🔄 Total upgrade attempts: ${history.length}`);
    console.log(`📈 Current effectiveness: ${effectiveness.toFixed(3)}/1.000`);
    
    if (history.length === 0) {
      console.log('❌ No upgrade attempts yet. Try "upgrade" command.');
      console.log();
      return;
    }

    const recentAttempts = history.slice(-5);
    const avgSuccess = recentAttempts.reduce((sum, a) => sum + a.successScore, 0) / recentAttempts.length;
    const successCount = history.filter(a => a.successScore > 0.6).length;
    const failureCount = history.filter(a => a.successScore < 0.3).length;

    console.log(`📊 Recent average: ${avgSuccess.toFixed(3)} (last ${recentAttempts.length} attempts)`);
    console.log(`✅ Successful upgrades: ${successCount}`);
    console.log(`❌ Failed upgrades: ${failureCount}`);
    console.log(`🔶 Mixed results: ${history.length - successCount - failureCount}`);

    console.log('\n📋 Recent Upgrade Attempts:');
    recentAttempts.reverse().forEach((attempt, i) => {
      const status = attempt.successScore > 0.6 ? '✅' : attempt.successScore > 0.3 ? '🔶' : '❌';
      console.log(`   ${status} ${attempt.id}: ${attempt.description.slice(0, 50)}... (${attempt.successScore.toFixed(3)})`);
    });
    console.log();
  }

  private async showCurrentMetrics() {
    console.log('\n📊 Measuring current AI capabilities...');
    
    // This will trigger the kernel to measure itself
    const metricsSymbol = await this.kernel.prompt('current_metrics', {
      symbolId: 'capability_check',
      task: 'Perform a comprehensive self-assessment of my current capabilities. Rate myself 0.0-1.0 on: epistemic quality, recursive depth, contradiction resolution, self-awareness, and upgrade effectiveness. Be honest about strengths and weaknesses.',
      context: {
        selfAssessment: true,
        metricsCheck: true,
        timestamp: new Date().toISOString()
      },
      constraints: { maxTokens: 400 }
    });

    console.log('\n🤖 AI SELF-ASSESSMENT');
    console.log('=====================');
    console.log(metricsSymbol.payload);
    
    const deltaMetrics = metricsSymbol.meta.delta;
    if (deltaMetrics) {
      console.log('\n🔍 Δ-Layer Analysis:');
      console.log(`   Epistemic Score: ${deltaMetrics.epistemicScore?.toFixed(3) || 'N/A'}`);
      console.log(`   Meta-cognitive Depth: ${deltaMetrics.tauDepth || 0}`);
      if (deltaMetrics.phi) console.log(`   φ Suspension: Detected`);
      if (deltaMetrics.delta) console.log(`   Δ Contradiction: Detected`);
      if (deltaMetrics.lacuna) console.log(`   Λ Gap: Detected`);
    }

    console.log(`\n💸 Assessment cost: $${metricsSymbol.cost?.toFixed(6) || '0.000000'}`);
    console.log();
  }

  private async showLearnings() {
    const history = this.upgradeEngine.getUpgradeHistory();
    
    if (history.length === 0) {
      console.log('\n❌ No upgrade attempts yet. No learnings available.');
      console.log('Try running "upgrade" first.\n');
      return;
    }

    console.log('\n🧠 AI SELF-UPGRADE LEARNINGS');
    console.log('============================');
    
    // Aggregate all learnings
    const allLearnings = history.flatMap(attempt => attempt.learnings);
    const allIdeas = history.flatMap(attempt => attempt.nextUpgradeIdeas);
    const failures = history.flatMap(attempt => attempt.failureReasons).filter(f => f);
    
    console.log(`📚 Total insights gathered: ${allLearnings.length}`);
    console.log(`💡 Ideas generated: ${allIdeas.length}`);
    console.log(`⚠️  Failure modes identified: ${failures.length}`);

    if (allLearnings.length > 0) {
      console.log('\n🎯 Key Insights (most recent):');
      allLearnings.slice(-5).forEach((learning, i) => {
        console.log(`   ${i + 1}. ${learning}`);
      });
    }

    if (failures.length > 0) {
      console.log('\n❌ Common Failure Patterns:');
      failures.slice(-3).forEach((failure, i) => {
        console.log(`   ${i + 1}. ${failure}`);
      });
    }

    if (allIdeas.length > 0) {
      console.log('\n💡 Next Upgrade Ideas:');
      allIdeas.slice(-3).forEach((idea, i) => {
        console.log(`   ${i + 1}. ${idea}`);
      });
    }

    console.log();
  }

  private async watchUpgradeProcess() {
    console.log('\n👁️  UPGRADE PROCESS WATCH MODE');
    console.log('==============================');
    console.log('🔍 Observing AI self-improvement in real-time...\n');

    // This would be enhanced with real-time monitoring
    // For now, run a single upgrade with detailed logging
    await this.runSingleUpgrade();

    console.log('📊 Watch mode complete. Use "status" to see full history.\n');
  }

  private showHelp() {
    console.log('\n📖 SELF-UPGRADE LABORATORY COMMANDS');
    console.log('===================================');
    console.log('upgrade          Run single self-improvement cycle');
    console.log('cycles N         Run N recursive upgrade cycles');
    console.log('status           Show upgrade attempt history');
    console.log('metrics          Current AI capability assessment');
    console.log('learnings        What AI learned about self-improvement');
    console.log('watch            Observe upgrade process in detail');
    console.log();
    console.log('🧪 What This Laboratory Does:');
    console.log('-----------------------------');
    console.log('• AI analyzes its own capabilities');
    console.log('• AI proposes specific improvements to itself');
    console.log('• AI implements the upgrades');
    console.log('• AI measures the effectiveness');
    console.log('• AI learns what works and what doesn\'t');
    console.log('• AI gets better at upgrading itself over time');
    console.log();
    console.log('🎯 The Goal: Recursive self-improvement');
    console.log('AI that learns to improve itself more effectively.');
    console.log();
  }

  private calculateCycleCost(): number {
    // Rough estimate for one upgrade cycle
    return 0.002; // ~2000 tokens at free pricing
  }

  close() {
    this.rl.close();
  }
}

// Start the Self-Upgrade Laboratory
if (require.main === module) {
  const cli = new SelfUpgradeCLI();
  
  process.on('SIGINT', () => {
    console.log('\n\n👋 Self-upgrade laboratory shutting down...');
    cli.close();
    process.exit(0);
  });
  
  cli.start().catch((error) => {
    console.error('❌ Laboratory Error:', error);
    cli.close();
    process.exit(1);
  });
}