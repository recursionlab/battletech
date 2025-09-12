/**
 * ΞKernel Factory - Easy Setup with Real APIs
 * 
 * Simplifies kernel creation with different LLM providers
 */

import { ΞKernel, MockLLMPort } from './xi-kernel';

import { envConfig } from '../config/environment';

export type ProviderType = 'openai' | 'anthropic' | 'openrouter' | 'mock';

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
      case 'openrouter':
        const openrouterProvider = new OpenRouterProvider({
          provider: 'openrouter',
          model: options.model || config.openrouter.model,
          temperature: options.temperature || config.openrouter.temperature,
          maxTokens: options.maxTokens || config.openrouter.maxTokens,
          apiKey: options.apiKey || config.openrouter.apiKey || '',
          siteName: config.openrouter.siteName
        });

        if (!openrouterProvider['apiKey']) {
          throw new Error('OpenRouter API key is required. Set OPENROUTER_API_KEY environment variable.');
        }

        return new ΞKernel(openrouterProvider);
      case 'openai':
        const openaiKey = options.apiKey || config.openai.apiKey || '';
        if (!openaiKey) {
          throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable.');
        }
        const openaiPort = new OpenAIPort({
          apiKey: openaiKey,
          model: options.model || config.openai.model,
          temperature: options.temperature || config.openai.temperature,
          maxTokens: options.maxTokens || config.openai.maxTokens
        });
        return new ΞKernel(openaiPort);

      case 'anthropic':
        const anthropicKey = options.apiKey || config.anthropic.apiKey || '';
        if (!anthropicKey) {
          throw new Error('Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable.');
        }
        const anthropicPort = new AnthropicPort({
          apiKey: anthropicKey,
          model: options.model || config.anthropic.model,
          temperature: options.temperature || config.anthropic.temperature,
          maxTokens: options.maxTokens || config.anthropic.maxTokens
        });
        return new ΞKernel(anthropicPort);

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
    const validation = envConfig.validateConfig();
    
    if (!validation.valid) {
      console.warn('No API keys found, using mock provider');
      return this.create({ provider: 'mock' });
    }

    const availableProviders = envConfig.getAvailableProviders();
    
    // Prefer OpenRouter, fallback to OpenAI, then Anthropic, then mock
    if (availableProviders.includes('openrouter')) {
      console.log('🤖 Using OpenRouter provider');
      return this.create({ provider: 'openrouter' });
    } else if (availableProviders.includes('openai')) {
      console.log('🤖 Using OpenAI provider');
      return this.create({ provider: 'openai' });
    } else if (availableProviders.includes('anthropic')) {
      console.log('🤖 Using Anthropic provider');
      return this.create({ provider: 'anthropic' });
    } else {
      console.log('🤖 Using mock provider');
      return this.create({ provider: 'mock' });
    }
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
      const providers = envConfig.getAvailableProviders();
      
      console.log('✅ ΞKernel initialized successfully');
      console.log(`📡 Provider: ${providers[0] || 'mock'}`);
      console.log(`⚙️  Max recursion: ${config.kernel.maxRecursionDepth}`);
      console.log(`💰 Cost tracking: ${config.costs.enableTracking ? 'enabled' : 'disabled'}`);
      
      return {
        kernel,
        provider: providers[0] || 'mock',
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