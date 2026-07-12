import { AiProvider } from './AiProvider';
import { geminiProvider } from './geminiProvider';
import { deepseekProvider } from './deepseekProvider';
import { isGeminiBlocked, isNvidiaBlocked } from '@/lib/apiManager';
import { logger } from '@/services/logger';

/**
 * Provider Factory
 * Resolves the appropriate AI provider dynamically based on configurations and block/limit statuses.
 */
export class ProviderFactory {
  /**
   * Resolves the primary unblocked provider or a specified provider.
   * @param name Optional provider name override.
   */
  async getProvider(name?: 'gemini' | 'deepseek'): Promise<AiProvider> {
    // If specific provider requested, return it directly if configured
    if (name === 'gemini') {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('Gemini provider is requested but GEMINI_API_KEY is missing.');
      }
      return geminiProvider;
    }
    if (name === 'deepseek') {
      if (!process.env.NVIDIA_API_KEY) {
        throw new Error('DeepSeek provider is requested but NVIDIA_API_KEY is missing.');
      }
      return deepseekProvider;
    }

    // Default cascade: Gemini -> DeepSeek
    const geminiBlocked = await isGeminiBlocked();
    if (!geminiBlocked && process.env.GEMINI_API_KEY) {
      return geminiProvider;
    }

    if (geminiBlocked) {
      logger.warn('[ProviderFactory] Gemini is currently marked blocked. Cascading to DeepSeek...');
    }

    const nvidiaBlocked = await isNvidiaBlocked();
    if (!nvidiaBlocked && process.env.NVIDIA_API_KEY) {
      return deepseekProvider;
    }

    if (nvidiaBlocked) {
      logger.warn('[ProviderFactory] DeepSeek is currently marked blocked.');
    }

    throw new Error('No active AI providers available (both rate-limited, blocked, or unconfigured).');
  }
}

export const providerFactory = new ProviderFactory();
