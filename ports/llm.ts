/**
 * LLM Port Abstraction - Interchangeable LLM Backends
 */

export interface LLMSpec {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  systemPrompt?: string;
}

export interface LLMReply {
  text: string;
  justification: {
    model: string;
    promptHash: string;
    timestamp: string;
    [key: string]: unknown;
  };
  confidence?: number;
  tokensUsed?: number;
  cost?: number;
}

export interface LLMPort {
  name: string;
  run(spec: LLMSpec): Promise<LLMReply>;
}

export class LLMRegistry {
  private ports = new Map<string, LLMPort>();
  private defaultPort?: string;

  register(name: string, port: LLMPort): void {
    this.ports.set(name, port);
    if (!this.defaultPort) {
      this.defaultPort = name;
    }
  }

  get(name?: string): LLMPort {
    const targetName = name ?? this.defaultPort;
    if (!targetName) {
      throw new Error("No LLM ports registered");
    }

    const port = this.ports.get(targetName);
    if (!port) {
      throw new Error(`LLM port '${targetName}' not found`);
    }

    return port;
  }

  list(): string[] {
    return Array.from(this.ports.keys());
  }
}