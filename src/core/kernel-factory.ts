/**
 * ΞKernel Factory - Easy Setup with Real APIs
 * 
 * Simplifies kernel creation with different LLM providers
 */

import { ΞKernel, MockLLMPort } from './xi-kernel';
// OpenAI/Anthropic providers removed – OpenRouter or Mock only in this setup
import { envConfig } from '../config/environment';

export type ProviderType = 'mock';

export interface KernelFactoryOptions {
  provider: ProviderType;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  enableCostTracking?: boolean;
}

export class KernelFactory {
  /**
   * Create a ΞKernel with real API integration
   */
  static async create(options: KernelFactoryOptions): Promise<ΞKernel> {
    const config = envConfig.getConfig();

    switch (options.provider) {
      case 'mock':
        return new ΞKernel(new MockLLMPort());

      default:
        throw new Error(`Unknown provider: ${options.provider}`);
    }
  }

  /**
   * Create kernel with automatic provider detection
   */
  static async createAuto(): Promise<ΞKernel> {
  // With OpenRouter-only focus, if no key is configured elsewhere, use mock
  const validation = { valid: true } as any;
  if (!validation.valid) {
      console.warn('No API keys found, using mock provider');
      return this.create({ provider: 'mock' });
    }
  // Default to mock; OpenRouter usage is wired elsewhere (app.ts / ports)
  console.log('🤖 Using mock provider');
  return this.create({ provider: 'mock' });
  }

  /**
   * Quick setup for common scenarios
   */
  static async quickStart(): Promise<{
    kernel: ΞKernel;
    provider: string;
    ready: boolean;
  }> {
    try {
      const kernel = await this.createAuto();
  const config = envConfig.getConfig();
      
      console.log('✅ ΞKernel initialized successfully');
  console.log(`📡 Provider: mock`);
      console.log(`⚙️  Max recursion: ${config.kernel.maxRecursionDepth}`);
      console.log(`💰 Cost tracking: ${config.costs.enableTracking ? 'enabled' : 'disabled'}`);
      
      return {
        kernel,
  provider: 'mock',
        ready: true
      };
      
    } catch (error) {
      console.error('❌ Failed to initialize ΞKernel:', error);
      
      // Fallback to mock
      const kernel = await this.create({ provider: 'mock' });
      return {
        kernel,
        provider: 'mock',
        ready: false
      };
    }
  }
}