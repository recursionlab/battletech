#!/usr/bin/env tsx

/**
 * Self-Analysis Demonstration Script
 * 
 * Gives the AI kernel a voice to understand itself
 */

import { CodebaseSelfAnalyzer } from '../src/core/self-analyzer';

async function main() {
  console.log('🔍 AI Kernel Self-Analysis Beginning...\n');
  
  const analyzer = new CodebaseSelfAnalyzer();
  
  try {
    // Generate full architectural report
    console.log('📊 Generating architectural report...');
    const report = await analyzer.generateReport();
    
    console.log('\n=== CODEBASE SELF-ANALYSIS REPORT ===');
    console.log(`Generated: ${report.timestamp.toISOString()}`);
    console.log(`Risk Assessment: ${report.riskAssessment.toUpperCase()}`);
    
    // Architectural Overview
    console.log('\n🏗️  ARCHITECTURAL OVERVIEW:');
    console.log(`Total nodes: ${report.graph.nodes.size}`);
    console.log(`Dependency edges: ${report.graph.edges.size}`);
    console.log(`Circular dependencies: ${report.graph.cyclicalDependencies.length}`);
    
    // Node breakdown
    const nodeTypes = new Map<string, number>();
    for (const node of report.graph.nodes.values()) {
      nodeTypes.set(node.type, (nodeTypes.get(node.type) || 0) + 1);
    }
    
    console.log('\n📁 NODE DISTRIBUTION:');
    for (const [type, count] of nodeTypes) {
      console.log(`  ${type}: ${count} files`);
    }
    
    // Complexity analysis
    const avgComplexity = await analyzer.measureComplexity();
    console.log(`\n🧮 AVERAGE COMPLEXITY: ${avgComplexity.toFixed(2)}`);
    
    // Most complex files
    const complexNodes = Array.from(report.graph.nodes.values())
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 5);
    
    if (complexNodes.length > 0) {
      console.log('\n🔥 MOST COMPLEX FILES:');
      for (const node of complexNodes) {
        console.log(`  ${node.id}: ${node.complexity} (${node.interfaces.length} exports)`);
      }
    }
    
    // Anti-patterns
    if (report.antiPatterns.length > 0) {
      console.log('\n⚠️  ANTI-PATTERNS DETECTED:');
      for (const pattern of report.antiPatterns) {
        console.log(`  • ${pattern}`);
      }
    } else {
      console.log('\n✅ No anti-patterns detected');
    }
    
    // Suggestions
    if (report.suggestions.length > 0) {
      console.log('\n💡 SUGGESTIONS:');
      for (const suggestion of report.suggestions) {
        console.log(`  • ${suggestion}`);
      }
    }
    
    // Detailed node analysis
    console.log('\n📋 DETAILED NODE ANALYSIS:');
    for (const [id, node] of report.graph.nodes) {
      const deps = report.graph.edges.get(id) || [];
      const depth = report.graph.depthLevels.get(id) || 0;
      
      console.log(`\n  ${id}`);
      console.log(`    Type: ${node.type}`);
      console.log(`    Complexity: ${node.complexity}`);
      console.log(`    Exports: ${node.interfaces.length} (${node.interfaces.join(', ')})`);
      console.log(`    Dependencies: ${deps.length}`);
      console.log(`    Depth Level: ${depth}`);
      console.log(`    Last Modified: ${node.lastModified.toDateString()}`);
    }
    
    // Circular dependencies detail
    if (report.graph.cyclicalDependencies.length > 0) {
      console.log('\n🔄 CIRCULAR DEPENDENCIES:');
      for (let i = 0; i < report.graph.cyclicalDependencies.length; i++) {
        const cycle = report.graph.cyclicalDependencies[i];
        console.log(`  Cycle ${i + 1}: ${cycle.join(' → ')}`);
      }
    }
    
    console.log('\n✨ Self-analysis complete. The kernel has spoken.');
    
  } catch (error) {
    console.error('❌ Self-analysis failed:', error);
    process.exit(1);
  }
}

// Self-awareness activation
if (require.main === module) {
  main().catch(console.error);
}

export { main as runSelfAnalysis };