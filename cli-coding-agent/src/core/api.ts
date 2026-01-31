import type { Config } from "../utils/config";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: Message;
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class APIClient {
  private config: Config;
  private abortController: AbortController | null = null;

  constructor(config: Config) {
    this.config = config;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    if (this.config.apiUrl?.includes("openrouter")) {
      headers["HTTP-Referer"] = "https://github.com/cody-cli";
      headers["X-Title"] = "Cody CLI";
    }

    return headers;
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async chat(messages: Message[]): Promise<string> {
    this.abort();
    this.abortController = new AbortController();

    const timeout = this.config.timeout || 120000;
    const timeoutId = setTimeout(() => this.abortController?.abort(), timeout);

    try {
      const request: ChatCompletionRequest = {
        model: this.config.model,
        messages,
        stream: false,
      };

      if (this.config.maxTokens) {
        request.max_tokens = this.config.maxTokens;
      }

      if (this.config.temperature !== undefined) {
        request.temperature = this.config.temperature;
      }

      const response = await fetch(`${this.config.apiUrl}/chat/completions`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(request),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error (${response.status}): ${error}`);
      }

      const data = (await response.json()) as ChatCompletionResponse;
      return data.choices[0]?.message?.content || "";
    } finally {
      clearTimeout(timeoutId);
      this.abortController = null;
    }
  }

  async *chatStream(messages: Message[]): AsyncGenerator<string> {
    this.abort();
    this.abortController = new AbortController();

    const timeout = this.config.timeout || 120000;
    const timeoutId = setTimeout(() => this.abortController?.abort(), timeout);

    try {
      const request: ChatCompletionRequest = {
        model: this.config.model,
        messages,
        stream: true,
      };

      if (this.config.maxTokens) {
        request.max_tokens = this.config.maxTokens;
      }

      if (this.config.temperature !== undefined) {
        request.temperature = this.config.temperature;
      }

      const response = await fetch(`${this.config.apiUrl}/chat/completions`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(request),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error (${response.status}): ${error}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith("data: ")) {
              const data = trimmed.slice(6);
              if (data === "[DONE]") return;

              try {
                const parsed = JSON.parse(data);

                if (parsed.error) {
                  throw new Error(parsed.error.message || JSON.stringify(parsed.error));
                }

                const content = parsed.choices?.[0]?.delta?.content;
                if (content) yield content;
              } catch (e) {
                if (!(e instanceof SyntaxError)) throw e;
              }
            } else if (trimmed.startsWith("{")) {
              try {
                const parsed = JSON.parse(trimmed);
                if (parsed.error) {
                  throw new Error(parsed.error.message || JSON.stringify(parsed.error));
                }
              } catch (e) {
                if (!(e instanceof SyntaxError)) throw e;
              }
            }
          }
        }

        if (buffer.trim()) {
          const trimmed = buffer.trim();
          if (trimmed.startsWith("data: ") && trimmed.slice(6) !== "[DONE]") {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) yield content;
            } catch {}
          }
        }
      } finally {
        reader.releaseLock();
      }
    } finally {
      clearTimeout(timeoutId);
      this.abortController = null;
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.config.apiUrl}/models`, {
        method: "GET",
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` };
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }
}