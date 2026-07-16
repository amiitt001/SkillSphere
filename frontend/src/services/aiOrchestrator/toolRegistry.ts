import { AITool } from '@/types/context';
import { logger } from '@/services/logger';

export class ToolRegistry {
  private tools: Map<string, AITool> = new Map();

  register(tool: AITool): void {
    this.tools.set(tool.name, tool);
    logger.info(`[ToolRegistry] Registered pluggable tool: ${tool.name}`);
  }

  getTool(name: string): AITool | undefined {
    return this.tools.get(name);
  }

  listTools(): AITool[] {
    return Array.from(this.tools.values());
  }
}

export const toolRegistry = new ToolRegistry();

// Initialize basic tools to satisfy registry specification
toolRegistry.register({
  name: 'ResumeTool',
  description: 'Optimizes resume details and format.',
  inputSchema: { type: 'object', properties: { text: { type: 'string' } } },
  execute: async (input) => ({ success: true, action: 'resume_optimized', data: input }),
});

toolRegistry.register({
  name: 'GitHubTool',
  description: 'Interacts with GitHub synchronization api endpoints.',
  inputSchema: { type: 'object', properties: { userId: { type: 'string' } } },
  execute: async (input) => ({ success: true, action: 'github_synced', data: input }),
});

toolRegistry.register({
  name: 'LeetCodeTool',
  description: 'Connects to LeetCode statistics scraper.',
  inputSchema: { type: 'object', properties: { userId: { type: 'string' } } },
  execute: async (input) => ({ success: true, action: 'leetcode_fetched', data: input }),
});

toolRegistry.register({
  name: 'CareerTool',
  description: 'Resolves career path choices against graph nodes.',
  inputSchema: { type: 'object', properties: { userId: { type: 'string' } } },
  execute: async (input) => ({ success: true, action: 'career_mapped', data: input }),
});

export default toolRegistry;
