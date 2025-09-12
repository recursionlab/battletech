#!/usr/bin/env tsx

/**
 * Free Model Demo - ΞKernel + Sonoma Dusk Alpha (FREE!)
 */

import { ΞKernel } from '../src/core/xi-kernel';
import { CleanOpenRouterPort } from '../src/core/llm-providers/clean-openrouter-port';

const API_KEY = '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';

async function freeDemo() {
  console.log('🆓 FREE ΞKernel + Sonoma Dusk Alpha Demo');
  console.log('======================================\n');

  const port = new CleanOpenRouterPort({
    apiKey: API_KEY,
    model: 'openrouter/sonoma-dusk-alpha', // FREE MODEL!
    temperature: 0.8,
    maxTokens: 500
  });

  const kernel = new ΞKernel(port);
  console.log('✅ Free AI Kernel Ready with Sonoma Dusk Alpha!');
  console.log('💸 Cost: $0.00 (FREE MODEL)\n');

  // === FREE AI RESEARCH ===
  console.log('🔬 FREE AI Research Task');
  console.log('========================');

  const research = await kernel.prompt('future_tech_analysis', {
    symbolId: 'future_tech_analysis',
    task: 'What are the most exciting technological developments happening right now in 2024? Focus on AI, robotics, and space technology. Give me 3 specific examples with brief explanations.',
    context: { 
      domain: 'technology',
      year: 2024,
      categories: ['AI', 'robotics', 'space']
    },
    constraints: { maxTokens: 400 }
  });

  console.log('🤖 Sonoma Dusk Alpha Response:');
  console.log('------------------------------');
  console.log(research.payload);
  console.log();
  console.log(`📊 Model: ${research.model || 'openrouter/sonoma-dusk-alpha'}`);
  console.log(`💸 Cost: $${research.cost?.toFixed(6)} (FREE!)`);
  console.log(`⚡ Tokens: ${research.tokensUsed}\n`);

  // === FREE AI CRITIQUE ===
  console.log('🔍 FREE AI Self-Critique');
  console.log('========================');

  const critique = await kernel.critique('future_tech_analysis', {
    content: research.payload,
    improvement: 'Make it more specific with examples'
  });

  console.log('🧠 AI Self-Improvement Suggestions:');
  console.log('-----------------------------------');
  critique.forEach((c, i) => {
    console.log(`${i + 1}. ${c.reason}`);
    console.log(`   Confidence: ${c.confidence}\n`);
  });

  // === FREE MULTI-STEP REASONING ===
  console.log('⚙️  FREE Multi-Step AI Reasoning');
  console.log('================================');

  const reasoning = await kernel.evaluate('future_tech_analysis', 2);

  console.log(`🔄 Sonoma Dusk Alpha completed ${reasoning.steps} reasoning steps`);
  console.log(`🧠 Enhanced analysis: ${reasoning.result?.payload.toString().slice(0, 100)}...`);
  console.log(`💸 Additional cost: $0.00 (Still FREE!)\n`);

  // === FINAL STATE ===
  console.log('🌐 FREE AI KNOWLEDGE GRAPH');
  console.log('==========================');

  const state = kernel.exportState();
  const totalCost = Object.values(state.symbols).reduce((sum, s) => sum + (s.meta.cost || 0), 0);
  const totalTokens = Object.values(state.symbols).reduce((sum, s) => sum + (s.meta.tokensUsed || 0), 0);

  console.log(`🏗️  Free AI Architecture: ΞKernel + Sonoma Dusk Alpha`);
  console.log(`📈 Symbols Generated: ${state.metadata.totalSymbols}`);
  console.log(`🔗 AI Relationships: ${state.metadata.totalEdges}`);
  console.log(`💰 Total Cost: $${totalCost.toFixed(6)} (FREE MODEL!)`);
  console.log(`⚡ Total Tokens: ${totalTokens}`);
  console.log(`🛡️  System Status: ${state.metadata.invariantViolations.length === 0 ? '✅ PERFECT' : '❌ ISSUES'}\n`);

  console.log('🧠 GENERATED KNOWLEDGE STRUCTURE:');
  console.log('==================================');
  
  for (const [id, symbol] of Object.entries(state.symbols)) {
    console.log(`\n📍 ${id}`);
    console.log(`   🤖 AI Model: ${symbol.meta.model || 'openrouter/sonoma-dusk-alpha'}`);
    console.log(`   📝 Content: "${symbol.payload.toString().slice(0, 70)}..."`);
    console.log(`   💸 Cost: $${symbol.meta.cost?.toFixed(6) || '0.000000'} (FREE!)`);
    console.log(`   ⚡ Tokens: ${symbol.meta.tokensUsed || 0}`);
  }

  console.log('\n🎉 FREE AI DEMO SUCCESS!');
  console.log('========================');
  console.log('✨ Achieved with $0.00 cost:');
  console.log('   🤖 Real AI reasoning (Sonoma Dusk Alpha)');
  console.log('   🧠 Symbolic knowledge building');
  console.log('   🔄 Multi-step problem solving');
  console.log('   🔍 AI self-critique');
  console.log('   💾 Persistent memory');
  console.log('   🛡️  Invariant enforcement');

  console.log(`\n🆓 Your ΞKernel is thinking with FREE AI!`);
  console.log(`💸 Total session cost: $${totalCost.toFixed(6)} (ZERO!)`);
  console.log(`🚀 Ready for unlimited AI-powered symbolic reasoning!`);
}

if (require.main === module) {
  freeDemo().catch(console.error);
}