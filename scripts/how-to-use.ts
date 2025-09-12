#!/usr/bin/env tsx

/**
 * How to Use Your ΞKernel - Interactive Guide
 * 
 * Shows exactly how to feed knowledge, send prompts, and use the system
 */

import { ΞKernel } from '../src/core/xi-kernel';
import { TrulyFreeOpenRouterPort } from '../src/core/llm-providers/truly-free-openrouter-port';

const API_KEY = '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';

async function howToUse() {
  console.log('📚 HOW TO USE YOUR ΞKernel');
  console.log('==========================\n');

  // === STEP 1: Initialize Your Kernel ===
  console.log('🚀 STEP 1: Initialize Your AI Kernel');
  console.log('====================================');

  const port = new TrulyFreeOpenRouterPort({
    apiKey: API_KEY,
    model: 'openrouter/sonoma-dusk-alpha',
    temperature: 0.7,
    maxTokens: 500
  });

  const kernel = new ΞKernel(port);
  console.log('✅ Your AI kernel is ready!\n');

  // === STEP 2: Basic Prompt/Question ===
  console.log('💬 STEP 2: Send Basic Prompts');
  console.log('=============================');
  console.log('Code: await kernel.prompt(id, { task: "question", context: {} })\n');

  const basicResponse = await kernel.prompt('my_first_question', {
    symbolId: 'my_first_question',
    task: 'Explain what machine learning is in simple terms. Give me 3 key points.',
    context: { audience: 'beginner', format: 'simple' },
    constraints: { maxTokens: 200 }
  });

  console.log('🤖 AI Response:');
  console.log(basicResponse.payload);
  console.log(`💸 Cost: $${basicResponse.cost?.toFixed(6)}\n`);

  // === STEP 3: Feed Knowledge ===
  console.log('📖 STEP 3: Feed Knowledge to the System');
  console.log('=======================================');
  console.log('Method 1: Direct information injection\n');

  const knowledge = await kernel.prompt('company_info', {
    symbolId: 'company_info',
    task: 'Store this information: Our company makes sustainable energy solutions. We have 500 employees and focus on solar panels and battery storage. Our main market is residential homes.',
    context: { 
      type: 'knowledge_storage',
      domain: 'company_data'
    },
    constraints: { maxTokens: 150 }
  });

  console.log('✅ Knowledge stored as symbol "company_info"');
  console.log(`Content preview: "${knowledge.payload.slice(0, 80)}..."\n`);

  // === STEP 4: Ask Questions About Stored Knowledge ===
  console.log('❓ STEP 4: Query Your Knowledge Base');
  console.log('===================================');

  const query = await kernel.prompt('company_analysis', {
    symbolId: 'company_analysis',
    task: 'Based on what you know about our company, what are 3 potential growth opportunities?',
    context: { 
      relatedTo: 'company_info',
      analysisType: 'growth_opportunities'
    },
    constraints: { maxTokens: 250 }
  });

  console.log('🧠 AI Analysis of Your Knowledge:');
  console.log(query.payload);
  console.log();

  // === STEP 5: Build Relationships ===
  console.log('🔗 STEP 5: Create Knowledge Relationships');
  console.log('=========================================');

  const links = await kernel.link('company_info', 'company_analysis', 'supports_analysis');
  console.log('✅ Created relationship: company_info → company_analysis');
  console.log(`Confidence: ${links[0]?.confidence}\n`);

  // === STEP 6: Multi-step Reasoning ===
  console.log('🔄 STEP 6: Multi-step Problem Solving');
  console.log('=====================================');

  const problemSolving = await kernel.evaluate('company_info', 2);
  console.log(`✅ AI performed ${problemSolving.steps} reasoning steps`);
  console.log(`🧠 Final insights: ${problemSolving.result?.payload.slice(0, 100)}...\n`);

  // === STEP 7: View Your Knowledge Graph ===
  console.log('🌐 STEP 7: Inspect Your Knowledge Graph');
  console.log('=======================================');

  const state = kernel.exportState();
  console.log(`📊 Your knowledge base contains:`);
  console.log(`   - ${state.metadata.totalSymbols} pieces of knowledge`);
  console.log(`   - ${state.metadata.totalEdges} relationships`);
  console.log(`   - All preserved across sessions!\n`);

  console.log('📝 Your Knowledge Base Structure:');
  for (const [id, symbol] of Object.entries(state.symbols)) {
    console.log(`\n   📍 ${id}`);
    console.log(`      Type: ${symbol.typ}`);
    console.log(`      Content: "${symbol.payload.toString().slice(0, 60)}..."`);
    console.log(`      Created: ${symbol.meta.timestamp?.slice(0, 19)}`);
  }

  console.log('\n📋 USAGE PATTERNS');
  console.log('=================');
  
  console.log('\n💡 Common Use Cases:');
  console.log('-------------------');
  console.log('1. 📚 Knowledge Base: Store documents, facts, research');
  console.log('2. 🧠 Analysis: Ask questions about stored knowledge');
  console.log('3. 🔄 Problem Solving: Multi-step reasoning on complex issues');
  console.log('4. 🔗 Research: Build connections between different topics');
  console.log('5. 💼 Business: Store company info, analyze opportunities');
  console.log('6. 📖 Learning: Build personal knowledge graphs');

  console.log('\n⌨️  Basic Commands:');
  console.log('------------------');
  console.log('// Store information');
  console.log('await kernel.prompt("topic_id", {');
  console.log('  task: "Remember: [your information]",');
  console.log('  context: { type: "knowledge" }');
  console.log('});');
  console.log();
  console.log('// Ask questions');
  console.log('await kernel.prompt("question_id", {');
  console.log('  task: "What do you know about [topic]?",');
  console.log('  context: { relatedTo: "topic_id" }');
  console.log('});');
  console.log();
  console.log('// Get analysis');
  console.log('await kernel.evaluate("topic_id", 3);');

  console.log('\n🎯 NEXT STEPS');
  console.log('=============');
  console.log('1. Try feeding it your own knowledge');
  console.log('2. Ask questions about what you stored');
  console.log('3. Use it for research and analysis');
  console.log('4. Build your personal AI knowledge assistant');
  console.log();
  console.log('💸 All FREE with Sonoma Dusk Alpha!');
  console.log('🧠 Your AI remembers everything across sessions!');
}

if (require.main === module) {
  howToUse().catch(console.error);
}