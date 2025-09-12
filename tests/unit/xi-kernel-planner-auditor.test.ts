import { describe, it, expect } from 'vitest';
import { ΞKernel, MockLLMPort } from '../../src/core/xi-kernel';

// Ensure planner selects subgoals and auditor validates completion

describe('Planner and Auditor integration', () => {
  it('stops when auditor marks completion', async () => {
    const kernel = new ΞKernel(new MockLLMPort());
    (kernel as any).createSymbol('goal', 'goal', { task: 'test' }, {
      model: 'mock',
      promptHash: 'hash',
      timestamp: new Date().toISOString(),
      kernelWritten: true
    });
    const result = await kernel.evaluate('goal', 3);
    const final = kernel.getSymbol('goal_step_3');
    expect(result.steps).toBe(3);
    expect(final?.meta.complete).toBe(true);
  });
});

