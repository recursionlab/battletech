/**
 * Auditor module - validates LLM responses for completion
 */

import type { LLMResponse } from './xi-kernel';

export interface AuditResult {
  approved: boolean;
  complete: boolean;
}

export interface Auditor {
  audit(response: LLMResponse): AuditResult;
}

export class CompletionAuditor implements Auditor {
  audit(response: LLMResponse): AuditResult {
    const complete = response.meta?.complete === true;
    return { approved: true, complete };
  }
}

