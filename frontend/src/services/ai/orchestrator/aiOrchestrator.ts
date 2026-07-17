import { OrchestratorRequest, OrchestratorResponse } from '@/types/context';
import { IContextBuilder, contextBuilder } from './contextBuilder';
import { IPromptBuilder, promptBuilder } from './promptBuilder';
import { IModelRouter, modelRouter } from './modelRouter';
import { logger } from '@/services/logger';

export interface IAIOrchestrator {
  execute(request: OrchestratorRequest): Promise<OrchestratorResponse>;
}

export class AIOrchestrator implements IAIOrchestrator {
  private contextBuilder: IContextBuilder;
  private promptBuilder: IPromptBuilder;
  private modelRouter: IModelRouter;

  constructor(
    contextBuilderImpl: IContextBuilder = contextBuilder,
    promptBuilderImpl: IPromptBuilder = promptBuilder,
    modelRouterImpl: IModelRouter = modelRouter
  ) {
    this.contextBuilder = contextBuilderImpl;
    this.promptBuilder = promptBuilderImpl;
    this.modelRouter = modelRouterImpl;
  }

  async execute(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const start = Date.now();
    const sessionId = Math.random().toString(36).substring(2, 15);

    logger.info(`[AIOrchestrator] Running refactored execute sequence for user: ${request.uid}, intent: ${request.intent}`);

    try {
      // 1. Resolve Context
      const contextText = await this.contextBuilder.buildContext(request.uid);

      // 2. Assemble Prompt & System Instruction
      const prompt = this.promptBuilder.buildPrompt(contextText, request.userInput);
      const systemInstruction = this.promptBuilder.getSystemInstruction(request.intent);
      const fallbackText = "Unable to construct career guidance matches at this time.";

      // 3. Route to Model
      const aiRes = await this.modelRouter.generateText(prompt, fallbackText, systemInstruction);
      const latencyMs = Date.now() - start;

      logger.audit(`aiOrchestrator:execute:${request.intent}`, request.uid, aiRes.success, {
        sessionId,
        latencyMs,
        provider: aiRes.provider,
        model: aiRes.model,
      });

      return {
        success: aiRes.success,
        outputText: aiRes.data,
        sessionId,
      };
    } catch (error: any) {
      logger.error('[AIOrchestrator] Refactored execution flow failed:', error);
      return {
        success: false,
        outputText: 'An error occurred during AI orchestration.',
        sessionId,
      };
    }
  }
}

export const aiOrchestrator: IAIOrchestrator = new AIOrchestrator();
export default aiOrchestrator;
