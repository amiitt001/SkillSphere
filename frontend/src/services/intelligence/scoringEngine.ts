/**
 * Career Readiness Scoring Engine
 * Computes a 10-dimension Career Readiness Score from UnifiedProfile + SkillGraph.
 * Deterministic — no AI required.
 */

import type {
  UnifiedProfile,
  SkillGraph,
  SkillGapResult,
  CareerReadinessScore,
  CareerArchetype,
} from '@/types';

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

/**
 * Dimension 1 — Technical Skills (20%)
 * Average confidence of the user's skill nodes, weighted toward strong categories
 */
function scoreTechnicalSkills(graph: SkillGraph): number {
  if (graph.nodes.length === 0) return 0;
  const avg = graph.nodes.reduce((s, n) => s + n.confidence, 0) / graph.nodes.length;
  // Bonus for breadth: 1 point per unique category covered beyond 3
  const uniqueCategories = new Set(graph.nodes.map((n) => n.category)).size;
  const breadthBonus = Math.max(0, (uniqueCategories - 3) * 2);
  return clamp(avg + breadthBonus);
}

/**
 * Dimension 2 — Problem Solving (15%)
 * LeetCode performance with hard/medium weighting
 */
function scoreProblemSolving(profile: UnifiedProfile): number {
  if (!profile.leetcode) return 0;
  const { totalSolved, hardSolved, mediumSolved, easySolved, totalQuestions } = profile.leetcode;
  if (totalSolved === 0) return 0;

  const hardScore = Math.min(40, hardSolved * 2);
  const medScore = Math.min(35, mediumSolved * 0.5);
  const easyScore = Math.min(15, easySolved * 0.3);
  const coverageBonus = totalQuestions > 0 ? Math.min(10, (totalSolved / totalQuestions) * 100) : 0;

  return clamp(hardScore + medScore + easyScore + coverageBonus);
}

/**
 * Dimension 3 — Projects (12%)
 * Original repos with descriptions, topics, and stars
 */
function scoreProjects(profile: UnifiedProfile): number {
  if (!profile.github) return 0;
  const { repos, publicRepos } = profile.github;

  const originalRepos = repos.filter((r) => !r.isForked);
  if (originalRepos.length === 0) return clamp(Math.min(20, publicRepos));

  const repoScore = originalRepos.reduce((total, repo) => {
    let score = 10; // Base for existing
    if (repo.description && repo.description.length > 20) score += 10;
    if (repo.topics.length >= 2) score += 10;
    if (repo.stars >= 5) score += 10;
    if (repo.stars >= 20) score += 10;
    if (repo.forks >= 2) score += 10;
    return total + Math.min(score, 60);
  }, 0);

  return clamp(repoScore / Math.max(originalRepos.length, 3));
}

/**
 * Dimension 4 — Open Source (10%)
 * Stars, forks, and community engagement
 */
function scoreOpenSource(profile: UnifiedProfile): number {
  if (!profile.github) return 0;
  const { totalStars, totalForks, publicRepos } = profile.github;

  const starScore = Math.min(50, totalStars * 0.5);
  const forkScore = Math.min(30, totalForks * 1.5);
  const repoScore = Math.min(20, publicRepos * 0.5);

  return clamp(starScore + forkScore + repoScore);
}

/**
 * Dimension 5 — Competitive Programming (10%)
 * Codeforces rating mapped to 0–100
 */
function scoreCP(profile: UnifiedProfile): number {
  if (!profile.codeforces || profile.codeforces.rating === 0) {
    // Check if they have LeetCode contest rating instead
    if (profile.leetcode && profile.leetcode.contestRating > 0) {
      return clamp((profile.leetcode.contestRating - 1000) / 10);
    }
    return 0;
  }

  // Codeforces: 800=0, 1200=30, 1600=60, 2000=80, 2400+=100
  const rating = profile.codeforces.rating;
  if (rating < 800) return 0;
  if (rating < 1200) return clamp((rating - 800) * 0.075);
  if (rating < 1600) return clamp(30 + (rating - 1200) * 0.075);
  if (rating < 2000) return clamp(60 + (rating - 1600) * 0.05);
  if (rating < 2400) return clamp(80 + (rating - 2000) * 0.05);
  return 100;
}

/**
 * Dimension 6 — Communication (8%)
 * LinkedIn completeness + bio quality
 */
function scoreCommunication(profile: UnifiedProfile): number {
  let score = 0;
  if (profile.linkedin) {
    if (profile.linkedin.profileUrl) score += 20;
    if (profile.linkedin.headline) score += 15;
    if (profile.linkedin.currentRole) score += 15;
    if (profile.linkedin.company) score += 10;
    if (profile.linkedin.skills.length >= 5) score += 20;
    if (profile.linkedin.skills.length >= 15) score += 10;
    if (profile.linkedin.education.length > 0) score += 10;
  }
  if (profile.bio && profile.bio.length > 30) score += 15;
  return clamp(score);
}

/**
 * Dimension 7 — Portfolio (8%)
 * GitHub quality signals: repos with README, topics, descriptions
 */
function scorePortfolio(profile: UnifiedProfile): number {
  if (!profile.github) return 0;
  const { repos } = profile.github;

  const qualityRepos = repos.filter(
    (r) => !r.isForked && r.description && r.topics.length >= 2 && (r.stars > 0 || r.forks > 0)
  ).length;

  const baseScore = Math.min(60, qualityRepos * 20);
  const topicDiversity = Math.min(20, new Set(repos.flatMap((r) => r.topics)).size * 2);
  const starsBonus = Math.min(20, profile.github.totalStars * 0.5);

  return clamp(baseScore + topicDiversity + starsBonus);
}

/**
 * Dimension 8 — Resume (7%)
 * Profile completeness as a resume proxy
 */
function scoreResume(profile: UnifiedProfile): number {
  let score = 0;
  const connected = profile.connections.filter((c) => c.status === 'connected').length;
  score += connected * 10; // 10 pts per connected platform

  if (profile.displayName) score += 10;
  if (profile.bio && profile.bio.length > 50) score += 15;
  if (profile.location) score += 10;
  if (profile.website) score += 10;
  if (profile.skills.length >= 10) score += 15;
  if (profile.skills.length >= 20) score += 10;
  if (profile.programmingLanguages.length >= 3) score += 10;

  return clamp(score);
}

/**
 * Dimension 9 — Learning Consistency (5%)
 * Recent GitHub activity + total problems solved over time
 */
function scoreLearningConsistency(profile: UnifiedProfile): number {
  let score = 0;

  if (profile.github) {
    const { repos } = profile.github;
    const recentlyUpdated = repos.filter((r) => {
      const updated = new Date(r.updatedAt || '2000-01-01');
      const daysDiff = (Date.now() - updated.getTime()) / 86400000;
      return daysDiff < 90;
    }).length;
    score += Math.min(50, recentlyUpdated * 10);
  }

  if (profile.leetcode) {
    const totalSolved = profile.leetcode.totalSolved;
    score += Math.min(30, totalSolved * 0.3);
  }

  if (profile.codeforces) {
    const contests = profile.codeforces.contestsParticipated;
    score += Math.min(20, contests * 2);
  }

  return clamp(score);
}

/**
 * Dimension 10 — Interview Readiness (5%)
 * Combined LeetCode + Codeforces signal
 */
function scoreInterviewReadiness(profile: UnifiedProfile): number {
  let score = 0;

  if (profile.leetcode) {
    const { hardSolved, mediumSolved, totalSolved } = profile.leetcode;
    score += Math.min(40, hardSolved * 3);
    score += Math.min(30, mediumSolved * 0.5);
    if (totalSolved >= 100) score += 10;
    if (totalSolved >= 300) score += 10;
  }

  if (profile.codeforces) {
    const { rating, contestsParticipated } = profile.codeforces;
    if (rating >= 1400) score += 15;
    if (rating >= 1800) score += 10;
    if (contestsParticipated >= 10) score += 5;
  }

  return clamp(score);
}

// ── Dimension weights ─────────────────────────────────────────────────────────
const WEIGHTS = {
  technicalSkills: 0.20,
  problemSolving: 0.15,
  projects: 0.12,
  openSource: 0.10,
  competitiveProgramming: 0.10,
  communication: 0.08,
  portfolio: 0.08,
  resume: 0.07,
  learningConsistency: 0.05,
  interviewReadiness: 0.05,
};

/**
 * Compute a 10-dimension Career Readiness Score.
 */
export function computeCareerReadinessScore(
  profile: UnifiedProfile,
  graph: SkillGraph,
  targetCareer: CareerArchetype
): CareerReadinessScore {
  const dimensions = {
    technicalSkills: scoreTechnicalSkills(graph),
    problemSolving: scoreProblemSolving(profile),
    projects: scoreProjects(profile),
    openSource: scoreOpenSource(profile),
    competitiveProgramming: scoreCP(profile),
    communication: scoreCommunication(profile),
    portfolio: scorePortfolio(profile),
    resume: scoreResume(profile),
    learningConsistency: scoreLearningConsistency(profile),
    interviewReadiness: scoreInterviewReadiness(profile),
  };

  const overall = clamp(
    Object.entries(dimensions).reduce(
      (sum, [key, val]) => sum + val * WEIGHTS[key as keyof typeof WEIGHTS],
      0
    )
  );

  return {
    overall,
    dimensions,
    targetCareer,
    calculatedAt: new Date().toISOString(),
  };
}
