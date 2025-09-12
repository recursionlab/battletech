#!/usr/bin/env tsx

/**
 * Clean Test - XiKernel with OpenRouter (No Unicode)
 */

import { ΞKernel } from '../src/core/xi-kernel';
import { CleanOpenRouterPort } from '../src/core/llm-providers/clean-openrouter-port';

const API_KEY = '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';

async function cleanTest() {
  console.log('🧪 Clean XiKernel + OpenRouter Test');
  console.log('===================================\n');

  try {
    const port = new CleanOpenRouterPort({
      apiKey: API_KEY,
      model: 'openai/gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 150
    });

    console.log('✅ Clean OpenRouter port created');
    
    const kernel = new ΞKernel(port);
    console.log('✅ XiKernel initialized\n');

    console.log('🧠 Testing real AI...');
    
    const response = await kernel.prompt('hello_test', {
      symbolId: 'hello_test',
      task: 'Say hello and tell me one interesting fact about AI.',
      context: { test: true },
      constraints: { maxTokens: 100 }
    });

    console.log('\n🎉 SUCCESS! Real AI Response:');
    console.log('=============================');
    console.log(response.payload);
    console.log();
    
    console.log('📊 Response Details:');
    console.log(`   Model Used: ${response.model}`);
    console.log(`   Tokens: ${response.tokensUsed}`);
    console.log(`   Cost: $${response.cost?.toFixed(6) || '0.000000'}`);
    console.log(`   Timestamp: ${response.timestamp}`);

    // Test the kernel state
    const state = kernel.exportState();
    console.log('\n🏗️  Kernel State:');
    console.log(`   Symbols: ${state.metadata.totalSymbols}`);
    console.log(`   Edges: ${state.metadata.totalEdges}`);
    console.log(`   Invariants: ${state.metadata.invariantViolations.length === 0 ? 'CLEAN' : 'VIOLATIONS'}`);

    console.log('\n✨ XiKernel is LIVE with real AI!');
    console.log('🎯 Ready for complex symbolic reasoning tasks.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n🔐 API Key Issue:');
      console.log('   - Check your OpenRouter API key');
      console.log('   - Verify at: https://openrouter.ai/keys');
    } else if (error.message.includes('insufficient')) {
      console.log('\n💳 Credits Issue:');
      console.log('   - Add credits to your OpenRouter account');
      console.log('   - Visit: https://openrouter.ai/credits');
    } else {
      console.log('\n🔧 Debug info:');
      console.log(`   Error: ${error.message}`);
    }
  }
}

if (require.main === module) {
  cleanTest().catch(console.error);
}