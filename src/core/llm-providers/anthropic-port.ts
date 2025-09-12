/**

 */

import { LLMPort, LLMSpec, LLMResponse, LLMDelta } from '../xi-kernel';

interface AnthropicRequest {
  model: string;
  max_tokens: number;

}

interface AnthropicResponse {
  id: string;
  content: Array<{ type: 'text'; text: string }>;
  model: string;
  usage: { input_tokens: number; output_tokens: number };

}

export class AnthropicPort implements LLMPort {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;

    this.apiKey = config.apiKey;
    this.model = config.model || 'claude-3-sonnet-20240229';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 2000;
  }

  async prompt(symbolId: string, spec: LLMSpec): Promise<LLMResponse> {

    const request: AnthropicRequest = {
      model: this.model,
      max_tokens: spec.constraints.maxTokens || this.maxTokens,
      temperature: spec.constraints.temperature || this.temperature,

  }

  async embed(payload: any): Promise<number[]> {
    const text = typeof payload === 'string' ? payload : JSON.stringify(payload);

  }
}

