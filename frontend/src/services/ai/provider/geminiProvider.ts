import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiProvider } from './AiProvider';
import { AI_CONFIG } from '@/config/aiConfig';

/**
 * Gemini Provider Implementation
 * Connects directly using Google Generative AI SDK.
 */
export class GeminiProvider implements AiProvider {
  readonly name = 'gemini';
  private client: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
  }

  async generateText(
    prompt: string,
    systemInstruction?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      responseMimeType?: string;
    }
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Gemini API key is not configured.');
    }

    const config = AI_CONFIG.providers.gemini;
    const model = this.client.getGenerativeModel({
      model: config.model,
      safetySettings: config.safetySettings,
      generationConfig: {
        responseMimeType: options?.responseMimeType || config.generationConfig.responseMimeType,
        temperature: options?.temperature,
        maxOutputTokens: options?.maxTokens,
      },
      systemInstruction,
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) {
      throw new Error('Empty response received from Gemini.');
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
    if (!this.client) {
      throw new Error('Gemini API key is not configured.');
    }

    const config = AI_CONFIG.providers.gemini;
    const model = this.client.getGenerativeModel({
      model: config.model,
      safetySettings: config.safetySettings,
      generationConfig: {
        responseMimeType: options?.responseMimeType || config.generationConfig.responseMimeType,
        temperature: options?.temperature,
        maxOutputTokens: options?.maxTokens,
      },
      systemInstruction,
    });

    const result = await model.generateContentStream(prompt);

    return new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(chunkText);
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  }
}

export const geminiProvider = new GeminiProvider();
