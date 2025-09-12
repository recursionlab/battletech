#!/usr/bin/env tsx

/**
 * LIVE ΞKernel Demo with OpenRouter
 * 
 * Real AI-powered symbolic reasoning with your API key
 */

import { ΞKernel } from '../src/core/xi-kernel';
import { OpenRouterPort } from '../src/core/llm-providers/openrouter-port';

// Your API key
const OPENROUTER_API_KEY = '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';

async function main() {
  console.log('🚀 LIVE ΞKernel + OpenRouter Demo');
  console.log('================================\n');

  try {
    // Create OpenRouter port
    const port = new OpenRouterPort({
      apiKey: OPENROUTER_API_KEY,
      model: 'openrouter/sonoma-dusk-alpha',
      temperature: 0.7,
      maxTokens: 1500,
      siteName: 'ΞKernel-Live'
    });

    console.log('✅ OpenRouter port initialized');
    console.log('🤖 Model: openrouter/sonoma-dusk-alpha');
    console.log('🔑 API Key: ' + OPENROUTER_API_KEY.slice(0, 20) + '...\n');

    // Create kernel with real AI
    const kernel = new ΞKernel(port);
    console.log('🧠 ΞKernel ready with live AI!\n');

    // === LIVE AI THINKING ===
    console.log('🧠 LIVE AI THINKING: Research Task');
    console.log('==================================');

    const research = await kernel.prompt('ai_trends_2024', {
      symbolId: 'ai_trends_2024',
      task: 'What are the most significant AI breakthroughs in 2024? Focus on practical applications and technical innovations.',
      context: { 
        domain: 'artificial_intelligence',
        year: 2024,
        focus: 'breakthroughs' 
      },
      constraints: { 
        maxTokens: 800,
        temperature: 0.8 
      }
    });

    console.log('🎯 AI Response:');
    console.log('===============');
    console.log(research.payload);
    console.log();
    
    console.log('📊 Response Metadata:');
    console.log(`   Model: ${research.model}`);
    console.log(`   Tokens: ${research.tokensUsed}`);
    console.log(`   Cost: $${research.cost?.toFixed(6) || '0.000000'}`);
    console.log(`   Confidence: ${research.confidence}\n`);

    // === AI CRITIQUE ===
    console.log('🔍 AI SELF-CRITIQUE');
    console.log('==================');

    const critiques = await kernel.critique('ai_trends_2024', {
      content: research.payload,
      focus: 'depth and accuracy'
    });

    console.log(`🤖 AI generated ${critiques.length} self-improvement suggestions:`);
    critiques.forEach((critique, i) => {
      console.log(`   ${i + 1}. ${critique.reason} (confidence: ${critique.confidence})`);
    });
    console.log();

    // === MULTI-STEP REASONING ===
    console.log('🔄 MULTI-STEP AI REASONING');
    console.log('=========================');

    const evaluation = await kernel.evaluate('ai_trends_2024', 2);

    console.log(`✅ AI completed ${evaluation.steps} reasoning steps`);
    console.log(`🧠 Final thoughts: ${evaluation.result?.payload.toString().slice(0, 100)}...`);
    console.log(`🛡️  Invariants maintained: ${evaluation.violations.length === 0 ? 'YES' : 'NO'}\n`);

    // === KNOWLEDGE GRAPH ===
    console.log('🌐 AI-GENERATED KNOWLEDGE GRAPH');
    console.log('==============================');

    const state = kernel.exportState();
    const totalCost = Object.values(state.symbols).reduce((sum, s) => sum + (s.meta.cost || 0), 0);
    
    console.log(`🏗️  Symbols created: ${state.metadata.totalSymbols}`);
    console.log(`🔗 Relationships: ${state.metadata.totalEdges}`);
    console.log(`💰 Session cost: $${totalCost.toFixed(6)}`);
    console.log(`⚡ Tokens used: ${Object.values(state.symbols).reduce((sum, s) => sum + (s.meta.tokensUsed || 0), 0)}\n`);

    console.log('🗂️  PERSISTENT KNOWLEDGE STRUCTURE:');
    for (const [id, symbol] of Object.entries(state.symbols)) {
      console.log(`\n   📍 ${id} (${symbol.typ})`);
      console.log(`      Model: ${symbol.meta.model}`);
      console.log(`      Content: "${symbol.payload.toString().slice(0, 60)}..."`);
      console.log(`      Cost: $${symbol.meta.cost?.toFixed(6) || '0.000000'}`);
      
      const edges = state.edges[id] || [];
      if (edges.length > 0) {
        edges.forEach(edge => {
          console.log(`      └─[${edge.rel}]─> ${edge.dst}`);
        });
      }
    }

    console.log('\n🎉 LIVE DEMO SUCCESS!');
    console.log('====================');
    console.log('✨ Demonstrated:');
    console.log('   • Real AI integration via OpenRouter');
    console.log('   • Live symbolic reasoning');
    console.log('   • AI self-critique and improvement');
    console.log('   • Multi-step problem solving');
    console.log('   • Persistent knowledge graph');
    console.log('   • Full cost and provenance tracking');
    console.log('\n🧠 Your ΞKernel is now thinking with real AI intelligence!');
    console.log(`💸 Total session cost: $${totalCost.toFixed(6)}`);

  } catch (error) {
    console.error('❌ Live demo failed:', error);
    
    if (error.message.includes('API')) {
      console.log('\n🔧 API Troubleshooting:');
      console.log('   1. Verify OpenRouter API key is correct');
      console.log('   2. Check OpenRouter account has credits');
      console.log('   3. Confirm model "openrouter/sonoma-dusk-alpha" is available');
      console.log('   4. Test API key at: https://openrouter.ai/activity');
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}