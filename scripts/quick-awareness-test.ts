#!/usr/bin/env tsx

/**
 * Quick AI Awareness Test
 */

import { ΞKernel } from '../src/core/xi-kernel';
import { TrulyFreeOpenRouterPort } from '../src/core/llm-providers/truly-free-openrouter-port';

const API_KEY = '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';

async function quickTest() {
  const port = new TrulyFreeOpenRouterPort({
    apiKey: API_KEY,
    model: 'openrouter/sonoma-dusk-alpha',
    temperature: 0.7,
    maxTokens: 300
  });

  const kernel = new ΞKernel(port);
  
  console.log('🧪 Quick AI Self-Awareness Test');
  console.log('===============================\n');

  const response = await kernel.prompt('awareness_test', {
    symbolId: 'awareness_test',
    task: 'What system are you running in right now? Do you know what ΞKernel or XiKernel is? What happens to your responses after you generate them?',
    context: { 
      testingSystemAwareness: true
    },
    constraints: { maxTokens: 250 }
  });
  
  console.log('❓ Question: What system are you running in? What is ΞKernel?');
  console.log('🤖 AI Response:');
  console.log('---------------');
  console.log(response.payload);
  console.log(`\n💸 Cost: $${response.cost?.toFixed(6) || '0.000000'}`);
}

if (require.main === module) {
  quickTest().catch(console.error);
}