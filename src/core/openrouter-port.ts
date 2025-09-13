import { LLMSpec, LLMResponse, LLMPort } from './xi-kernel';

/**
 * OpenRouter LLM Port
 *
 * Reads API key from constructor (do NOT hardcode secrets in repo).
 * Uses the OpenRouter HTTP API to produce completions. This is a minimal
 * implementation intended as an example — adjust request/response parsing
 * to match the exact OpenRouter model you intend to call.
 */
export class OpenRouterLLMPort implements LLMPort {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, opts?: { baseUrl?: string; model?: string }) {
    if (!apiKey) throw new Error('OpenRouter API key required');
    this.apiKey = apiKey;
    // Use the API host by default. The website host may return HTML which
    // will break JSON parsing, so default to the API subdomain.
  // Allow the base URL to be overridden by opts or by env var. This
  // enables using an externally-hosted proxy (for example during dev)
  // by setting OPENROUTER_BASE_URL to the proxy URL.
  this.baseUrl = opts?.baseUrl || process.env.OPENROUTER_BASE_URL || 'https://api.openrouter.ai';
    // Default model can be overridden via opts or env when constructing
    this.model = opts?.model || process.env.OPENROUTER_MODEL || 'gpt-4o-mini';
  }

  private async callChatAPI(prompt: string, maxTokens = 512): Promise<any> {
    const url = `${this.baseUrl}/v1/chat/completions`;

    const body = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    // If the endpoint returns non-JSON (e.g., an HTML landing page) parsing
    // will fail. Detect common pitfalls and provide a clearer error.
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text().catch(() => '');

    if (!res.ok) {
      throw new Error(`OpenRouter API error ${res.status}: ${text}`);
    }

    if (!contentType.includes('application/json')) {
      // Return a helpful error showing the response head (but not leaking
      // secrets). This helps during verification when the wrong host is used.
      const head = text.slice(0, 400).replace(/\n+/g, ' ');
      throw new Error(`OpenRouter API returned non-JSON response: ${head}`);
    }

    return JSON.parse(text);
  }

  async prompt(symbolId: string, spec: LLMSpec): Promise<LLMResponse> {
    const prompt = spec.task;
    try {
      const data = await this.callChatAPI(prompt, spec.constraints?.maxTokens || 512);

      // Attempt to extract the text content from common response shapes
      let text = '';
      try {
        // OpenRouter chat completions: data.choices[0].message.content
        if (data?.choices && data.choices[0]) {
          text = (data.choices[0].message?.content || data.choices[0].text || '').toString();
        } else if (typeof data?.output === 'string') {
          text = data.output;
        }
      } catch (e) {
        text = JSON.stringify(data);
      }

      return {
        payload: text,
        justification: `OpenRouter response raw: ${JSON.stringify(data?.choices?.[0] ?? data).slice(0, 1000)}`,
        confidence: 0.8,
        tokensUsed: data.usage?.total_tokens ?? 0,
        model: this.model,
        cost: 0,
        timestamp: new Date()
      } as LLMResponse;
    } catch (err: any) {
      console.error('OpenRouter prompt error', err?.message ?? err);
      throw err;
    }
  }

  // The following methods provide minimal implementations and can be
  // improved to call OpenRouter endpoints for critique/link/embed if available.
  async critique(symbolId: string, target: Record<string, any>) {
    // Fallback: return an empty critique
    return [];
  }

  async link(symbolA: string, symbolB: string, relationSpec: string) {
    return [{ relation: relationSpec, confidence: 0.5 }];
  }

  async embed(payload: any): Promise<number[]> {
    // OpenRouter may not provide embeddings — return a pseudo-random embedding
    const text = JSON.stringify(payload || '').slice(0, 1000);
    const seed = Array.from(text).reduce((s, c) => s + c.charCodeAt(0), 0);
    const rnd = (n: number) => {
      let v = seed + n * 997;
      return ((v % 1000) / 1000) - 0.5;
    };
    return Array(384).fill(0).map((_, i) => rnd(i));
  }
}
