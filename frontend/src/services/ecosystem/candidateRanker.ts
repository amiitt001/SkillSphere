import { aiService } from '../ai/aiService';
import { MOCK_CANDIDATES, CandidateMockProfile } from './mockEcosystemData';
import type { CandidateRankInsight, HiringJob } from './types';

const DEFAULT_INSIGHTS: Record<string, Partial<CandidateRankInsight>> = {
  'student_1': {
    justification: 'Amit has exceptional NodeJS experience and docker containerization skills, closing most backend pipelines. Overall readiness is in the top 10% of B2B candidates.',
    missingSkills: ['System Design', 'Redis caching keys'],
    confidence: 'high',
    interviewTips: ['Ask Amit to explain Docker multi-stage build caching.', 'Drill on database schema index tuning.']
  },
  'student_3': {
    justification: 'Rohan has verified Kubernetes configurations and Redis caches built. Fits SDE-1 requirements perfectly with 90+ DSA performance.',
    missingSkills: ['GoLang core structures'],
    confidence: 'high',
    interviewTips: ['Discuss LRU cache implementation steps.', 'Ask about AWS container orchestrations.']
  }
};

/**
 * Calculates a matching rank score between a candidate profile and hiring job requirements.
 */
function calculateRankScore(candidate: CandidateMockProfile, job: HiringJob): number {
  const jobRequirements = job.requirements.map(r => r.toLowerCase());
  const candidateSkills = candidate.skills.map(s => s.toLowerCase());

  let matches = 0;
  jobRequirements.forEach(req => {
    if (candidateSkills.some(skill => skill.includes(req) || req.includes(skill))) {
      matches++;
    }
  });

  const skillsMatchRatio = jobRequirements.length > 0 ? matches / jobRequirements.length : 0.5;

  // Weighted formula
  return Math.round(
    skillsMatchRatio * 40 +
    candidate.readinessScore * 0.4 +
    candidate.githubScore * 0.1 +
    candidate.dsaScore * 0.1
  );
}

/**
 * Filters and ranks candidates based on requirements, and queries the LLM for explanations.
 */
export async function rankCandidatesForJob(
  job: HiringJob,
  skillsFilter?: string[]
): Promise<CandidateRankInsight[]> {
  // 1. Filter candidates by active parameters
  let filtered = [...MOCK_CANDIDATES];
  if (skillsFilter && skillsFilter.length > 0) {
    const filterLower = skillsFilter.map(s => s.toLowerCase());
    filtered = filtered.filter(c =>
      c.skills.some(skill => filterLower.some(f => skill.toLowerCase().includes(f)))
    );
  }

  // 2. Compute algorithmic scores
  const candidatesWithScores = filtered.map(candidate => {
    const rankScore = calculateRankScore(candidate, job);
    return { candidate, rankScore };
  });

  // Sort descending by rankScore
  candidatesWithScores.sort((a, b) => b.rankScore - a.rankScore);

  // 3. Generate explanation cards using AI
  const insights: CandidateRankInsight[] = [];

  for (const { candidate, rankScore } of candidatesWithScores) {
    const prompt = `
You are the SkillSphere Recruiter AI Matcher. Evaluate this candidate for the job:
Job Title: "${job.title}" at "${job.companyName}"
Job Requirements: [${job.requirements.join(', ')}]

Candidate: "${candidate.name}" (Readiness Score: ${candidate.readinessScore})
Skills: [${candidate.skills.join(', ')}]

Output a JSON response that maps EXACTLY to the following format. Do not add markdown:
{
  "justification": "Why this candidate matches, mentioning their strengths and readiness (2 sentences)",
  "missingSkills": ["missing skill 1", "missing skill 2"],
  "confidence": "high" or "medium" or "low",
  "interviewTips": ["tip 1", "tip 2"]
}
`;

    // Retrieve default fallback
    const fallback = {
      justification: `${candidate.name} matches ${rankScore}% of requirements with a strong profile in ${candidate.skills.slice(0, 3).join(', ')}.`,
      missingSkills: candidate.missingSkills,
      confidence: (rankScore >= 80 ? 'high' : rankScore >= 60 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      interviewTips: [`Review their core DSA understanding in ${candidate.skills[0] || 'programming'}.`, 'Verify their portfolio architecture design.']
    };

    const cachedInsight = DEFAULT_INSIGHTS[candidate.id];
    const initialData = cachedInsight ? { ...fallback, ...cachedInsight } : fallback;

    let aiInsight = initialData;

    try {
      const response = await aiService.generateJSON(
        prompt,
        initialData,
        'You are a candidate ranker assistant. Output strictly valid JSON matching the requested structure.'
      );
      aiInsight = response.data;
    } catch (error) {
      console.error(`[Candidate Ranker] Error ranking student ${candidate.name}:`, error);
    }

    insights.push({
      candidateId: candidate.id,
      name: candidate.name,
      email: candidate.email,
      readinessScore: candidate.readinessScore,
      rankScore,
      justification: aiInsight.justification,
      missingSkills: aiInsight.missingSkills,
      confidence: aiInsight.confidence,
      interviewTips: aiInsight.interviewTips
    });
  }

  return insights;
}
