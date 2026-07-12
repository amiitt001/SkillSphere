/**
 * Profile Analyzer — AI-powered career intelligence from UnifiedProfile
 */

import type { UnifiedProfile, ProfileScore, AIProfileAnalysis } from '@/types';
import { aiService } from '@/services/ai';
import { cacheStore } from '@/lib/cache';
import { logger } from '@/services/logger';
import { getProfileAnalysisPrompt } from '@/services/ai/prompts/profile';
import crypto from 'crypto';

function getFallbackAnalysis(profile: UnifiedProfile): AIProfileAnalysis {
  const hasGitHub = !!profile.github;
  const hasLeetCode = !!profile.leetcode;
  const hasCF = !!profile.codeforces;

  const strengths = [
    hasGitHub ? `Active GitHub presence with ${profile.github?.publicRepos} repositories` : 'Registered on SkillSphere platform',
    hasLeetCode ? `LeetCode experience with ${profile.leetcode?.totalSolved} problems solved` : 'Building technical skills',
    profile.programmingLanguages.length > 0 ? `Proficiency in ${profile.programmingLanguages.map((l) => l.name).slice(0, 3).join(', ')}` : 'Eager to learn',
  ];

  return {
    strengths: strengths.filter(Boolean),
    weaknesses: [
      !hasGitHub ? 'No GitHub profile connected — missing open source footprint' : 'Could improve code documentation and README quality',
      !hasLeetCode ? 'No LeetCode profile — DSA preparation needed' : 'Hard problem-solving ratio could be improved',
      !hasCF ? 'No competitive programming activity detected' : 'Contest participation frequency is low',
    ],
    missingSkills: [
      { skill: 'System Design', priority: 'high', reason: 'Required for SDE-2+ roles' },
      { skill: 'Cloud Platforms (AWS/GCP)', priority: 'medium', reason: 'Industry-standard for backend roles' },
      { skill: 'Docker & Kubernetes', priority: 'medium', reason: 'DevOps skills are increasingly expected' },
    ],
    careerReadinessSummary:
      'Your profile shows potential. Connecting all platforms will enable a comprehensive analysis. Focus on building public projects and solving challenging algorithmic problems to boost your career readiness score.',
    suggestedCertifications: [
      { name: 'AWS Cloud Practitioner', provider: 'Amazon Web Services' },
      { name: 'Google Data Analytics Certificate', provider: 'Google / Coursera' },
      { name: 'Meta Front-End Developer Certificate', provider: 'Meta / Coursera' },
    ],
    suggestedProjects: [
      'Full-stack SaaS application with user authentication and payment integration',
      'REST API with documentation, rate limiting, and comprehensive test coverage',
      'Machine learning model deployed as a web service with a dashboard',
    ],
    interviewTopics: [
      'Data Structures & Algorithms',
      'System Design Fundamentals',
      'Object-Oriented Programming',
      'Database Design & SQL',
      'REST API Design Principles',
    ],
    careerMatches: [
      { title: 'Software Development Engineer', matchPercentage: 65, requiredSkills: ['Data Structures', 'Algorithms', 'System Design'] },
      { title: 'Full-Stack Developer', matchPercentage: 60, requiredSkills: ['React', 'Node.js', 'Database'] },
      { title: 'Backend Engineer', matchPercentage: 55, requiredSkills: ['APIs', 'Databases', 'Cloud'] },
    ],
    generatedAt: new Date().toISOString(),
  };
}

export async function analyzeProfile(
  profile: UnifiedProfile,
  score: ProfileScore
): Promise<AIProfileAnalysis> {
  // Create a cache key based on profile data fingerprint
  const profileHash = crypto
    .createHash('md5')
    .update(JSON.stringify({
      github: profile.github?.username,
      leetcode: profile.leetcode?.totalSolved,
      codeforces: profile.codeforces?.rating,
      overall: score.overall,
    }))
    .digest('hex');

  const cacheKey = `profile-analysis:${profile.uid}:${profileHash}`;

  // Check cache first
  try {
    const cached = await cacheStore.get<AIProfileAnalysis>(cacheKey);
    if (cached) {
      logger.info(`[ProfileAnalyzer] Cache hit for user: ${profile.uid}`);
      return cached;
    }
  } catch (err) {
    logger.error('[ProfileAnalyzer] Cache read failed', err);
  }

  const prompt = getProfileAnalysisPrompt(profile, score);
  const fallback = getFallbackAnalysis(profile);

  logger.info(`[ProfileAnalyzer] Generating AI analysis for user: ${profile.uid}`);

  const res = await aiService.generateJSON<AIProfileAnalysis>(prompt, fallback);

  const analysis: AIProfileAnalysis = {
    ...res.data,
    generatedAt: new Date().toISOString(),
  };

  // Cache for 1 hour
  if (res.success && res.provider !== 'mock') {
    try {
      await cacheStore.set(cacheKey, analysis, 3600);
    } catch (err) {
      logger.error('[ProfileAnalyzer] Cache write failed', err);
    }
  }

  return analysis;
}
