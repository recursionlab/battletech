#!/usr/bin/env tsx

/**
 * Simple Test - ΞKernel with OpenRouter
 * 
 * Minimal test to verify API connectivity
 */

import { ΞKernel } from '../src/core/xi-kernel';
import { OpenRouterPort } from '../src/core/llm-providers/openrouter-port';

const API_KEY = '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';

async function simpleTest() {
  console.log('🧪 Simple ΞKernel + OpenRouter Test');
  console.log('===================================\n');

  try {
    // Use a widely available model
    const port = new OpenRouterPort({
      apiKey: API_KEY,
      model: 'openai/gpt-3.5-turbo', // Very standard model
      temperature: 0.7,
      maxTokens: 200,
      siteName: 'XiKernel'
    });

    console.log('✅ OpenRouter port created');
    console.log('🤖 Using model: openai/gpt-3.5-turbo');

    const kernel = new ΞKernel(port);
    console.log('✅ ΞKernel initialized\n');

    console.log('🧠 Testing AI response...');
    
    const response = await kernel.prompt('test_symbol', {
      symbolId: 'test_symbol',
      task: 'Hello! Please respond with a short greeting and confirm you are working.',
      context: { test: true },
      constraints: { maxTokens: 100 }
    });

    console.log('\n🎉 SUCCESS! AI Response:');
    console.log('========================');
    console.log(response.payload);
    console.log();
    console.log('📊 Metadata:');
    console.log(`   Model: ${response.model}`);
    console.log(`   Tokens: ${response.tokensUsed}`);
    console.log(`   Cost: $${response.cost?.toFixed(6) || '0.000000'}`);
    console.log(`   Confidence: ${response.confidence}`);

    console.log('\n✨ ΞKernel is working with real AI!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message.includes('401') || error.message.includes('403')) {
      console.log('\n🔐 Authentication issue:');
      console.log('   - Check your OpenRouter API key');
      console.log('   - Verify account has credits');
      console.log('   - Visit: https://openrouter.ai/keys');
    } else if (error.message.includes('404')) {
      console.log('\n🤖 Model issue:');
      console.log('   - Model might not be available');
      console.log('   - Check: https://openrouter.ai/models');
    } else {
      console.log('\n🌐 Network/other issue:');
      console.log('   - Check internet connection');
      console.log('   - Try again in a moment');
    }
  }
}

if (require.main === module) {
  simpleTest().catch(console.error);
}