import type { UnifiedProfile, ProfileScore, AIProfileAnalysis } from '@/types';

/**
 * Compiles a detailed markdown context block representing the user's current status.
 */
export function buildCopilotContext(params: {
  name: string;
  stream: string;
  year: string;
  location: string;
  unifiedProfile: UnifiedProfile | null;
  profileScore: ProfileScore | null;
  aiAnalysis: AIProfileAnalysis | null;
  bookmarks: any[];
  applications: any[];
  progress: any[];
  primaryCareerGoal?: string;
  careerBlueprint?: any;
}): string {
  const { name, stream, year, location, unifiedProfile, profileScore, aiAnalysis, bookmarks, applications, progress, primaryCareerGoal, careerBlueprint } = params;

  let context = `USER PROFILE CONTEXT:
Name: ${name || 'Student'}
Stream: ${stream || 'Technology'}
Academic Year: ${year || '3rd Year'}
Location: ${location || 'India'}
`;

  if (primaryCareerGoal) {
    context += `Committed Career Goal Focus: ${primaryCareerGoal}
- Current readiness: ${careerBlueprint?.skillGap?.readinessScore || 50}%
- High priority gaps: ${careerBlueprint?.skillGap?.missingSkills?.filter((m: any) => m.priority === 'high').map((m: any) => m.name).join(', ') || 'None'}
- Short term target companies: ${careerBlueprint?.targetCompanies?.join(', ') || 'General'}
`;
  }

  if (profileScore) {
    context += `Career Readiness Score: ${profileScore.overall}/100
- GitHub/Open Source Score: ${profileScore.github}/100
- DSA/Problem Solving Score: ${profileScore.dsa}/100
- Competitive Programming Score: ${profileScore.cp}/100
- Breadth Score: ${profileScore.learning}/100
`;
  }

  if (unifiedProfile) {
    context += `Unified Skills: ${unifiedProfile.skills.join(', ')}
Key Languages: ${unifiedProfile.programmingLanguages.map((l) => `${l.name} (${l.percentage}%)`).join(', ')}
Frameworks: ${unifiedProfile.frameworks.join(', ')}
Repositories count: ${unifiedProfile.totalRepositories} (Stars: ${unifiedProfile.totalStars})
LeetCode Problems Solved: ${unifiedProfile.codingProblemsSolved}
Codeforces Rating: ${unifiedProfile.contestRating}
Certifications Unlocked: ${unifiedProfile.certifications.join(', ') || 'None'}
`;
  }

  if (aiAnalysis) {
    context += `AI Insight Analysis:
- Strengths: ${aiAnalysis.strengths.slice(0, 3).join(', ')}
- Weaknesses: ${aiAnalysis.weaknesses.slice(0, 3).join(', ')}
- Critical Missing Gaps: ${aiAnalysis.missingSkills.map((m) => `${m.skill} (Priority: ${m.priority})`).slice(0, 3).join(', ')}
- Suggested Target Goals: ${aiAnalysis.suggestedProjects.slice(0, 2).join(', ')}
`;
  }

  if (bookmarks.length > 0) {
    context += `Saved/Bookmarked Items: ${bookmarks.map(b => `${b.id} (${b.type})`).join(', ')}\n`;
  }

  if (applications.length > 0) {
    context += `Tracked Job Applications: ${applications.map(a => `${a.title} at ${a.company} [Status: ${a.status}]`).join(', ')}\n`;
  }

  const completed = progress.filter(p => p.status === 'completed');
  if (completed.length > 0) {
    context += `Recently Completed Tasks/Courses: ${completed.map(c => `${c.id} (${c.type})`).join(', ')}\n`;
  }

  return context.trim();
}
