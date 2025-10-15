/**
 * Configuration and Environment Variables
 * Handles API keys and other sensitive configuration
 */

interface AppConfig {
  mistral: {
    apiKey: string | null;
    model: string;
    enabled: boolean;
  };
  app: {
    version: string;
    environment: 'development' | 'production';
  };
}

// Default configuration
const defaultConfig: AppConfig = {
  mistral: {
    apiKey: null,
    model: 'mistral-small-latest',
    enabled: false,
  },
  app: {
    version: '1.0.0',
    environment: 'development',
  },
};

class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    this.config = { ...defaultConfig };
    this.loadConfiguration();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfiguration(): void {
    // In React Native, we'll use a different approach for environment variables
    // For now, we'll allow runtime configuration
    
    // Check if running in Expo environment
    if (typeof window !== 'undefined' && (window as any).__DEV__) {
      this.config.app.environment = 'development';
    }
  }

  /**
   * Set Mistral API key at runtime
   */
  public setMistralApiKey(apiKey: string): void {
    this.config.mistral.apiKey = apiKey;
    this.config.mistral.enabled = !!apiKey;
  }

  /**
   * Get Mistral configuration
   */
  public getMistralConfig() {
    return { ...this.config.mistral };
  }

  /**
   * Check if Mistral is properly configured
   */
  public isMistralEnabled(): boolean {
    return this.config.mistral.enabled && !!this.config.mistral.apiKey;
  }

  /**
   * Get app configuration
   */
  public getAppConfig() {
    return { ...this.config.app };
  }

  /**
   * Validate API key format (basic validation)
   */
  public validateMistralKey(apiKey: string): boolean {
    // Basic validation - Mistral keys typically start with specific patterns
    return apiKey.length > 10 && /^[a-zA-Z0-9-_]+$/.test(apiKey);
  }
}

export const configManager = ConfigManager.getInstance();

/**
 * Hook for setting up API key from user input
 * This is a temporary solution until proper environment setup
 */
export function setupMistralApiKey(apiKey: string): boolean {
  if (configManager.validateMistralKey(apiKey)) {
    configManager.setMistralApiKey(apiKey);
    return true;
  }
  return false;
}

export type { AppConfig };
