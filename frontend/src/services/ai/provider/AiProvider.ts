/**
 * AI Provider Interface
 * Standard interface for all model providers (Gemini, DeepSeek, etc.)
 */
export interface AiProvider {
  name: string;
  
  /**
   * Generates a non-streaming text response.
   * @param prompt User prompt text.
   * @param systemInstruction Optional system directives.
   * @param options Custom overrides like temperature, maxTokens, and responseMimeType.
   */
  generateText(
    prompt: string,
    systemInstruction?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      responseMimeType?: string;
    }
  ): Promise<string>;

  /**
   * Generates a streaming text response.
   * @param prompt User prompt text.
   * @param systemInstruction Optional system directives.
   * @param options Custom overrides.
   */
  generateStream(
    prompt: string,
    systemInstruction?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      responseMimeType?: string;
    }
  ): Promise<ReadableStream<string>>;
}
