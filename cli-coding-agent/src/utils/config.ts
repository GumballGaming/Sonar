export interface Config {
  apiUrl: string;
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

const DEFAULT_CONFIG: Config = {
  apiUrl: "https://openrouter.ai/api/v1",
  apiKey: "",
  model: "",
  maxTokens: 4096,
  temperature: 0.7,
  timeout: 120000,
};

export function loadConfig(): Config {
  const envConfig: Partial<Config> = {
    apiUrl: process.env.CODY_API_URL || process.env.OPENAI_API_BASE,
    apiKey: process.env.CODY_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
    model: process.env.CODY_MODEL,
    timeout: process.env.CODY_TIMEOUT ? parseInt(process.env.CODY_TIMEOUT, 10) : undefined,
  };

  const filtered = Object.fromEntries(
    Object.entries(envConfig).filter(([_, v]) => v !== undefined)
  );

  return {
    ...DEFAULT_CONFIG,
    ...filtered,
  };
}

export function validateConfig(config: Config): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.apiUrl) {
    errors.push("API URL is required");
  } else {
    try {
      new URL(config.apiUrl);
    } catch {
      errors.push("Invalid API URL format");
    }
  }

  if (!config.apiKey) {
    errors.push("API key is required");
  }

  if (!config.model) {
    errors.push("Model is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}