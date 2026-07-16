import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebaseAdmin';
import { OrchestratorRequest, OrchestratorResponse, AISession } from '@/types/context';
import { contextEngine } from '../context/contextEngine';
import { aiService } from '../ai/aiService';
import { toolRegistry } from './toolRegistry';
import { logger } from '@/services/logger';

function getAdminDb() {
  return getFirestore();
}

export const aiOrchestrator = {
  /**
   * Orchestrates the execution sequence of an AI request:
   * Intent -> Context Resolution (w/ Gap Pausing) -> Tool Execution -> Prompt Assembly -> LLM -> Session Logging.
   */
  async execute(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const start = Date.now();
    const sessionId = Math.random().toString(36).substring(2, 15);
    const db = getAdminDb();

    logger.info(`[AIOrchestrator] Running execute sequence for user: ${request.uid}, intent: ${request.intent}`);

    // 1. Context Resolution & Smart Question Gap Check
    const contextResult = await contextEngine.buildContext(request.uid, request.intent);
    if (contextResult.missingFields && contextResult.missingFields.length > 0) {
      // Pause sequence and return missing fields list
      return {
        success: false,
        outputText: `I need additional details to fulfill your career assessment request.`,
        sessionId,
        missingInfoFields: contextResult.missingFields,
      };
    }

    // 2. Extensible Tool Execution based on resolved intent
    const invokedTools: Array<{ toolName: string; latency: number }> = [];
    if (request.intent === 'career_recommendations') {
      const tool = toolRegistry.getTool('CareerTool');
      if (tool) {
        const toolStart = Date.now();
        await tool.execute({ userId: request.uid });
        invokedTools.push({
          toolName: 'CareerTool',
          latency: Date.now() - toolStart,
        });
      }
    } else if (request.intent === 'resume_analysis') {
      const tool = toolRegistry.getTool('ResumeTool');
      if (tool) {
        const toolStart = Date.now();
        await tool.execute({ userId: request.uid });
        invokedTools.push({
          toolName: 'ResumeTool',
          latency: Date.now() - toolStart,
        });
      }
    }

    // 3. Prompt Assembly & LLM Generation
    const prompt = `
Relevant User Profile Context:
"""
${contextResult.contextText}
"""

User Directive / Query: "${request.userInput}"
`;

    const systemInstruction = "You are a professional AI Career Coach and recruiter assistant built on top of the SkillSphere career workspace.";
    const fallbackText = "Unable to construct career guidance matches at this time.";

    const aiRes = await aiService.generateText(prompt, fallbackText, systemInstruction);

    const latencyMs = Date.now() - start;

    // 4. Persistence of session logs and telemetry metrics
    const sessionDoc: AISession = {
      sessionId,
      userId: request.uid,
      intent: request.intent,
      contextUsed: [contextResult.contextText ? 'profile_context' : 'empty'],
      toolsInvoked: invokedTools,
      llmProvider: (aiRes.provider as any) || 'mock',
      promptVersion: '2.0.0',
      latencyMs,
      costEstimate: Math.ceil(prompt.length / 4) * 0.00001, // Estimated pricing metric
      validationStatus: aiRes.success ? 'passed' : 'failed',
      output: aiRes.data,
      timestamp: new Date().toISOString(),
    };

    try {
      await db.collection('users').doc(request.uid).collection('sessions').doc(sessionId).set(sessionDoc);
      logger.info(`[AIOrchestrator] Persisted execution session log ${sessionId} for user ${request.uid}`);
    } catch (err) {
      logger.error('[AIOrchestrator] Failed to save session details:', err);
    }

    return {
      success: aiRes.success,
      outputText: aiRes.data,
      sessionId,
    };
  }
};

export default aiOrchestrator;
