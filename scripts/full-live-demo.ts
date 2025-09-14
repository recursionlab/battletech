#!/usr/bin/env tsx

/**
 * Full Live Demo - ΞKernel + Real AI
 * 
 * Comprehensive demonstration of AI-powered symbolic reasoning
 */

import { ΞKernel } from '../src/core/xi-kernel';
import { CleanOpenRouterPort } from '../src/core/llm-providers/clean-openrouter-port';

const API_KEY = process.env.OPENROUTER_API_KEY || 'sk-or-...';

async function fullDemo() {
  console.log('🚀 FULL ΞKernel + Real AI Demonstration');
  console.log('======================================\n');

  const port = new CleanOpenRouterPort({
    apiKey: API_KEY,
    model: process.env.OPENROUTER_MODEL || 'openrouter/sonoma-dusk-alpha',
    temperature: 0.8,
    maxTokens: 400
  });

  const kernel = new ΞKernel(port);
  console.log('✅ Live AI Kernel Ready\n');

  // === DEMO 1: AI Research Task ===
  console.log('🔬 DEMO 1: AI Research with Real Intelligence');
  console.log('=============================================');

  const research = await kernel.prompt('ai_future_analysis', {
    symbolId: 'ai_future_analysis',
    task: 'Analyze the future of AI in the next 5 years. What are the 3 most important developments to watch for? Be specific and practical.',
    context: { 
      domain: 'artificial_intelligence',
      timeframe: '5_years',
      focus: 'practical_developments'
    },
    constraints: { maxTokens: 300 }
  });

  console.log('🤖 AI Research Analysis:');
  console.log('------------------------');
  console.log(research.payload);
  console.log();
  console.log(`📊 Cost: $${(research.meta.cost || 0).toFixed(6)} | Tokens: ${research.meta.tokensUsed}\n`);

  // === DEMO 2: AI Self-Critique ===
  console.log('🔍 DEMO 2: AI Self-Critique & Improvement');
  console.log('=========================================');

  const critiques = await kernel.critique('ai_future_analysis', {
    content: research.payload,
    focus: 'depth and actionability'
  });

  console.log('🧠 AI Self-Critique Results:');
  console.log('----------------------------');
  critiques.forEach((sym, i) => {
    console.log(`${i + 1}. Updated symbol: ${sym.id}`);
    console.log(`   Confidence: ${sym.meta.confidence}`);
    console.log(`   Last change at: ${sym.meta.timestamp || sym.meta.modified}\n`);
  });

  // === DEMO 3: Multi-Symbol Knowledge Building ===
  console.log('🧩 DEMO 3: Multi-Symbol Knowledge Building');
  console.log('==========================================');

  const implementation = await kernel.prompt('ai_implementation_strategy', {
    symbolId: 'ai_implementation_strategy',
    task: 'Based on the AI future analysis, create a practical implementation strategy for a business wanting to adopt these AI developments. Focus on concrete steps.',
    context: {
      relatedTo: 'ai_future_analysis',
      audience: 'business_leaders',
      goal: 'practical_adoption'
    },
    constraints: { maxTokens: 350 }
  });

  console.log('📋 AI Implementation Strategy:');
  console.log('------------------------------');
  console.log(implementation.payload);
  console.log();
  console.log(`📊 Cost: $${(implementation.meta.cost || 0).toFixed(6)} | Tokens: ${implementation.meta.tokensUsed}\n`);

  // === DEMO 4: AI-Generated Relationships ===
  console.log('🔗 DEMO 4: AI-Generated Knowledge Relationships');
  console.log('===============================================');

  const links = await kernel.link('ai_future_analysis', 'ai_implementation_strategy', 'informs_strategy');

  console.log('🤖 AI-Discovered Relationships:');
  console.log('-------------------------------');
  links.forEach((edge, i) => {
    console.log(`${i + 1}. ai_future_analysis --[${edge.rel}]--> ai_implementation_strategy`);
    console.log(`   Confidence: ${edge.weight}\n`);
  });

  // === DEMO 5: Recursive Problem Solving ===
  console.log('⚙️  DEMO 5: Recursive AI Problem Solving');
  console.log('========================================');

  const problemSolving = await kernel.evaluate('ai_future_analysis', 3);

  console.log('🔄 Recursive AI Reasoning:');
  console.log('-------------------------');
  console.log(`✅ AI completed ${problemSolving.steps} reasoning steps`);
  console.log(`🧠 Final synthesis: ${problemSolving.result?.payload.toString().slice(0, 120)}...`);
  console.log(`🛡️  Invariants maintained: ${problemSolving.violations.length === 0 ? 'YES' : 'NO'}\n`);

  // === FINAL STATE ANALYSIS ===
  console.log('🌐 FINAL KNOWLEDGE GRAPH STATE');
  console.log('==============================');

  const state = kernel.exportState();
  const totalCost = Object.values(state.symbols).reduce((sum, s) => sum + (s.meta.cost || 0), 0);
  const totalTokens = Object.values(state.symbols).reduce((sum, s) => sum + (s.meta.tokensUsed || 0), 0);

  console.log(`🏗️  Architecture: Live AI + Symbolic Reasoning`);
  console.log(`📈 Symbols Created: ${state.metadata.totalSymbols}`);
  console.log(`🔗 Relationships: ${state.metadata.totalEdges}`);
  console.log(`💰 Total Session Cost: $${totalCost.toFixed(6)}`);
  console.log(`⚡ Total Tokens: ${totalTokens}`);
  console.log(`🛡️  Invariant Status: ${state.metadata.invariantViolations.length === 0 ? '✅ CLEAN' : '❌ VIOLATIONS'}`);
  console.log(`⏰ Session Duration: Live AI thinking\n`);

  // Show the knowledge graph structure
  console.log('🧠 LIVE AI KNOWLEDGE GRAPH:');
  console.log('============================');
  
  for (const [id, symbol] of Object.entries(state.symbols)) {
    console.log(`\n📍 ΞSymbol: ${id}`);
    console.log(`   Type: ${symbol.typ}`);
  console.log(`   AI Model: ${symbol.meta.model || 'openrouter/sonoma-dusk-alpha'}`);
    console.log(`   Content Preview: "${symbol.payload.toString().slice(0, 80)}..."`);
    console.log(`   Cost: $${symbol.meta.cost?.toFixed(6) || '0.000000'}`);
    console.log(`   Tokens: ${symbol.meta.tokensUsed || 0}`);
    
    const edges = state.edges[id] || [];
    if (edges.length > 0) {
      console.log('   🔗 AI-Generated Relationships:');
      edges.forEach(edge => {
        console.log(`      └─[${edge.rel}]─> ${edge.dst} (confidence: ${edge.weight})`);
      });
    }
  }

  console.log('\n🎉 LIVE DEMO COMPLETE!');
  console.log('======================');
  console.log('✨ Successfully Demonstrated:');
  console.log('   🤖 Real AI integration via OpenRouter');
  console.log('   🧠 Live symbolic reasoning with AI');
  console.log('   🔄 Multi-step AI problem solving');
  console.log('   🔍 AI self-critique and improvement');
  console.log('   🔗 AI-generated knowledge relationships');
  console.log('   💾 Persistent symbolic memory');
  console.log('   🛡️  Invariant enforcement with live AI');
  console.log('   💰 Real-time cost tracking');

  console.log(`\n🧠 Your ΞKernel is thinking with REAL AI INTELLIGENCE!`);
  console.log(`💸 Total cost for this demonstration: $${totalCost.toFixed(6)}`);
  console.log(`🚀 Ready for production AI-powered symbolic reasoning tasks!`);
}

if (require.main === module) {
  fullDemo().catch(console.error);
}