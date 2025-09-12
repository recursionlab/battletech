/**
 * Planner module - proposes subgoals for ΞKernel evaluation
 */

import type { LLMSpec, Symbol, ΞGraph } from './xi-kernel';

export interface PlanningContext {
  goal: Symbol;
  graph: ΞGraph;
  step: number;
  maxSteps: number;
}

export interface Planner {
  propose(ctx: PlanningContext): LLMSpec;
}

export class DefaultPlanner implements Planner {
  propose({ goal, step, maxSteps }: PlanningContext): LLMSpec {
    return {
      symbolId: `${goal.id}_step_${step}`,
      task: `Step ${step} toward goal: ${JSON.stringify(goal.payload)}`,
      context: { step, maxSteps },
      constraints: { maxTokens: 500, temperature: 0.7 }
    };
  }
}

