import { aiService } from '../ai/aiService';
import type { WeeklyReflection, CopilotTask } from './types';

const DEFAULT_REFLECTION: WeeklyReflection = {
  improved: [
    'System Design comprehension (caching layers, Redis fundamentals).',
    'Open source profile (created 2 new GitHub repositories with clean README files).'
  ],
  stagnated: [
    'DSA solving consistency (zero LeetCode submissions over the last 4 days).',
    'Cloud containerization practice (Docker Compose setup task remains incomplete).'
  ],
  missedOpportunities: [
    'Did not apply to the Frontend Intern position at Razorpay (high-compatibility match).',
    'Missed freeCodeCamp React Core Course target deadline.'
  ],
  achievements: [
    'Successfully built and cataloged the E-Commerce Microservices project.',
    'Passed foundational databases assessment quiz.'
  ],
  nextWeekPriorities: [
    'Solve at least 4 Medium coding challenges (trees/hashing).',
    'Containerize project and verify local routing scripts.'
  ]
};

/**
 * Computes a weekly career reflection based on completed and active tasks.
 */
export async function generateWeeklyReflection(
  completedTasks: CopilotTask[],
  activeTasks: CopilotTask[],
  bookmarks: any[]
): Promise<WeeklyReflection> {
  const completedTitles = completedTasks.map((t) => t.title).join(', ');
  const activeTitles = activeTasks.map((t) => t.title).join(', ');
  const bookmarkedTitles = bookmarks.map((b) => b.id).join(', ');

  const prompt = `
You are the SkillSphere Reflection Engine. Review this user's execution summary for the past week:
Completed Tasks: [${completedTitles || 'None'}]
Active/Stalled Tasks: [${activeTitles || 'None'}]
Saved Bookmarked Items: [${bookmarkedTitles || 'None'}]

Generate a Weekly Reflection JSON mapping EXACTLY to this schema. Do not add conversational markdown:
{
  "improved": ["improvement point 1", "improvement point 2"],
  "stagnated": ["stagnation point 1", "stagnation point 2"],
  "missedOpportunities": ["opportunity 1", "opportunity 2"],
  "achievements": ["achievement 1", "achievement 2"],
  "nextWeekPriorities": ["priority 1", "priority 2"]
}
`;

  try {
    const res = await aiService.generateJSON<WeeklyReflection>(
      prompt,
      DEFAULT_REFLECTION,
      'You are a career reflection writer. Output strictly valid JSON matching the requested structure.'
    );
    return res.data;
  } catch (error) {
    console.error('[Reflection Engine] Error generating weekly reflection:', error);
    return DEFAULT_REFLECTION;
  }
}
