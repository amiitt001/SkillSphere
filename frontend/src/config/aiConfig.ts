import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

/**
 * AI Service Configuration
 * Centralizes model parameters, endpoints, and safety configurations.
 */
export const AI_CONFIG = {
  providers: {
    gemini: {
      model: 'gemini-2.5-flash',
      apiKeyEnv: 'GEMINI_API_KEY',
      baseUrl: 'https://generativelanguage.googleapis.com',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    },
    nvidia: {
      model: process.env.NVIDIA_MODEL || 'deepseek-ai/deepseek-v4-flash',
      apiKeyEnv: 'NVIDIA_API_KEY',
      baseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
      temperature: 1.0,
      topP: 0.95,
      maxTokens: 16384,
      responseFormat: { type: 'json_object' },
    },
  },
  
  // Cache and Rate Limiting Limits
  limits: {
    blockDurationHours: 24,
  },
};
