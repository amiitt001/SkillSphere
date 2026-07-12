import { AiProvider, providerFactory, geminiProvider, deepseekProvider } from './provider';
import { AI_CONFIG } from '@/config/aiConfig';
import { isGeminiBlocked, isNvidiaBlocked, blockGemini, blockNvidia } from '@/lib/apiManager';
import { logger } from '@/services/logger';
import { parseJson } from './parser';

export interface StandardAiResponse<T> {
  success: boolean;
  provider: string;
  model: string;
  latency: number;
  data: T;
  warnings: string[];
}

/**
 * Executes a function with automatic retries.
 */
async function retryWithDelay<T>(
  fn: () => Promise<T>,
  retries: number = 2,
  delayMs: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return retryWithDelay(fn, retries - 1, delayMs);
  }
}

/**
 * AI Core Orchestrator Service
 * Handles provider selection, fallback execution, logging, cost metrics, and streams.
 */
export class AiService {
  /**
   * Generates parsed JSON from provider cascade.
   * @param prompt Promt string.
   * @param fallbackData Fallback data on error.
   * @param systemInstruction Optional system directives.
   * @param options Execution parameter overrides.
   */
  async generateJSON<T>(
    prompt: string,
    fallbackData: T,
    systemInstruction?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<StandardAiResponse<T>> {
    const result = await this.executeWithFallback(
      async (provider) => {
        const text = await provider.generateText(prompt, systemInstruction, {
          ...options,
          responseMimeType: 'application/json',
        });
        return parseJson(text, fallbackData);
      },
      fallbackData
    );

    return {
      success: result.provider !== 'mock',
      provider: result.provider,
      model: result.model,
      latency: result.latency,
      data: result.data,
      warnings: [],
    };
  }

  /**
   * Generates plain text from provider cascade.
   * @param prompt Prompt string.
   * @param fallbackText Fallback text on error.
   * @param systemInstruction Optional system directives.
   * @param options Execution parameter overrides.
   */
  async generateText(
    prompt: string,
    fallbackText: string,
    systemInstruction?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<StandardAiResponse<string>> {
    const result = await this.executeWithFallback(
      async (provider) => {
        return await provider.generateText(prompt, systemInstruction, options);
      },
      fallbackText
    );

    return {
      success: result.provider !== 'mock',
      provider: result.provider,
      model: result.model,
      latency: result.latency,
      data: result.data,
      warnings: [],
    };
  }

  /**
   * Resolves a streaming response, falling back on provider initialization failure.
   * @param prompt Prompt string.
   * @param fallbackText Static text returned on failure of both providers.
   * @param systemInstruction Optional system directives.
   * @param options Custom parameters.
   */
  async generateStream(
    prompt: string,
    fallbackText: string,
    systemInstruction?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<ReadableStream<string>> {
    // 1. Try Gemini
    try {
      const geminiBlocked = await isGeminiBlocked();
      if (!geminiBlocked && process.env.GEMINI_API_KEY) {
        return await geminiProvider.generateStream(prompt, systemInstruction, options);
      }
    } catch (err: any) {
      logger.error('[AiService] Gemini stream initiation failed, cascading...', err);
      if (err.message && (err.message.includes('429') || err.message.toLowerCase().includes('resource_exhausted'))) {
        await blockGemini();
      }
    }

    // 2. Try DeepSeek
    try {
      const nvidiaBlocked = await isNvidiaBlocked();
      if (!nvidiaBlocked && process.env.NVIDIA_API_KEY) {
        return await deepseekProvider.generateStream(prompt, systemInstruction, options);
      }
    } catch (err: any) {
      logger.error('[AiService] DeepSeek stream initiation failed...', err);
      if (err.message && (err.message.includes('429') || err.message.toLowerCase().includes('resource_exhausted'))) {
        await blockNvidia();
      }
    }

    // 3. Return Static Fallback
    logger.warn('[AiService] All streaming providers failed. Returning static mock text stream.');
    return new ReadableStream<string>({
      start(controller) {
        controller.enqueue(fallbackText);
        controller.close();
      },
    });
  }

  /**
   * Internal wrapper executing LLM request with cascading fallback and retry policies.
   */
  private async executeWithFallback<T>(
    operation: (provider: AiProvider) => Promise<T>,
    fallbackData: T
  ): Promise<{ data: T; provider: string; model: string; latency: number }> {
    const start = Date.now();

    // 1. Try Gemini Provider
    try {
      const geminiBlocked = await isGeminiBlocked();
      if (!geminiBlocked && process.env.GEMINI_API_KEY) {
        const data = await retryWithDelay(() => operation(geminiProvider));
        const latency = Date.now() - start;
        logger.ai('gemini', 'executeJSON/Text', true);
        return {
          data,
          provider: 'gemini',
          model: AI_CONFIG.providers.gemini.model,
          latency,
        };
      }
    } catch (err: any) {
      logger.error('[AiService] Gemini call failed, trying fallback...', err);
      if (err.message && (err.message.includes('429') || err.message.toLowerCase().includes('resource_exhausted'))) {
        await blockGemini();
      }
    }

    // 2. Try DeepSeek Provider
    try {
      const nvidiaBlocked = await isNvidiaBlocked();
      if (!nvidiaBlocked && process.env.NVIDIA_API_KEY) {
        const data = await retryWithDelay(() => operation(deepseekProvider));
        const latency = Date.now() - start;
        logger.ai('deepseek', 'executeJSON/Text', true);
        return {
          data,
          provider: 'deepseek',
          model: AI_CONFIG.providers.nvidia.model,
          latency,
        };
      }
    } catch (err: any) {
      logger.error('[AiService] DeepSeek call failed, using mock...', err);
      if (err.message && (err.message.includes('429') || err.message.toLowerCase().includes('resource_exhausted'))) {
        await blockNvidia();
      }
    }

    // 3. Return Static Mock Data
    const latency = Date.now() - start;
    logger.warn('[AiService] All AI providers failed. Reverting to static fallback.');
    return {
      data: fallbackData,
      provider: 'mock',
      model: 'static-mock',
      latency,
    };
  }
}

export const aiService = new AiService();
export default aiService;
