import { aiService, StandardAiResponse } from '../aiService';
import { getChatbotPrompt } from '../prompts/chatbot';

export function getFallbackChatResponse() {
  return "I apologize, I couldn't reach the AI engine to generate a response. Please check your connection and try again.";
}

/**
 * Chatbot AI Business Domain Module
 */
export class ChatbotAi {
  async respond(userName: string, message: string): Promise<StandardAiResponse<string>> {
    const prompt = getChatbotPrompt(userName, message);
    const fallback = getFallbackChatResponse();

    return await aiService.generateText(prompt, fallback);
  }
}

export const chatbotAi = new ChatbotAi();
export default chatbotAi;
