import { LLMResponse } from '../core/xi-kernel';

export const auditor = {
  verify(goalId: string, response: LLMResponse): boolean {
    if (!response || typeof response.payload === 'undefined') {
      console.warn(`Auditor: missing payload for ${goalId}`);
      return false;
    }
    return true;
  }
};
