/**
 * Profile Scorer — Computes all career intelligence scores from a UnifiedProfile.
 * All scores are normalized to 0–100.
 */

import type { UnifiedProfile, ProfileScore } from '@/types';

// ── Score calculation helpers ─────────────────────────────────────────────

function clamp(v: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(v)));
}

/**
 * GitHub Open Source Score
 * Based on: repos, stars, language breadth, fork engagement
 */
function computeGitHubScore(profile: UnifiedProfile): number {
  if (!profile.github) return 0;
  const { publicRepos, totalStars, topLanguages, totalForks } = profile.github;

  const repoScore = clamp((publicRepos / 50) * 30);                        // Max 30 pts @ 50 repos
  const starScore = clamp((totalStars / 100) * 30);                        // Max 30 pts @ 100 stars
  const langScore = clamp((topLanguages.length / 8) * 20);                 // Max 20 pts @ 8 languages
  const forkScore = clamp((totalForks / 50) * 20);                         // Max 20 pts @ 50 forks

  return clamp(repoScore + starScore + langScore + forkScore);
}

/**
 * DSA Score (LeetCode)
 * Hard problems weighted 50%, medium 30%, easy 20%
 */
function computeDSAScore(profile: UnifiedProfile): number {
  if (!profile.leetcode) return 0;
  const { totalSolved, hardSolved, mediumSolved, easySolved } = profile.leetcode;

  if (totalSolved === 0) return 0;

  // Component-based scoring
  const hardScore = clamp((hardSolved / 50) * 50);      // 50 pts max for 50+ hard problems
  const mediumScore = clamp((mediumSolved / 100) * 30); // 30 pts max for 100+ medium
  const easyScore = clamp((easySolved / 100) * 20);     // 20 pts max for 100+ easy

  return clamp(hardScore + mediumScore + easyScore);
}

/**
 * Competitive Programming Score (Codeforces)
 * Maps Codeforces rating to 0–100 scale:
 *   Newbie (<1200): 0–20
 *   Pupil (1200–1399): 20–35
 *   Specialist (1400–1599): 35–50
 *   Expert (1600–1899): 50–65
 *   Candidate Master (1900–2099): 65–75
 *   Master (2100–2299): 75–85
 *   International Master (2300–2499): 85–92
 *   Grandmaster+ (2500+): 92–100
 */
function computeCPScore(profile: UnifiedProfile): number {
  if (!profile.codeforces) return 0;
  const { rating, problemsSolved, contestsParticipated } = profile.codeforces;

  // Rating component (70% weight)
  let ratingScore = 0;
  if (rating >= 2500) ratingScore = 92 + clamp(((rating - 2500) / 500) * 8);
  else if (rating >= 2300) ratingScore = 85 + ((rating - 2300) / 200) * 7;
  else if (rating >= 2100) ratingScore = 75 + ((rating - 2100) / 200) * 10;
  else if (rating >= 1900) ratingScore = 65 + ((rating - 1900) / 200) * 10;
  else if (rating >= 1600) ratingScore = 50 + ((rating - 1600) / 300) * 15;
  else if (rating >= 1400) ratingScore = 35 + ((rating - 1400) / 200) * 15;
  else if (rating >= 1200) ratingScore = 20 + ((rating - 1200) / 200) * 15;
  else ratingScore = (rating / 1200) * 20;

  // Activity component (30% weight)
  const problemScore = clamp((problemsSolved / 300) * 15);
  const contestScore = clamp((contestsParticipated / 20) * 15);

  return clamp(ratingScore * 0.7 + (problemScore + contestScore) * 0.3);
}

/**
 * Activity Score — How consistently the user codes
 */
function computeActivityScore(profile: UnifiedProfile): number {
  let score = 0;
  
  // GitHub: recent repo updates
  if (profile.github) {
    const activeRepos = profile.github.repos.filter((r) => {
      const daysSince = (Date.now() - new Date(r.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince < 90;
    }).length;
    score += clamp((activeRepos / 5) * 40);
  }

  // LeetCode streak
  if (profile.leetcode) {
    score += clamp((profile.leetcode.streak / 30) * 30);
    score += clamp((profile.leetcode.totalSolved / 200) * 30);
  }

  return clamp(score);
}

/**
 * Open Source Score — Quality of open source contributions
 */
function computeOpenSourceScore(profile: UnifiedProfile): number {
  if (!profile.github) return 0;
  const { repos, totalStars, totalForks } = profile.github;

  // Original repos (not forks) with meaningful content
  const originalRepos = repos.filter((r) => !r.isForked).length;
  const topicRichRepos = repos.filter((r) => r.topics.length >= 2).length;

  const repoScore = clamp((originalRepos / 10) * 30);
  const starScore = clamp((totalStars / 50) * 30);
  const forkScore = clamp((totalForks / 30) * 20);
  const topicScore = clamp((topicRichRepos / 5) * 20);

  return clamp(repoScore + starScore + forkScore + topicScore);
}

/**
 * Learning Breadth Score — How many different technologies explored
 */
function computeLearningScore(profile: UnifiedProfile): number {
  const langCount = profile.programmingLanguages.length;
  const skillCount = profile.skills.length;
  const frameworkCount = profile.frameworks.length;
  const hasLinkedIn = !!profile.linkedin;
  const linkedinSkills = profile.linkedin?.skills.length || 0;

  const langScore = clamp((langCount / 8) * 30);
  const skillScore = clamp((skillCount / 20) * 30);
  const frameworkScore = clamp((frameworkCount / 5) * 25);
  const linkedinBonus = hasLinkedIn ? clamp((linkedinSkills / 10) * 15) : 0;

  return clamp(langScore + skillScore + frameworkScore + linkedinBonus);
}

/**
 * Overall Career Readiness Score — Weighted composite
 */
function computeOverallScore(scores: Omit<ProfileScore, 'overall' | 'calculatedAt' | 'breakdown'>): number {
  const weights = {
    github: 0.20,
    dsa: 0.25,
    cp: 0.20,
    activity: 0.15,
    openSource: 0.10,
    learning: 0.10,
  };

  const weighted =
    scores.github * weights.github +
    scores.dsa * weights.dsa +
    scores.cp * weights.cp +
    scores.activity * weights.activity +
    scores.openSource * weights.openSource +
    scores.learning * weights.learning;

  return clamp(weighted);
}

/** Compute the full ProfileScore from a UnifiedProfile */
export function computeProfileScore(profile: UnifiedProfile): ProfileScore {
  const github = computeGitHubScore(profile);
  const dsa = computeDSAScore(profile);
  const cp = computeCPScore(profile);
  const activity = computeActivityScore(profile);
  const openSource = computeOpenSourceScore(profile);
  const learning = computeLearningScore(profile);
  const overall = computeOverallScore({ github, dsa, cp, activity, openSource, learning });

  return {
    overall,
    github,
    dsa,
    cp,
    activity,
    openSource,
    learning,
    calculatedAt: new Date().toISOString(),
    breakdown: [
      { label: 'DSA & Algorithms', score: dsa, maxScore: 100, color: '#f59e0b', icon: '🧩' },
      { label: 'GitHub & Open Source', score: github, maxScore: 100, color: '#10b981', icon: '⚡' },
      { label: 'Competitive Programming', score: cp, maxScore: 100, color: '#8b5cf6', icon: '🏆' },
      { label: 'Activity & Consistency', score: activity, maxScore: 100, color: '#3b82f6', icon: '📈' },
      { label: 'Open Source Quality', score: openSource, maxScore: 100, color: '#06b6d4', icon: '🌟' },
      { label: 'Learning Breadth', score: learning, maxScore: 100, color: '#ec4899', icon: '📚' },
    ],
  };
}
