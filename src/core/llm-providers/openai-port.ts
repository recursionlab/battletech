/**

 */

import { LLMPort, LLMSpec, LLMResponse, LLMDelta } from '../xi-kernel';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}


  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;

  id: string;
  choices: Array<{
    message: { content: string; role: string };
    finish_reason: string;
  }>;

  data: Array<{ embedding: number[] }>;
}

export class OpenAIPort implements LLMPort {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private maxTokens: number;

    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4o-mini';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 2000;

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: spec.task }
    ];


  }

  async embed(payload: any): Promise<number[]> {
    const text = typeof payload === 'string' ? payload : JSON.stringify(payload);

  }
}

