import { describe, it, expect } from 'vitest';
import { ΞKernel, MockLLMPort } from '../../src/core/xi-kernel';

describe('ΞKernel lineage tracking', () => {
  it('adds parent to lineage and creates edge', async () => {
    const kernel = new ΞKernel(new MockLLMPort());
    await kernel.prompt('parent', { task: 'root' });
    const child = await kernel.prompt('child', { parentId: 'parent', task: 'child' });
    expect(child.lineage).toEqual(['parent']);
    const edges = kernel.getEdges('parent');
    const hasEdge = edges.some(e => e.dst === 'child' && e.rel === 'parent');
    expect(hasEdge).toBe(true);
  });
});
