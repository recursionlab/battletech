/**
 * Example usage of the Markdown Loading System
 * 
 * Demonstrates how to use the markdown loader with the ΞKernel system
 */

import { ΞKernel } from '../core/xi-kernel';
import { KnowledgeService } from '../services/knowledge-service';
import { MarkdownLoader } from '../utils/markdown-loader';

async function demonstrateMarkdownLoading() {
  console.log('=== Markdown Loading Demo ===\n');

  // 1. Initialize kernel and knowledge service
  console.log('1. Initializing ΞKernel and KnowledgeService...');
  const kernel = new ΞKernel();
  const knowledgeService = new KnowledgeService(kernel);

  // 2. Load and ingest all markdown documents
  console.log('2. Ingesting all markdown documents...');
  try {
    const stats = await knowledgeService.ingestAll({
      autoEmbed: true,
      createSymbols: true,
      linkRelated: true,
      updateExisting: true
    });

    console.log('Ingestion completed:');
    console.log(`  - Total documents: ${stats.totalDocuments}`);
    console.log(`  - Training documents: ${stats.trainingDocuments}`);
    console.log(`  - Knowledge documents: ${stats.knowledgeDocuments}`);
    console.log(`  - Symbols created: ${stats.totalSymbols}`);
    console.log(`  - Last updated: ${stats.lastUpdated}\n`);
  } catch (error) {
    console.log('No documents found, which is expected for a new setup.\n');
  }

  // 3. Search for knowledge
  console.log('3. Searching for "systems" in knowledge base...');
  try {
    const searchResults = await knowledgeService.searchKnowledge('systems');
    console.log(`Found ${searchResults.documents.length} documents and ${searchResults.symbols.length} symbols`);
    
    searchResults.documents.forEach(doc => {
      console.log(`  - ${doc.title} (${doc.type})`);
    });
  } catch (error) {
    console.log('Search completed (no results found)');
  }

  // 4. Demonstrate direct markdown loading
  console.log('\n4. Direct markdown loading example...');
  const loader = new MarkdownLoader('data');
  
  try {
    const trainingDocs = await loader.loadTrainingData();
    const knowledgeDocs = await loader.loadKnowledgeBase();
    
    console.log(`Loaded ${trainingDocs.length} training documents`);
    console.log(`Loaded ${knowledgeDocs.length} knowledge documents`);
    
    // Show document details
    [...trainingDocs, ...knowledgeDocs].forEach(doc => {
      console.log(`  - ${doc.title}`);
      console.log(`    Tags: ${doc.tags?.join(', ') || 'none'}`);
      console.log(`    Category: ${doc.category || 'none'}`);
      console.log(`    Content length: ${doc.content.length} chars`);
    });
  } catch (error) {
    console.log('No markdown files found in data directory');
  }

  // 5. Show kernel state
  console.log('\n5. Current kernel state:');
  const kernelState = kernel.exportState();
  console.log(`  - Total symbols: ${kernelState.metadata.totalSymbols}`);
  console.log(`  - Total edges: ${kernelState.metadata.totalEdges}`);
  console.log(`  - Invariant violations: ${kernelState.metadata.invariantViolations.length}`);

  console.log('\n=== Demo Complete ===');
}

// Example of creating custom training data
async function createSampleTrainingData() {
  console.log('\n=== Creating Sample Training Data ===');
  
  const sampleDocs = [
    {
      path: 'data/training/concepts/recursion.md',
      content: `---
title: "Recursive Systems"
category: "concepts"
tags: ["recursion", "systems", "patterns"]
type: "training"
---

# Recursive Systems

A recursive system is one that contains itself as a component or refers to itself in its definition.

## Characteristics
- Self-reference
- Nested structure  
- Emergent complexity
- Fractal properties

## Examples
- Organizational hierarchies
- Software architectures
- Natural systems
- Feedback loops`
    },
    {
      path: 'data/knowledge/procedures/system-analysis.md',
      content: `---
title: "System Analysis Procedure"
category: "procedures"
tags: ["analysis", "methodology", "systems"]
type: "knowledge"
---

# System Analysis Procedure

Step-by-step process for analyzing complex systems.

## Steps

1. **Define Boundaries**: What's inside/outside the system?
2. **Identify Elements**: What are the key components?
3. **Map Relationships**: How do components interact?
4. **Understand Purpose**: What is the system trying to achieve?
5. **Analyze Behavior**: How does the system respond to changes?
6. **Find Leverage Points**: Where can interventions be most effective?

## Tools
- Systems maps
- Stakeholder analysis
- Process flows
- Feedback loop diagrams`
    }
  ];

  // Create directories if they don't exist
  const fs = await import('fs/promises');
  const path = await import('path');
  
  for (const doc of sampleDocs) {
    try {
      const dir = path.dirname(doc.path);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(doc.path, doc.content);
      console.log(`Created: ${doc.path}`);
    } catch (error) {
      console.log(`Failed to create ${doc.path}:`, error);
    }
  }
  
  console.log('Sample training data created!');
}

// Run the demo
if (require.main === module) {
  (async () => {
    await createSampleTrainingData();
    await demonstrateMarkdownLoading();
  })().catch(console.error);
}

export { demonstrateMarkdownLoading, createSampleTrainingData };