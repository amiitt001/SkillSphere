import { aiService } from '../ai/aiService';
import { MOCK_CANDIDATES, CandidateMockProfile } from './mockEcosystemData';

export interface PlacementIntelligence {
  readyStudentsCount: number;
  highRiskStudentsCount: number;
  mostRequestedSkills: string[];
  weakDepartments: string[];
  placementProbability: number; // 0 to 100
  expectedSalaryBands: string;
  campusDrivesRecommendation: string[];
}

const DEFAULT_PLACEMENT_INTEL: PlacementIntelligence = {
  readyStudentsCount: 2,
  highRiskStudentsCount: 1,
  mostRequestedSkills: ['Docker Compose orchestration', 'Redis caching key schemes', 'TypeScript interfaces'],
  weakDepartments: ['Electronics (due to lower web stack and systems programming coverage)'],
  placementProbability: 85,
  expectedSalaryBands: '₹8,00,000 to ₹18,00,000 LPA',
  campusDrivesRecommendation: [
    'Schedule immediate caching and system scaling workshops before Amazon drive.',
    'Initiate student GitHub profile reviews and README documentation improvements.'
  ]
};

/**
 * Computes university-wide candidate metrics.
 */
export function computeUniversityStats(orgId: string) {
  const students = MOCK_CANDIDATES.filter(c => c.organizationId === orgId);
  if (students.length === 0) {
    return {
      averageReadiness: 0,
      placementReadyPct: 0,
      readinessDistribution: { weak: 0, average: 0, ready: 0, expert: 0 },
      departmentAverages: {},
      mostCommonMissingSkills: []
    };
  }

  const total = students.length;
  let totalReadiness = 0;
  let readyCount = 0;
  const dist = { weak: 0, average: 0, ready: 0, expert: 0 };
  const deptTotals: Record<string, { sum: number; count: number }> = {};
  const missingSkillCounts: Record<string, number> = {};

  students.forEach(s => {
    totalReadiness += s.readinessScore;
    if (s.readinessScore >= 70) readyCount++;

    if (s.readinessScore < 60) dist.weak++;
    else if (s.readinessScore < 75) dist.average++;
    else if (s.readinessScore < 90) dist.ready++;
    else dist.expert++;

    // Dept totals
    if (!deptTotals[s.department]) {
      deptTotals[s.department] = { sum: 0, count: 0 };
    }
    deptTotals[s.department].sum += s.readinessScore;
    deptTotals[s.department].count += 1;

    // Missing skills aggregation
    s.missingSkills.forEach(skill => {
      missingSkillCounts[skill] = (missingSkillCounts[skill] || 0) + 1;
    });
  });

  const departmentAverages: Record<string, number> = {};
  Object.keys(deptTotals).forEach(dept => {
    departmentAverages[dept] = Math.round(deptTotals[dept].sum / deptTotals[dept].count);
  });

  const sortedGaps = Object.entries(missingSkillCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])
    .slice(0, 5);

  return {
    averageReadiness: Math.round(totalReadiness / total),
    placementReadyPct: Math.round((readyCount / total) * 100),
    readinessDistribution: dist,
    departmentAverages,
    mostCommonMissingSkills: sortedGaps
  };
}

/**
 * Invokes LLM to generate placement forecasting insights.
 */
export async function getPlacementIntelligence(orgId: string): Promise<PlacementIntelligence> {
  const students = MOCK_CANDIDATES.filter(c => c.organizationId === orgId);
  const stats = computeUniversityStats(orgId);

  const studentSummary = students.map(s => `- ${s.name} (${s.department}): Score ${s.readinessScore}, target ${s.targetRole}. Gaps: ${s.missingSkills.join(', ')}`).join('\n');

  const prompt = `
You are the SkillSphere Placement Intelligence analyzer.
Review these statistics and student summaries for University "${orgId}":
Average Readiness: ${stats.averageReadiness}/100
Placement-Ready Candidates: ${stats.placementReadyPct}%
Common Skill Gaps: [${stats.mostCommonMissingSkills.join(', ')}]

Student details:
${studentSummary}

Output a JSON response that maps EXACTLY to the following format. Do not add markdown:
{
  "readyStudentsCount": 3,
  "highRiskStudentsCount": 1,
  "mostRequestedSkills": ["skill A", "skill B"],
  "weakDepartments": ["department name (due to reason)"],
  "placementProbability": 82,
  "expectedSalaryBands": "salary range LPA",
  "campusDrivesRecommendation": ["rec 1", "rec 2"]
}
`;

  try {
    const response = await aiService.generateJSON<PlacementIntelligence>(
      prompt,
      DEFAULT_PLACEMENT_INTEL,
      'You are a university analytics assistant. Output strictly valid JSON matching the requested structure.'
    );
    return response.data;
  } catch (error) {
    console.error('[Placement Intelligence] Error forecasting placement trends:', error);
    return DEFAULT_PLACEMENT_INTEL;
  }
}
