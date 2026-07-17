import { aiService, StandardAiResponse } from '../aiService';

export interface IModelRouter {
  generateText(
    prompt: string,
    fallbackText: string,
    systemInstruction?: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<StandardAiResponse<string>>;

  generateJSON<T>(
    prompt: string,
    fallbackData: T,
    systemInstruction?: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<StandardAiResponse<T>>;

  generateStream(
    prompt: string,
    fallbackText: string,
    systemInstruction?: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<ReadableStream<string>>;
}

export class ModelRouter implements IModelRouter {
  async generateText(
    prompt: string,
    fallbackText: string,
    systemInstruction?: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<StandardAiResponse<string>> {
    return await aiService.generateText(prompt, fallbackText, systemInstruction, options);
  }

  async generateJSON<T>(
    prompt: string,
    fallbackData: T,
    systemInstruction?: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<StandardAiResponse<T>> {
    return await aiService.generateJSON(prompt, fallbackData, systemInstruction, options);
  }

  async generateStream(
    prompt: string,
    fallbackText: string,
    systemInstruction?: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<ReadableStream<string>> {
    return await aiService.generateStream(prompt, fallbackText, systemInstruction, options);
  }
}

export const modelRouter: IModelRouter = new ModelRouter();
export default modelRouter;
