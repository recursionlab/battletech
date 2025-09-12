#!/usr/bin/env tsx

/**
 * ΞKernel Quick Start Example
 * 
 * A simple, runnable example demonstrating the minimal API used by examples/services
 */

import { KernelFactory } from './src/core/kernel-factory';

async function main() {
  console.log('🚀 ΞKernel Quick Start Example');
  console.log('==============================\n');

  try {
    // Create kernel with automatic provider detection
    console.log('🔧 Initializing ΞKernel...');
    const result = await KernelFactory.quickStart();
    const { kernel, provider, ready } = result;
    
    console.log(`✅ Kernel ready with ${provider} provider (ready: ${ready})\n`);

    // Example 1: Create symbols manually
    console.log('📝 Example 1: Creating symbols');
    const goalSymbol = kernel.createSymbol({
      id: 'my_goal',
      typ: 'user_goal',
      payload: 'Learn about symbolic AI',
      meta: { priority: 'high' }
    });
    console.log(`   Created symbol: ${goalSymbol.id}`);

    // Example 2: Use LLM to generate content
    console.log('\n🤖 Example 2: LLM-generated content');
    const llmSymbol = await kernel.prompt('research_plan', {
      task: 'Create a research plan for symbolic AI',
      context: { domain: 'AI research', timeline: '6 months' },
      constraints: { maxTokens: 150 }
    });
    console.log(`   Generated symbol: ${llmSymbol.id}`);
    console.log(`   Content preview: "${llmSymbol.payload.slice(0, 80)}..."`);

    // Example 3: Query and export state
    console.log('\n📊 Example 3: Querying kernel state');
    const retrievedSymbol = kernel.getSymbol('my_goal');
    console.log(`   Retrieved symbol: ${retrievedSymbol?.id} (${retrievedSymbol?.typ})`);
    
    const state = kernel.exportState();
    console.log(`   Total symbols: ${state.metadata.totalSymbols}`);
    console.log(`   Total edges: ${state.metadata.totalEdges}`);

    console.log('\n🎉 Example complete! The kernel is working correctly.');
    console.log('\nℹ️  Note: This example uses mock providers by default.');
    console.log('   To use real LLM APIs, set OPENAI_API_KEY or ANTHROPIC_API_KEY environment variables.');

  } catch (error) {
    console.error('❌ Example failed:', error);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Example failed:', error);
    process.exit(1);
  });
}

export { main as runQuickStartExample };