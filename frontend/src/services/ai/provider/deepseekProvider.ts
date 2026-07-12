import { AiProvider } from './AiProvider';
import { AI_CONFIG } from '@/config/aiConfig';

/**
 * NVIDIA DeepSeek Provider Implementation
 * Connects via NVIDIA Integrate API endpoints.
 */
export class DeepseekProvider implements AiProvider {
  readonly name = 'deepseek';

  async generateText(
    prompt: string,
    systemInstruction?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      responseMimeType?: string;
    }
  ): Promise<string> {
    const config = AI_CONFIG.providers.nvidia;
    const apiKey = process.env.NVIDIA_API_KEY;

    if (!apiKey) {
      throw new Error('NVIDIA API key is not configured.');
    }

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
          { role: 'user', content: prompt },
        ],
        temperature: options?.temperature !== undefined ? options.temperature : config.temperature,
        top_p: config.topP,
        max_tokens: options?.maxTokens !== undefined ? options.maxTokens : config.maxTokens,
        response_format: options?.responseMimeType === 'application/json' ? config.responseFormat : undefined,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`NVIDIA DeepSeek API failed: ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('Empty response received from NVIDIA DeepSeek.');
    }
    return text;
  }

  async generateStream(
    prompt: string,
    systemInstruction?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      responseMimeType?: string;
    }
  ): Promise<ReadableStream<string>> {
    // For streaming fallback, resolve the full text and stream it as a single chunk
    // to preserve robust fallback delivery without complex SSE buffering.
    const text = await this.generateText(prompt, systemInstruction, options);
    return new ReadableStream<string>({
      start(controller) {
        controller.enqueue(text);
        controller.close();
      },
    });
  }
}

export const deepseekProvider = new DeepseekProvider();
