import { LLMSpec, LLMResponse, LLMPort } from './xi-kernel';

/**
 * Simple OpenRouter implementation without Unicode issues
 */
export class SimpleOpenRouterPort implements LLMPort {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async prompt(symbolId: string, spec: LLMSpec): Promise<LLMResponse> {
    try {
      console.log('DEBUG: API Key first 20 chars:', this.apiKey.substring(0, 20) + '...');
      console.log('DEBUG: API Key length:', this.apiKey.length);
      
      // Build ΞKernel-aware system prompt
 

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:8001',
          'X-Title': 'XiKernel'
        },
        body: JSON.stringify({
          model: 'openrouter/sonoma-dusk-alpha',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: spec.task }
          ],
          max_tokens: spec.constraints?.maxTokens || 512
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content || 'No response';

      return {
        payload: text,
        justification: `OpenRouter response`,
        confidence: 0.8,
        tokensUsed: data.usage?.total_tokens ?? 0,
        model: 'openrouter/sonoma-dusk-alpha',
        cost: 0,
        timestamp: new Date()
      } as LLMResponse;
    } catch (err: any) {
      console.error('Simple OpenRouter error:', err.message);
      throw err;
    }
  }

  async critique(symbolId: string, target: Record<string, any>): Promise<any[]> {
    return [];
  }

  async link(symbolA: string, symbolB: string, relationSpec: string) {
    return [{ relation: relationSpec, confidence: 0.5 }];
  }

  async embed(payload: any): Promise<number[]> {
    return Array(384).fill(0).map(() => Math.random() - 0.5);
  }
}