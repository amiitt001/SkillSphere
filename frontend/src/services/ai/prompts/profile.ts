/**
 * AI Profile Analysis prompt template
 */

import type { UnifiedProfile, ProfileScore } from '@/types';

export function getProfileAnalysisPrompt(profile: UnifiedProfile, score: ProfileScore): string {
  const github = profile.github;
  const leetcode = profile.leetcode;
  const codeforces = profile.codeforces;
  const linkedin = profile.linkedin;

  const topLanguages = profile.programmingLanguages.slice(0, 5).map((l) => `${l.name} (${l.percentage}%)`).join(', ');
  const topSkills = profile.skills.slice(0, 15).join(', ');
  const topFrameworks = profile.frameworks.slice(0, 8).join(', ');

  return `
You are an expert career advisor and technical recruiter specializing in software engineering careers.

Analyze the following developer profile and produce a detailed, structured career intelligence report.

## Profile Overview
- Name: ${profile.displayName || 'Developer'}
- Location: ${profile.location || 'Not specified'}
- Bio: ${profile.bio || 'Not specified'}
- LinkedIn: ${linkedin ? `${linkedin.currentRole} at ${linkedin.company}` : 'Not connected'}

## Technical Skills
- Programming Languages: ${topLanguages || 'Not connected to GitHub'}
- Frameworks & Tools: ${topFrameworks || 'None detected'}
- All Skills: ${topSkills || 'None detected'}

## GitHub Activity
${github ? `
- Public Repositories: ${github.publicRepos}
- Total Stars: ${github.totalStars}
- Total Forks: ${github.totalForks}
- Followers: ${github.followers}
- Active since: ${new Date(github.joinedAt).getFullYear()}
` : '- Not connected'}

## LeetCode Progress
${leetcode ? `
- Total Problems Solved: ${leetcode.totalSolved}
- Easy: ${leetcode.easySolved}, Medium: ${leetcode.mediumSolved}, Hard: ${leetcode.hardSolved}
- Acceptance Rate: ${leetcode.acceptanceRate}%
- Contest Rating: ${leetcode.contestRating || 'Unrated'}
- Global Ranking: ${leetcode.ranking.toLocaleString()}
` : '- Not connected'}

## Competitive Programming (Codeforces)
${codeforces ? `
- Current Rating: ${codeforces.rating} (${codeforces.rank})
- Max Rating: ${codeforces.maxRating} (${codeforces.maxRank})
- Problems Solved: ${codeforces.problemsSolved}
- Contests Participated: ${codeforces.contestsParticipated}
` : '- Not connected'}

## Career Intelligence Scores
- Overall Career Readiness: ${score.overall}/100
- DSA & Algorithms: ${score.dsa}/100
- GitHub & Projects: ${score.github}/100
- Competitive Programming: ${score.cp}/100
- Activity & Consistency: ${score.activity}/100
- Open Source Quality: ${score.openSource}/100
- Learning Breadth: ${score.learning}/100

---

Based on this profile, provide a comprehensive career intelligence analysis in the following EXACT JSON structure:

{
  "strengths": ["string", "string", "string"],
  "weaknesses": ["string", "string", "string"],
  "missingSkills": [
    { "skill": "string", "priority": "high|medium|low", "reason": "string" }
  ],
  "careerReadinessSummary": "A 2-3 sentence career readiness summary based on scores and activity",
  "suggestedCertifications": [
    { "name": "string", "provider": "string" }
  ],
  "suggestedProjects": ["string", "string", "string"],
  "interviewTopics": ["string", "string", "string", "string", "string"],
  "careerMatches": [
    { "title": "string", "matchPercentage": number, "requiredSkills": ["string"] }
  ]
}

Rules:
- Provide exactly 3-5 strengths, 3-5 weaknesses, 4-6 missing skills
- Suggest 3-5 certifications relevant to their current skill profile
- Suggest 3-4 specific portfolio projects that would strengthen their profile
- List 5-8 interview topics they should prepare for based on their target roles
- Suggest 3 career paths with realistic match percentages based on actual profile data
- Be honest and specific; avoid generic advice
- All text must be professional and constructive
- Return ONLY valid JSON, no markdown wrappers
`.trim();
}
