/**
 * OpenAI API Integration for ΞKernel
 * 
 * Real LLM provider that connects to OpenAI's API
 */

import { LLMProvider, AgentLLMResponse, SymbolicContext, LLMConfig } from '../xi-llm-agent';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  seed?: number;
}

interface OpenAIResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export class OpenAIProvider extends LLMProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: LLMConfig & { apiKey: string }) {
    super(config);
    this.apiKey = config.apiKey;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  async generate(
    prompt: string,
    context: SymbolicContext,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    const messages: OpenAIMessage[] = [];

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

    const seed = Math.floor(Math.random() * 10000);
    
    const request: OpenAIRequest = {
      model: this.config.model || 'gpt-4',
      messages,
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.maxTokens || 2000,
      seed
    };

    try {
      const response = await this.makeAPICall(request);
      const content = response.choices[0]?.message?.content || '';

      // Calculate approximate cost (rough estimates)
      const cost = this.calculateCost(response.usage, response.model);

      return {
        content,
        reasoning: `Generated via OpenAI ${response.model}`,
        confidence: this.estimateConfidence(response.choices[0]?.finish_reason),
        tokensUsed: response.usage.total_tokens,
        model: response.model,
        seed,
        cost,
        timestamp: new Date(),
        metadata: {
          requestId: response.id,
          finishReason: response.choices[0]?.finish_reason,
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          symbolPath: context.symbolPath.join(' → '),
          recursionDepth: context.recursionDepth
        }
      };

    } catch (error) {
      throw new Error(`OpenAI API call failed: ${error}`);
    }
  }

  private buildSystemPrompt(systemPrompt: string | undefined, context: SymbolicContext): string {
    const basePrompt = systemPrompt || 'You are an AI assistant operating within a recursive symbolic thinking system.';
    
    return `${basePrompt}

SYMBOLIC CONTEXT:
- You are symbol: ${context.symbolPath[context.symbolPath.length - 1]}
- Full path: ${context.symbolPath.join(' → ')}
- Recursion depth: ${context.recursionDepth}
- Parent context: ${JSON.stringify(context.parentPayload)}
- Root goal: ${context.rootGoal || 'None'}

INSTRUCTIONS:
1. Your response will become part of a persistent symbolic structure
2. Consider how your output relates to parent and child symbols
3. Use "SPAWN: symbol_id: description" to suggest child symbols
4. Use "LINK: symbol_a -> symbol_b: relationship" to suggest connections
5. Be specific and actionable - avoid generic responses

Remember: You're not just chatting - you're contributing to a living knowledge graph.`;
  }

  private async makeAPICall(request: OpenAIRequest): Promise<OpenAIResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${error}`);
    }

    return await response.json();
  }

  private calculateCost(usage: any, model: string): number {
    // Rough cost estimates (as of 2024 - update these)
    const costs: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
      'gpt-4-turbo': { input: 0.01 / 1000, output: 0.03 / 1000 },
      'gpt-3.5-turbo': { input: 0.0015 / 1000, output: 0.002 / 1000 }
    };

    const modelCost = costs[model] || costs['gpt-4'];
    return (usage.prompt_tokens * modelCost.input) + (usage.completion_tokens * modelCost.output);
  }

  private estimateConfidence(finishReason: string | undefined): number {
    switch (finishReason) {
      case 'stop': return 0.9;
      case 'length': return 0.7; // Truncated
      case 'content_filter': return 0.3;
      default: return 0.5;
    }
  }
}