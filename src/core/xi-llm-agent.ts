/**
 * ΞLLMAgent - LLM Wrapper Operating Within Symbolic Substrate
 * 
 * This bridges probabilistic AI with recursive symbolic structures
 * LLMs become agents that think within the ΞSymbol framework
 */

import { ΞSymbol, ΞPayload, ΞMetadata, ΞEvalContext } from './xi-symbol';

export interface LLMConfig {
  provider: 'local' | 'mock';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
}

export interface LLMResponse {
  content: string;
  reasoning?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface SymbolicContext {
  symbolPath: string[];
  parentPayload: ΞPayload;
  siblingPayloads: ΞPayload[];
  rootGoal?: string;
  recursionDepth: number;
  memoryKeys: string[];
}

/**
 * Abstract LLM Provider Interface
 */
export abstract class LLMProvider {
  protected config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  abstract generate(
    prompt: string, 
    context: SymbolicContext,
    systemPrompt?: string
  ): Promise<LLMResponse>;
}

/**
 * Mock LLM Provider for Testing
 */
export class MockLLMProvider extends LLMProvider {
  async generate(
    prompt: string, 
    context: SymbolicContext,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    // Simulate AI thinking with context awareness
    const thinking = [
      `I'm thinking about: ${prompt}`,
      `My path in the symbol tree: ${context.symbolPath.join(' → ')}`,
      `At recursion depth: ${context.recursionDepth}`,
      `Parent context: ${JSON.stringify(context.parentPayload)}`,
      `Available memory: ${context.memoryKeys.join(', ')}`
    ].join('\n');

    return {
      content: `Mock AI Response to: "${prompt}"\n\nBased on symbolic context, I suggest: Create sub-analysis`,
      reasoning: thinking,
      confidence: 0.75,
      metadata: {
        provider: 'mock',
        contextAware: true,
        symbolDepth: context.recursionDepth
      }
    };
  }
}


/**
 * ΞLLMAgent - LLM that operates as a ΞSymbol
 */
export class ΞLLMAgent extends ΞSymbol {
  private provider: LLMProvider;
  private systemPrompt: string;
  private lastResponse: LLMResponse | null = null;

  constructor(
    id: string,
    provider: LLMProvider,
    systemPrompt: string = "You are an AI agent thinking within a recursive symbolic system.",
    metadata: ΞMetadata = {}
  ) {
    super(id, null, {
      ...metadata,
      type: 'llm_agent',
      provider: provider.constructor.name
    });
    
    this.provider = provider;
    this.systemPrompt = systemPrompt;
  }

  /**
   * Override selfEvaluate to use LLM generation
   */
  protected async selfEvaluate(
    context: ΞEvalContext,
    childResults: ΞPayload[]
  ): Promise<ΞPayload> {
    // Build symbolic context for the LLM
    const symbolicContext: SymbolicContext = {
      symbolPath: this.getPath(),
      parentPayload: this.parent?.payload || null,
      siblingPayloads: this.parent?.children
        .filter(c => c !== this)
        .map(c => c.payload) || [],
      rootGoal: this.getRoot().payload as string,
      recursionDepth: context.depth,
      memoryKeys: Array.from(context.memory.keys())
    };

    // Generate the prompt based on current state
    const prompt = this.buildPrompt(childResults, context);
    
    // Get LLM response with full symbolic context
    this.lastResponse = await this.provider.generate(
      prompt,
      symbolicContext,
      this.systemPrompt
    );

    // Store response in metadata for introspection
    this.metadata.lastResponse = {
      content: this.lastResponse.content,
      confidence: this.lastResponse.confidence,
      timestamp: new Date().toISOString()
    };

    // Parse response for potential child symbols
    await this.parseAndSpawnChildren(this.lastResponse);

    return this.lastResponse.content;
  }

  /**
   * Build prompt based on current symbolic context
   */
  private buildPrompt(childResults: ΞPayload[], context: ΞEvalContext): string {
    let prompt = `Think about this step in the symbolic reasoning process.`;
    
    if (childResults.length > 0) {
      prompt += `\n\nChild results from deeper reasoning:\n${childResults.map((r, i) => `${i + 1}. ${JSON.stringify(r)}`).join('\n')}`;
    }

    if (this.payload) {
      prompt += `\n\nYour focus: ${JSON.stringify(this.payload)}`;
    }

    prompt += `\n\nProvide your thinking and any new symbols that should be spawned.`;
    
    return prompt;
  }

  /**
   * Parse LLM response and spawn child symbols if indicated
   */
  private async parseAndSpawnChildren(response: LLMResponse): Promise<void> {
    // Simple pattern matching for symbol spawning
    // In practice, this could be more sophisticated
    const spawnMatches = response.content.match(/SPAWN:\s*(\w+):\s*([^\n]+)/gi);
    
    if (spawnMatches) {
      for (const match of spawnMatches) {
        const parts = match.match(/SPAWN:\s*(\w+):\s*([^\n]+)/i);
        if (parts) {
          const [, symbolId, payload] = parts;
          this.spawn(symbolId, payload.trim(), {
            spawnedBy: this.id,
            spawnReason: 'llm_generation'
          });
        }
      }
    }

    // Look for thoughts that should become sub-agents
    const thoughtMatches = response.content.match(/THINK:\s*([^\n]+)/gi);
    
    if (thoughtMatches) {
      for (let i = 0; i < thoughtMatches.length; i++) {
        const thought = thoughtMatches[i].replace(/THINK:\s*/i, '').trim();
        const subAgent = new ΞLLMAgent(
          `thought_${i + 1}`,
          this.provider,
          `You are exploring: ${thought}`
        );
        subAgent.payload = thought;
        this.append(subAgent);
      }
    }
  }

  /**
   * Get the last LLM response for introspection
   */
  getLastResponse(): LLMResponse | null {
    return this.lastResponse;
  }

  /**
   * Create a new LLM agent as child with specific focus
   */
  spawnSubAgent(
    id: string, 
    focus: string, 
    systemPrompt?: string
  ): ΞLLMAgent {
    const subAgent = new ΞLLMAgent(
      id,
      this.provider,
      systemPrompt || `Focus on: ${focus}`,
      {
        parentAgent: this.id,
        focus: focus
      }
    );
    
    subAgent.payload = focus;
    return this.append(subAgent) as ΞLLMAgent;
  }

  /**
   * Generate symbolic representation including LLM state
   */
  toSymbolic(): object {
    const base = super.toSymbolic();
    return {
      ...base,
      llmState: {
        provider: this.provider.constructor.name,
        systemPrompt: this.systemPrompt,
        lastResponse: this.lastResponse ? {
          content: this.lastResponse.content.substring(0, 200) + '...',
          confidence: this.lastResponse.confidence,
          reasoning: this.lastResponse.reasoning?.substring(0, 100) + '...'
        } : null
      }
    };
  }
}

/**
 * Factory for creating different types of LLM agents
 */
export class ΞLLMAgentFactory {
  static createMockAgent(
    id: string, 
    focus: string,
    metadata: ΞMetadata = {}
  ): ΞLLMAgent {
    const provider = new MockLLMProvider({ provider: 'mock' });
    return new ΞLLMAgent(
      id,
      provider,
      `You are a mock AI agent focused on: ${focus}`,
      metadata
    );
  }


  static createReasoningChain(
    rootFocus: string,
    steps: string[],
    provider: LLMProvider
  ): ΞLLMAgent {
    const rootAgent = new ΞLLMAgent(
      'reasoning_root',
      provider,
      `You are coordinating a reasoning chain about: ${rootFocus}`
    );
    
    rootAgent.payload = rootFocus;
    
    // Create sub-agents for each reasoning step
    for (let i = 0; i < steps.length; i++) {
      const stepAgent = rootAgent.spawnSubAgent(
        `step_${i + 1}`,
        steps[i],
        `You are reasoning about step ${i + 1}: ${steps[i]}`
      );
    }
    
    return rootAgent;
  }
}

// === SYMBOLIC PROMPTING UTILITIES ===

export const ΞPrompts = {
  /**
   * Generate a prompt that makes LLMs aware of their symbolic context
   */
  symbolicAwareness: (context: SymbolicContext): string => `
You are operating within a recursive symbolic reasoning system called ΞKernel.

Your Position:
- Symbol Path: ${context.symbolPath.join(' → ')}
- Recursion Depth: ${context.recursionDepth}
- Available Memory: ${context.memoryKeys.join(', ')}

Context:
- Parent Symbol: ${JSON.stringify(context.parentPayload)}
- Sibling Symbols: ${JSON.stringify(context.siblingPayloads)}
- Root Goal: ${context.rootGoal || 'None specified'}

Instructions:
1. Think recursively - consider how your response relates to parent and child symbols
2. Use "SPAWN: symbol_id: description" to create child symbols
3. Use "THINK: reasoning" to create sub-reasoning agents
4. Be aware that your output becomes part of the symbolic structure

Remember: You are not just generating text - you are contributing to a living symbolic thought process.
  `.trim(),

  /**
   * Prompt for meta-cognitive reflection
   */
  metaCognitive: (): string => `
Engage your meta-cognitive capabilities. Reflect on:
1. What am I trying to accomplish?
2. What assumptions am I making?
3. What alternative approaches exist?
4. How does this connect to the broader symbolic context?
5. What symbols should I spawn to explore further?

Think about thinking itself.
  `.trim(),

  /**
   * Prompt for recursive problem solving
   */
  recursiveDecomposition: (problem: string): string => `
Problem: ${problem}

Apply recursive decomposition:
1. Break this into smaller sub-problems
2. For each sub-problem, use "SPAWN: subproblem_id: description"
3. Consider how sub-solutions will combine
4. Identify base cases where recursion should stop
5. Think about edge cases and error conditions

Remember: Each spawned symbol can recursively decompose further.
  `.trim()
};