import { aiService, StandardAiResponse } from '../aiService';
import { getProjectGenerationPrompt } from '../prompts/project';
import { cacheStore } from '@/lib/cache';
import { logger } from '@/services/logger';

export function getFallbackProjects(career: string, skillLevel: string) {
  return {
    projects: [
      {
        title: `Standard ${career} Application`,
        description: `A portfolio project highlighting systems architectures for a ${skillLevel} level candidate.`,
        techStack: ['Next.js', 'TypeScript', 'Node.js'],
        architecture: 'Monolithic modular architecture with database integrations.',
        features: ['Responsive UI rendering', 'Client auth session', 'External API connectors'],
        resumeDescription: `Designed and built a responsive system utilizing key technologies to support ${career} workflows.`,
        folderStructure: 'project-name/\\n├── src/\\n│   ├── components/\\n│   ├── pages/\\n│   └── utils/\\n├── server/\\n│   ├── routes/\\n│   └── models/\\n├── package.json\\n└── README.md',
        difficulty: skillLevel,
        estimatedTime: '2-3 weeks',
      },
    ],
  };
}

/**
 * Project AI Business Domain Module
 */
export class ProjectAi {
  async generateProjects(
    career: string,
    skillLevel: string,
    skills?: string
  ): Promise<StandardAiResponse<any>> {
    const cacheKey = `projects:${career}:${skillLevel}:${skills || ''}`;

    try {
      const cached = await cacheStore.get<any>(cacheKey);
      if (cached) {
        logger.info(`[ProjectAi] Cache hit for project generation key: ${cacheKey}`);
        return {
          success: true,
          provider: 'cache',
          model: 'in-memory',
          latency: 0,
          data: cached,
          warnings: [],
        };
      }
    } catch (err) {
      logger.error('[ProjectAi] Cache read failed', err);
    }

    const prompt = getProjectGenerationPrompt(career, skillLevel, skills);
    const fallback = getFallbackProjects(career, skillLevel);

    const res = await aiService.generateJSON(prompt, fallback);

    if (res.success && res.provider !== 'mock') {
      try {
        await cacheStore.set(cacheKey, res.data, 3600); // 1 hour TTL
      } catch (err) {
        logger.error('[ProjectAi] Cache write failed', err);
      }
    }

    return res;
  }
}

export const projectAi = new ProjectAi();
