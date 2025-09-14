/**
 * OpenRouter LLM Port Implementation
 */

import { LLMPort, LLMSpec, LLMReply } from './llm';

export class OpenRouterPort implements LLMPort {
  readonly name = 'openrouter';

  constructor(
    private apiKey: string,
    private defaultModel = 'openrouter/sonoma-dusk-alpha'
  ) {}

  async run(spec: LLMSpec): Promise<LLMReply> {
    const promptHash = this.hashPrompt(spec);
    const model = spec.model ?? this.defaultModel;

    const messages: Array<{role: string, content: string}> = [];

    if (spec.systemPrompt) {
      messages.push({ role: 'system', content: spec.systemPrompt });
    }

    messages.push({ role: 'user', content: spec.prompt });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:8001',
        'X-Title': 'Xi-Kernel'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: spec.maxTokens ?? 4000,
        temperature: spec.temperature ?? 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || 'No response';

    return {
      text,
      justification: {
        model,
        promptHash,
        timestamp: new Date().toISOString(),
        tokensUsed: data.usage?.total_tokens ?? 0,
        provider: 'openrouter'
      },
      confidence: 0.8, // Default confidence for OpenRouter
      tokensUsed: data.usage?.total_tokens ?? 0,
      cost: 0 // OpenRouter doesn't provide cost in response
    };
  }

  private hashPrompt(spec: LLMSpec): string {
    const hashInput = JSON.stringify({
      prompt: spec.prompt,
      systemPrompt: spec.systemPrompt,
      temperature: spec.temperature,
      maxTokens: spec.maxTokens
    });
    return Buffer.from(hashInput).toString('base64').slice(0, 16);
  }
}