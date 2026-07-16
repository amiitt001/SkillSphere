export interface TokenBudget {
  maxContextTokens: number;
  reservedResponseTokens: number;
}

export interface OrchestratorRequest {
  uid: string;
  intent: string;
  userInput: string;
}

export interface OrchestratorResponse {
  success: boolean;
  outputText: string;
  sessionId: string;
  missingInfoFields?: string[];
}

export interface AITool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  execute(input: any): Promise<any>;
}

export interface AISession {
  sessionId: string;
  userId: string;
  intent: string;
  contextUsed: string[];
  toolsInvoked: Array<{ toolName: string; latency: number }>;
  llmProvider: 'gemini' | 'deepseek' | 'mock';
  promptVersion: string;
  latencyMs: number;
  costEstimate: number;
  validationStatus: 'passed' | 'failed';
  output: string;
  timestamp: string;
}

export interface VectorDocument {
  id: string;
  text: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface VectorStoreAdapter {
  upsert(documents: VectorDocument[]): Promise<void>;
  similaritySearch(query: string, limit: number): Promise<VectorDocument[]>;
}

export interface AgentResponse {
  message: string;
  actionRequired?: string;
  data?: any;
}

export interface Agent {
  name: string;
  role: string;
  process(prompt: string, context: any): Promise<AgentResponse>;
}

export interface AgentOrchestrator {
  agents: Map<string, Agent>;
  routeAndExecute(intent: string, prompt: string, context: any): Promise<AgentResponse>;
}
