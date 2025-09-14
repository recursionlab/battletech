/**
 * Environment Configuration for ΞKernel
 * 
 * Loads API keys and configuration from environment variables
 */

interface KernelConfig {
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

  // No-op validation in OpenRouter-only mode
  validateConfig(): { valid: boolean; missing: string[] } {
    return { valid: true, missing: [] };
  }
}

export const envConfig = new EnvironmentConfig();
export { KernelConfig, EnvironmentConfig };