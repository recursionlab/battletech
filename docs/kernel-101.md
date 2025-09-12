# Kernel 101

## Core Concepts
- Write-through state ownership
- Provenance tracking for each symbol
- Lineage closure enforced on edges
- RAG discipline keeps vectors synced

## API Surface
- `prompt(id, spec)`
- `critique(id, target)`
- `link(a, b, relation)`
- `evaluate(goalId, maxSteps?)`
- `exportState()`

## Basic Usage
```typescript
import { ΞKernel } from '../src/core/xi-kernel';

const kernel = new ΞKernel();
const note = await kernel.prompt('note', { task: 'summarize', context: {} });
const report = await kernel.evaluate('note', 3);
console.log(report.result.payload);
```
