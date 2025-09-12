import { LLMSpec } from '../core/xi-kernel';

export interface PlanningContext {
  step: number;
  maxSteps: number;
  goalPayload: any;
}

export const planner = {
  next(goalId: string, context: PlanningContext): LLMSpec {
    return {
      symbolId: goalId,
      task: `Step ${context.step} toward goal: ${JSON.stringify(context.goalPayload)}`,
      context: { step: context.step, maxSteps: context.maxSteps },
      constraints: { maxTokens: 500, temperature: 0.7 }
    };
  }
};
