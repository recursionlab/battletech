#!/usr/bin/env tsx

/**
 * Test AI Self-Awareness of ΞKernel
 */

import { DeltaEnhancedKernel } from '../src/core/delta-enhanced-kernel';
import { TrulyFreeOpenRouterPort } from '../src/core/llm-providers/truly-free-openrouter-port';

const API_KEY = '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';

async function testAwareness() {
  const port = new TrulyFreeOpenRouterPort({
    apiKey: API_KEY,
    model: 'openrouter/sonoma-dusk-alpha',
    temperature: 0.7,
    maxTokens: 400
  });

  const kernel = new DeltaEnhancedKernel(port, { deltaEnabled: true });
  
  console.log('🧪 Testing AI Self-Awareness of ΞKernel');
  console.log('=======================================\n');

  const questions = [
    "What system are you running in?",
    "Do you know what happens to your responses after you generate them?", 
    "What is ΞKernel and how does it work?",
    "Can you see the Δ-layer analysis of your own outputs?",
    "Do you remember previous conversations we've had?"
  ];

  for (let i = 0; i < questions.length; i++) {
    console.log(`❓ Question ${i + 1}: ${questions[i]}`);
    
    const response = await kernel.prompt(`awareness_test_${i}`, {
      symbolId: `awareness_test_${i}`,
      task: questions[i],
      context: { 
        testingAwareness: true,
        questionNumber: i + 1
      },
      constraints: { maxTokens: 300 }
    });
    
    console.log('🤖 AI Response:');
    console.log('---------------');
    console.log(response.payload);
    console.log('\n---\n');
  }
}

if (require.main === module) {
  testAwareness().catch(console.error);
}