# ΞKernel - Quick Start Guide

## Overview

The ΞKernel is a write-through symbolic reasoning system that integrates LLMs with persistent symbolic structures. It provides a minimal, clean API for creating and managing symbolic AI workflows.

## Running the Examples

### Quick Start
```bash
npx tsx example.ts
```

### Full Demonstration
```bash
npx tsx scripts/kernel-demo.ts
```

## Basic Usage

```typescript
import { KernelFactory } from './src/core/kernel-factory';

// Create kernel (auto-detects available providers)
const { kernel } = await KernelFactory.quickStart();

// Create symbols manually
const symbol = kernel.createSymbol({
  id: 'my_symbol',
  typ: 'user_goal',
  payload: 'Learn symbolic AI',
  meta: { priority: 'high' }
});

// Generate content with LLM
const llmSymbol = await kernel.prompt('research_task', {
  task: 'Create a learning plan',
  context: { domain: 'AI' },
  constraints: { maxTokens: 200 }
});

// Query and export state
const retrieved = kernel.getSymbol('my_symbol');
const state = kernel.exportState();
```

## Providers

- **Mock Provider**: Always available, returns structured placeholders
- **OpenAI Provider**: Placeholder implementation (requires API integration)
- **Anthropic Provider**: Placeholder implementation (requires API integration)

## Core Features

- ✅ Write-through state management (I1)
- ✅ Provenance tracking (I2)  
- ✅ Lineage closure (I3)
- ✅ RAG discipline (I4)
- ✅ Port-based LLM interfaces
- ✅ Deterministic control loops
- ✅ Symbolic-vector memory sync

## Environment Setup

```bash
# For OpenAI (when implemented)
export OPENAI_API_KEY=your_key_here

# For Anthropic (when implemented)  
export ANTHROPIC_API_KEY=your_key_here
```

The kernel automatically falls back to the mock provider if no API keys are found.