import { aiService } from '../ai/aiService';
import type { DailyBrief, WeeklyPlan } from './types';

const DEFAULT_DAILY_BRIEF: DailyBrief = {
  priority: 'Optimize SQL indexing in your backend database schema.',
  recommendedSkill: 'Caching & Redis key design patterns.',
  recommendedProject: 'E-Commerce Microservices Engine.',
  codingChallenge: 'Solve LeetCode #146: LRU Cache (Medium).',
  learningResource: 'System Design Course (caching architectures section) on YouTube.',
  interviewQuestion: 'Explain the difference between write-through and write-back caching strategies.',
  careerInsight: 'DevOps pipelines and basic cloud administration skills are now expected for mid-level backend engineering interviews.',
  motivationalSummary: 'Great job staying consistent! Completing one more Docker project this week pushes your career readiness rating up by 3 points.'
};

const DEFAULT_WEEKLY_PLAN: WeeklyPlan = {
  priorities: [
    'Containerize a Node/React application and push it to Docker Hub.',
    'Increase LeetCode contest rating to 1400.'
  ],
  learningSchedule: [
    'Monday: Study caching protocols and Redis basic types.',
    'Wednesday: Docker multi-stage build optimization techniques.',
    'Friday: REST API design best practices and pagination strategies.'
  ],
  codingGoals: [
    'Solve 5 medium-difficulty arrays/hashing coding challenges.',
    'Review 2 dynamic programming interview questions.'
  ],
  projectGoals: [
    'Configure environment credentials securely using docker compose variables.',
    'Build and test local server container routes.'
  ],
  interviewPrep: [
    'Revise cache eviction algorithms (LRU, LFU).',
    'Practice mock behavioral questions on resolving technical debt.'
  ],
  certificationMilestones: [
    'Complete the introductory modules of AWS Cloud Practitioner Path.'
  ],
  applicationTargets: [
    'Bookmark at least 2 remote backend internships.'
  ]
};

/**
 * Generates a personalized daily briefing for the user based on context.
 */
export async function generateDailyBrief(contextString: string): Promise<DailyBrief> {
  const prompt = `
You are the SkillSphere Career Intelligence engine. Your task is to generate a Daily Career Briefing based on the user's current profile, scores, and gaps.
Output a JSON response that maps EXACTLY to the following format. Do not add any conversational markdown before or after the JSON:
{
  "priority": "Today's top single focus action item",
  "recommendedSkill": "A skill they should learn/practice today",
  "recommendedProject": "A recommended project idea to work on",
  "codingChallenge": "A coding challenge description (e.g. solve a specific LeetCode problem)",
  "learningResource": "A specific learning resource recommendation",
  "interviewQuestion": "An interview question they should prepare today",
  "careerInsight": "A valuable career/industry trend insight",
  "motivationalSummary": "A motivational encouraging summary referencing their progress"
}

User context:
${contextString}
`;

  try {
    const response = await aiService.generateJSON<DailyBrief>(
      prompt,
      DEFAULT_DAILY_BRIEF,
      'You are a career planner assistant. Output strictly valid JSON matching the requested structure.'
    );
    return response.data;
  } catch (error) {
    console.error('[Copilot Engine] Error generating Daily Brief:', error);
    return DEFAULT_DAILY_BRIEF;
  }
}

/**
 * Generates a personalized weekly plan checklist.
 */
export async function generateWeeklyPlan(contextString: string): Promise<WeeklyPlan> {
  const prompt = `
You are the SkillSphere Career Planner. Review the user's profile and generate a detailed weekly learning and application checklist.
Output a JSON response that maps EXACTLY to the following format. Do not add conversational text:
{
  "priorities": ["string priority 1", "string priority 2"],
  "learningSchedule": ["Day action 1", "Day action 2"],
  "codingGoals": ["Goal 1", "Goal 2"],
  "projectGoals": ["Goal 1", "Goal 2"],
  "interviewPrep": ["Prep action 1", "Prep action 2"],
  "certificationMilestones": ["Milestone 1"],
  "applicationTargets": ["Target 1"]
}

User context:
${contextString}
`;

  try {
    const response = await aiService.generateJSON<WeeklyPlan>(
      prompt,
      DEFAULT_WEEKLY_PLAN,
      'You are a career schedule planner. Output strictly valid JSON matching the requested structure.'
    );
    return response.data;
  } catch (error) {
    console.error('[Copilot Engine] Error generating Weekly Plan:', error);
    return DEFAULT_WEEKLY_PLAN;
  }
}
