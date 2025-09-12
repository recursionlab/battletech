/**
 * Environment Configuration for ΞKernel
 * 
 * Loads API keys and configuration from environment variables
 */

interface KernelConfig {
  openai: {
    apiKey?: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  anthropic: {
    apiKey?: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  kernel: {
    maxRecursionDepth: number;
    enableVectorSync: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  costs: {
    maxDailyCost: number;
    warnThreshold: number;
    enableTracking: boolean;
  };
}

class EnvironmentConfig {
  private config: KernelConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): KernelConfig {
    // In Node.js, you'd use process.env
    // For browser/other environments, adapt as needed
    const env = typeof process !== 'undefined' ? process.env : {};

    return {
      openai: {
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL || 'gpt-4',
        temperature: parseFloat(env.OPENAI_TEMPERATURE || '0.7'),
        maxTokens: parseInt(env.OPENAI_MAX_TOKENS || '2000')
      },
      anthropic: {
        apiKey: env.ANTHROPIC_API_KEY,
        model: env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
        temperature: parseFloat(env.ANTHROPIC_TEMPERATURE || '0.7'),
        maxTokens: parseInt(env.ANTHROPIC_MAX_TOKENS || '2000')
      },
      kernel: {
        maxRecursionDepth: parseInt(env.KERNEL_MAX_RECURSION_DEPTH || '10'),
        enableVectorSync: env.KERNEL_ENABLE_VECTOR_SYNC !== 'false',
        logLevel: (env.KERNEL_LOG_LEVEL as any) || 'info'
      },
      costs: {
        maxDailyCost: parseFloat(env.MAX_DAILY_COST || '10.00'),
        warnThreshold: parseFloat(env.WARN_COST_THRESHOLD || '5.00'),
        enableTracking: env.ENABLE_COST_TRACKING !== 'false'
      }
    };
  }

  getConfig(): KernelConfig {
    return this.config;
  }

  validateConfig(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    if (!this.config.openai.apiKey && !this.config.anthropic.apiKey) {
      missing.push('At least one API key (OPENAI_API_KEY or ANTHROPIC_API_KEY) is required');
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  getAvailableProviders(): string[] {
    const providers: string[] = [];
    
    if (this.config.openai.apiKey) {
      providers.push('openai');
    }
    
    if (this.config.anthropic.apiKey) {
      providers.push('anthropic');
    }
    
    return providers;
  }
}

export const envConfig = new EnvironmentConfig();
export { KernelConfig, EnvironmentConfig };