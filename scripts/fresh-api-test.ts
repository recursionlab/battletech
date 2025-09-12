#!/usr/bin/env tsx

/**
 * Fresh API Key Test - ΞKernel with OpenRouter
 */

import { ΞKernel } from '../src/core/xi-kernel';
import { CleanOpenRouterPort } from '../src/core/llm-providers/clean-openrouter-port';

// Your fresh API key
const API_KEY = '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';

async function testFreshKey() {
  console.log('🔑 Testing Fresh OpenRouter API Key');
  console.log('===================================\n');

  try {
    const port = new CleanOpenRouterPort({
      apiKey: API_KEY,
      model: 'openai/gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 200
    });

    console.log('✅ Fresh API key loaded');
    console.log('🔑 Key: ' + API_KEY.slice(0, 25) + '...');
    
    const kernel = new ΞKernel(port);
    console.log('✅ ΞKernel ready\n');

    console.log('🧠 Making first AI call...');
    
    const response = await kernel.prompt('first_test', {
      symbolId: 'first_test',
      task: 'Hello! Please respond with: "ΞKernel is now connected to real AI!" and tell me what you are.',
      context: { firstTest: true },
      constraints: { maxTokens: 150 }
    });

    console.log('\n🎉 SUCCESS! Real AI Connected!');
    console.log('==============================');
    console.log(response.payload);
    console.log();
    
    console.log('📊 Connection Details:');
    console.log(`   ✅ Model: ${response.model}`);
    console.log(`   ✅ Tokens: ${response.tokensUsed}`);
    console.log(`   ✅ Cost: $${response.cost?.toFixed(6) || '0.000000'}`);
    console.log(`   ✅ Provider: ${response.metadata?.provider || 'openrouter'}`);

    // Test multiple operations
    console.log('\n🧪 Testing Multi-Step Reasoning...');
    
    const step2 = await kernel.prompt('reasoning_test', {
      symbolId: 'reasoning_test',
      task: 'Count from 1 to 5 and explain what ΞKernel does in simple terms.',
      context: { step: 2 },
      constraints: { maxTokens: 200 }
    });

    console.log('\n🧠 AI Reasoning Response:');
    console.log(step2.payload);
    console.log();

    // Show kernel state
    const state = kernel.exportState();
    const totalCost = Object.values(state.symbols).reduce((sum, s) => sum + (s.meta.cost || 0), 0);
    
    console.log('🏗️  ΞKernel State:');
    console.log(`   Symbols Created: ${state.metadata.totalSymbols}`);
    console.log(`   Total Cost: $${totalCost.toFixed(6)}`);
    console.log(`   Invariants: ${state.metadata.invariantViolations.length === 0 ? '✅ CLEAN' : '❌ VIOLATIONS'}`);

    console.log('\n🚀 LIVE ΞKernel + OpenRouter SUCCESS!');
    console.log('====================================');
    console.log('✨ Your AI kernel is now thinking with real intelligence!');
    console.log('🎯 Ready for complex symbolic reasoning tasks.');
    console.log(`💸 Session cost: $${totalCost.toFixed(6)}`);

  } catch (error) {
    console.error('\n❌ Fresh key test failed:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n🔐 Still having auth issues:');
      console.log('   - Make sure you copied the full API key');
      console.log('   - Check if the key is activated');
      console.log('   - Verify at: https://openrouter.ai/activity');
    } else if (error.message.includes('insufficient') || error.message.includes('credit')) {
      console.log('\n💳 Credits needed:');
      console.log('   - Add credits to OpenRouter account');
      console.log('   - Visit: https://openrouter.ai/credits');
    } else {
      console.log('\n🔧 Debug:');
      console.log(`   Full error: ${error.message}`);
    }
  }
}

if (require.main === module) {
  testFreshKey().catch(console.error);
}