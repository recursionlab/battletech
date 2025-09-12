#!/usr/bin/env tsx

/**
 * Truly Free Demo - ΞKernel + Sonoma Dusk Alpha ($0.00)
 */

import { ΞKernel } from '../src/core/xi-kernel';
import { TrulyFreeOpenRouterPort } from '../src/core/llm-providers/truly-free-openrouter-port';

const API_KEY = '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';

async function trulyFreeDemo() {
  console.log('💸 TRULY FREE ΞKernel Demo (Corrected Costs)');
  console.log('===========================================\n');

  const port = new TrulyFreeOpenRouterPort({
    apiKey: API_KEY,
    model: 'openrouter/sonoma-dusk-alpha', // FREE MODEL
    temperature: 0.8,
    maxTokens: 400
  });

  const kernel = new ΞKernel(port);
  console.log('✅ Free AI Kernel Ready');
  console.log('🤖 Model: openrouter/sonoma-dusk-alpha');
  console.log('💸 Cost: $0.00 (Truly FREE!)\n');

  // === FREE AI TASK ===
  console.log('🧠 FREE AI Analysis Task');
  console.log('========================');

  const analysis = await kernel.prompt('programming_trends_2024', {
    symbolId: 'programming_trends_2024',
    task: 'What are the top 3 programming trends in 2024? Focus on languages, frameworks, or development practices that are gaining momentum. Be specific with examples.',
    context: { 
      domain: 'software_development',
      year: 2024,
      focus: 'emerging_trends'
    },
    constraints: { maxTokens: 350 }
  });

  console.log('🤖 Sonoma Dusk Alpha Response:');
  console.log('------------------------------');
  console.log(analysis.payload);
  console.log();
  console.log('📊 Response Details:');
  console.log(`   Model: ${analysis.model}`);
  console.log(`   Tokens Used: ${analysis.tokensUsed}`);
  console.log(`   Cost: $${analysis.cost?.toFixed(6)} (Should be $0.000000)`);
  console.log(`   Confidence: ${analysis.confidence}\n`);

  // === FREE CRITIQUE ===
  console.log('🔍 FREE AI Self-Critique');
  console.log('========================');

  const critiques = await kernel.critique('programming_trends_2024', {
    content: analysis.payload,
    focus: 'add more specific examples'
  });

  console.log('🧠 AI Self-Improvement:');
  console.log('-----------------------');
  critiques.forEach((c, i) => {
    console.log(`${i + 1}. ${c.reason}`);
    console.log(`   Changes: ${JSON.stringify(c.changes)}`);
    console.log(`   Confidence: ${c.confidence}\n`);
  });

  // === RELATIONSHIP BUILDING ===
  console.log('🔗 FREE AI Relationship Discovery');
  console.log('=================================');

  const followup = await kernel.prompt('implementation_guide', {
    symbolId: 'implementation_guide',
    task: 'Based on the programming trends analysis, create a practical guide for developers wanting to stay current. What should they learn first?',
    context: { 
      relatedTo: 'programming_trends_2024',
      audience: 'developers',
      actionable: true
    },
    constraints: { maxTokens: 300 }
  });

  console.log('📋 Implementation Guide:');
  console.log('------------------------');
  console.log(followup.payload);
  console.log();
  console.log(`   Cost: $${followup.cost?.toFixed(6)} (Should be $0.000000)\n`);

  // Create AI relationship
  const links = await kernel.link('programming_trends_2024', 'implementation_guide', 'leads_to_action');
  
  console.log('🤖 AI-Discovered Relationship:');
  console.log('------------------------------');
  links.forEach(link => {
    console.log(`   programming_trends_2024 --[${link.relation}]--> implementation_guide`);
    console.log(`   Confidence: ${link.confidence}\n`);
  });

  // === FINAL COST ANALYSIS ===
  console.log('💰 FINAL COST ANALYSIS');
  console.log('======================');

  const state = kernel.exportState();
  const totalCost = Object.values(state.symbols).reduce((sum, s) => sum + (s.meta.cost || 0), 0);
  const totalTokens = Object.values(state.symbols).reduce((sum, s) => sum + (s.meta.tokensUsed || 0), 0);

  console.log(`🏗️  Symbols Generated: ${state.metadata.totalSymbols}`);
  console.log(`⚡ Total Tokens Processed: ${totalTokens}`);
  console.log(`💸 TOTAL SESSION COST: $${totalCost.toFixed(6)}`);
  
  if (totalCost === 0.0) {
    console.log('✅ SUCCESS: Truly $0.00 cost confirmed!');
  } else {
    console.log('❌ ISSUE: Cost calculation still showing charges');
    console.log('   This should be $0.000000 for the free model');
  }

  console.log('\n🧠 KNOWLEDGE GENERATED:');
  console.log('=======================');
  
  for (const [id, symbol] of Object.entries(state.symbols)) {
    console.log(`\n📍 ${id}`);
    console.log(`   Content: "${symbol.payload.toString().slice(0, 60)}..."`);
    console.log(`   Cost: $${symbol.meta.cost?.toFixed(6) || '0.000000'}`);
    console.log(`   Tokens: ${symbol.meta.tokensUsed || 0}`);
  }

  console.log('\n🎉 FREE AI DEMO COMPLETE!');
  console.log('=========================');
  console.log(`💸 Expected Cost: $0.000000`);
  console.log(`💸 Actual Cost: $${totalCost.toFixed(6)}`);
  console.log(`🤖 Model: Sonoma Dusk Alpha (Free during testing)`);
  console.log(`🚀 ΞKernel + Free AI = Unlimited symbolic reasoning!`);
}

if (require.main === module) {
  trulyFreeDemo().catch(console.error);
}