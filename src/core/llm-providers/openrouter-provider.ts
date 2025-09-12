/**
 * OpenRouter API Integration for ΞKernel
 * 
 * Access multiple LLM providers (OpenAI, Anthropic, Meta, etc.) through OpenRouter
 * Get your API key at: https://openrouter.ai/keys
 */

import { LLMProvider, LLMResponse, SymbolicContext, LLMConfig } from '../xi-llm-agent';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
    index: number;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export class OpenRouterProvider extends LLMProvider {
  private apiKey: string;
  private baseUrl: string;
  private siteName: string;

  constructor(config: LLMConfig & { apiKey: string; siteName?: string }) {
    super(config);
    this.apiKey = config.apiKey;
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.siteName = config.siteName || 'ΞKernel';
  }

  async generate(
    prompt: string,
    context: SymbolicContext,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    const messages: OpenRouterMessage[] = [];

    // Add system prompt with symbolic context awareness
    const enhancedSystemPrompt = this.buildSystemPrompt(systemPrompt, context);
    messages.push({
      role: 'system',
      content: enhancedSystemPrompt
    });

    // Add user prompt
    messages.push({
      role: 'user',
      content: prompt
    });

    const request: OpenRouterRequest = {
      model: this.config.model || 'openai/gpt-4o-mini', // Affordable default
      messages,
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.maxTokens || 2000
    };

    try {
      const response = await this.makeAPICall(request);
      const content = response.choices[0]?.message?.content || '';

      // OpenRouter provides usage info for cost calculation
      const cost = this.calculateCost(response.usage, response.model);

      return {
        content,
        reasoning: `Generated via OpenRouter using ${response.model}`,
        confidence: this.estimateConfidence(response.choices[0]?.finish_reason),
        tokensUsed: response.usage.total_tokens,
        model: response.model,
        cost,
        timestamp: new Date(),
        metadata: {
          requestId: response.id,
          finishReason: response.choices[0]?.finish_reason,
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          symbolPath: context.symbolPath.join(' → '),
          recursionDepth: context.recursionDepth,
          provider: 'openrouter'
        }
      };

    } catch (error) {
      throw new Error(`OpenRouter API call failed: ${error}`);
    }
  }

  private buildSystemPrompt(systemPrompt: string | undefined, context: SymbolicContext): string {
    const basePrompt = systemPrompt || 'You are an AI assistant operating within ΞKernel, a recursive symbolic thinking system.';
    
    return `${basePrompt}

ΞKERNEL SYMBOLIC CONTEXT:
- Current symbol: ${context.symbolPath[context.symbolPath.length - 1]}
- Symbol lineage: ${context.symbolPath.join(' → ')}
- Recursion level: ${context.recursionDepth}
- Parent context: ${JSON.stringify(context.parentPayload)}
- Root objective: ${context.rootGoal || 'Not specified'}
- Available memory: ${context.memoryKeys.join(', ')}

OPERATIONAL INSTRUCTIONS:
1. Your response becomes a persistent symbol in the knowledge graph
2. Think recursively - consider parent/child symbol relationships
3. Use "SPAWN: symbol_id: description" to create child reasoning nodes
4. Use "LINK: symbol_a -> symbol_b: relation_type" for semantic connections
5. Use "MEMORY: key: value" to store important context for later retrieval
6. Be precise and actionable - avoid generic responses

You are contributing to a living symbolic reasoning process that persists across sessions.`;
  }

  private async makeAPICall(request: OpenRouterRequest): Promise<OpenRouterResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/your-username/xi-kernel', // Optional
        'X-Title': this.siteName
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${error}`);
    }

    return await response.json();
  }

  private calculateCost(usage: any, model: string): number {
    // OpenRouter provides actual costs, but here are some estimates
    // Check https://openrouter.ai/models for current pricing
    const costs: Record<string, { input: number; output: number }> = {
      // OpenAI models via OpenRouter
      'openai/gpt-4o': { input: 2.5 / 1000000, output: 10 / 1000000 },
      'openai/gpt-4o-mini': { input: 0.15 / 1000000, output: 0.6 / 1000000 },
      'openai/gpt-4-turbo': { input: 10 / 1000000, output: 30 / 1000000 },
      'openai/gpt-3.5-turbo': { input: 0.5 / 1000000, output: 1.5 / 1000000 },
      
      // Anthropic models via OpenRouter
      'anthropic/claude-3.5-sonnet': { input: 3 / 1000000, output: 15 / 1000000 },
      'anthropic/claude-3-haiku': { input: 0.25 / 1000000, output: 1.25 / 1000000 },
      
      // Meta models (often cheaper)
      'meta-llama/llama-3.1-70b-instruct': { input: 0.59 / 1000000, output: 0.79 / 1000000 },
      'meta-llama/llama-3.1-8b-instruct': { input: 0.055 / 1000000, output: 0.055 / 1000000 },
      
      // Mistral models
      'mistralai/mistral-7b-instruct': { input: 0.06 / 1000000, output: 0.06 / 1000000 },
      
      // Google models
      'google/gemini-flash-1.5': { input: 0.075 / 1000000, output: 0.3 / 1000000 }
    };

    const modelCost = costs[model] || { input: 1 / 1000000, output: 3 / 1000000 }; // Default estimate
    return (usage.prompt_tokens * modelCost.input) + (usage.completion_tokens * modelCost.output);
  }

  private estimateConfidence(finishReason: string | undefined): number {
    switch (finishReason) {
      case 'stop': return 0.9;
      case 'length': return 0.7; // Truncated due to max_tokens
      case 'content_filter': return 0.3;
      case 'tool_calls': return 0.85;
      default: return 0.6;
    }
  }

  /**
   * Get available models from OpenRouter
   * Useful for dynamic model selection
   */
  static getRecommendedModels(): Record<string, { name: string; description: string; costLevel: 'low' | 'medium' | 'high' }> {
    return {
      'openai/gpt-4o-mini': {
        name: 'GPT-4o Mini',
        description: 'Fast and affordable, great for most tasks',
        costLevel: 'low'
      },
      'meta-llama/llama-3.1-8b-instruct': {
        name: 'Llama 3.1 8B',
        description: 'Very cheap, good for simple tasks',
        costLevel: 'low'
      },
      'anthropic/claude-3-haiku': {
        name: 'Claude 3 Haiku', 
        description: 'Fast and cheap Claude model',
        costLevel: 'low'
      },
      'openai/gpt-4o': {
        name: 'GPT-4o',
        description: 'High performance, good reasoning',
        costLevel: 'medium'
      },
      'anthropic/claude-3.5-sonnet': {
        name: 'Claude 3.5 Sonnet',
        description: 'Excellent reasoning and coding',
        costLevel: 'medium'
      },
      'openai/gpt-4-turbo': {
        name: 'GPT-4 Turbo',
        description: 'Most capable OpenAI model',
        costLevel: 'high'
      }
    };
  }
}