#!/usr/bin/env tsx

/**
 * OpenRouter + ΞKernel Live Demo
 * 
 * Real AI-powered symbolic reasoning using your OpenRouter API key
 * Uses the Sonoma Dusk Alpha model for actual thinking
 */

import { ΞKernel } from '../src/core/xi-kernel';
import { OpenRouterProvider } from '../src/core/llm-providers/openrouter-provider';

// Your API key (you can also set this in environment)
const OPENROUTER_API_KEY = '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';

async function main() {
  console.log('🚀 LIVE ΞKernel + OpenRouter Demo');
  console.log('================================\n');

  try {
    // Initialize OpenRouter provider with your API key
    const provider = new OpenRouterProvider({
      provider: 'openrouter',
      model: 'openrouter/sonoma-dusk-alpha', // Your chosen model
      temperature: 0.7,
      maxTokens: 1500,
      apiKey: OPENROUTER_API_KEY,
      siteName: 'ΞKernel-Demo'
    });

    console.log('✅ OpenRouter provider initialized');
    console.log('🤖 Model: openrouter/sonoma-dusk-alpha');
    console.log('🔑 API Key: ' + OPENROUTER_API_KEY.slice(0, 20) + '...\n');

    // Create kernel with real AI
    const kernel = new ΞKernel(provider);
    console.log('🧠 ΞKernel initialized with live AI\n');

    // === DEMO 1: Real AI Research Task ===
    console.log('🔍 DEMO 1: AI Research with Symbolic Structure');
    console.log('----------------------------------------------');

    const research = await kernel.prompt('ai_research', {
      task: 'Research the latest developments in AI reasoning systems. Focus on symbolic AI, neural-symbolic integration, and recursive thinking architectures.',
      context: { 
        depth: 'comprehensive',
        focus: 'technical innovations',
        audience: 'AI researchers' 
      },
      constraints: { 
        maxTokens: 1000,
        temperature: 0.8 
      }
    });

    console.log('🎯 Research Result:');
    console.log('-------------------');
    console.log(research.payload.slice(0, 500) + '...\n');
    
    console.log('📊 Metadata:');
    console.log(`   Model: ${research.meta.model}`);
    console.log(`   Cost: $${research.meta.cost?.toFixed(4) || '0.0000'}`);
    console.log(`   Tokens: ${research.meta.tokensUsed}`);
    console.log(`   Confidence: ${research.meta.confidence || 'N/A'}\n`);

    // === DEMO 2: Multi-Step Problem Solving ===
    console.log('🧩 DEMO 2: Multi-Step Problem Solving');
    console.log('-------------------------------------');

    const problemSolving = await kernel.evaluate('complex_problem', 3);

    console.log('✅ Problem solving completed');
    console.log(`📈 Steps executed: ${problemSolving.steps}`);
    console.log(`🔍 Invariant violations: ${problemSolving.violations.length}`);
    console.log(`📊 Final result: ${JSON.stringify(problemSolving.result?.payload).slice(0, 100)}...\n`);

    // === DEMO 3: Symbolic Relationships ===
    console.log('🔗 DEMO 3: AI-Generated Symbolic Relationships');
    console.log('----------------------------------------------');

    // Create a second symbol
    const analysis = await kernel.prompt('analysis', {
      task: 'Analyze the practical applications of the research findings above. What are the most promising implementation strategies?',
      context: { 
        relatedTo: 'ai_research',
        focus: 'implementation' 
      }
    });

    // Let AI suggest relationships
    const links = await kernel.link('ai_research', 'analysis', 'leads_to_implementation');

    console.log(`🔗 AI created ${links.length} symbolic relationships:`);
    links.forEach(link => {
      console.log(`   ${link.src} --[${link.rel}]--> ${link.dst} (confidence: ${link.weight})`);
    });
    console.log();

    // === DEMO 4: Knowledge Graph Visualization ===
    console.log('🌐 DEMO 4: Generated Knowledge Graph');
    console.log('-----------------------------------');

    const state = kernel.exportState();
    
    console.log(`🏗️  Total symbols: ${state.metadata.totalSymbols}`);
    console.log(`🔗 Total relationships: ${state.metadata.totalEdges}`);
    console.log(`💰 Total cost: $${Object.values(state.symbols).reduce((sum, s) => sum + (s.meta.cost || 0), 0).toFixed(4)}`);
    console.log(`⏱️  Session duration: ${new Date().getTime() - new Date(Object.values(state.symbols)[0]?.meta.timestamp || 0).getTime()}ms\n`);

    // Show the symbolic knowledge graph
    console.log('🧠 KNOWLEDGE GRAPH STRUCTURE:');
    console.log('============================');
    
    for (const [id, symbol] of Object.entries(state.symbols)) {
      console.log(`\n📍 ΞSymbol: ${id}`);
      console.log(`   Type: ${symbol.typ}`);
      console.log(`   Model: ${symbol.meta.model}`);
      console.log(`   Content: "${symbol.payload.toString().slice(0, 80)}..."`);
      console.log(`   Cost: $${symbol.meta.cost?.toFixed(4) || '0.0000'}`);
      console.log(`   Tokens: ${symbol.meta.tokensUsed || 0}`);
      
      const edges = state.edges[id] || [];
      if (edges.length > 0) {
        console.log('   Relationships:');
        edges.forEach(edge => {
          console.log(`     └─[${edge.rel}]─> ${edge.dst} (weight: ${edge.weight})`);
        });
      }
    }

    console.log('\n🎉 DEMO COMPLETE!');
    console.log('=================');
    console.log('✨ Successfully demonstrated:');
    console.log('   • Real AI integration via OpenRouter');
    console.log('   • Symbolic reasoning with live LLM');
    console.log('   • Persistent knowledge graph creation');
    console.log('   • Cost tracking and provenance');
    console.log('   • Multi-step problem solving');
    console.log('\n🧠 Your AI kernel is now thinking with real intelligence!');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check your OpenRouter API key');
    console.log('   2. Verify internet connection');
    console.log('   3. Ensure model "openrouter/sonoma-dusk-alpha" is available');
    console.log('   4. Check OpenRouter account credits');
  }
}

// Run the live demo
if (require.main === module) {
  main().catch(console.error);
}

export { main as runOpenRouterDemo };