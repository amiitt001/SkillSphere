/**
 * Profile Normalizer
 * Maps raw provider results into a canonical UnifiedProfile.
 */

import type {
  UnifiedProfile,
  GitHubRawData,
  LeetCodeRawData,
  CodeforcesRawData,
  LinkedInData,
  PlatformConnection,
} from '@/types';
import type { FetchAllResult } from './providerFactory';

/** Well-known framework/tool keywords to extract from repo topics and languages */
const FRAMEWORK_KEYWORDS = new Set([
  'react', 'nextjs', 'next.js', 'vue', 'angular', 'svelte', 'nuxt',
  'express', 'fastapi', 'django', 'flask', 'spring', 'rails', 'laravel',
  'nodejs', 'node.js', 'deno', 'bun',
  'tensorflow', 'pytorch', 'scikit-learn', 'keras', 'pandas', 'numpy',
  'docker', 'kubernetes', 'terraform', 'ansible',
  'graphql', 'rest-api', 'grpc',
  'mongodb', 'postgresql', 'mysql', 'redis', 'firebase', 'supabase',
  'tailwindcss', 'tailwind', 'bootstrap', 'material-ui', 'chakra-ui',
]);

/** Extract tech skills/frameworks from repo topics */
function extractSkillsFromTopics(repos: GitHubRawData['repos']): string[] {
  const skills = new Set<string>();
  for (const repo of repos) {
    for (const topic of repo.topics || []) {
      skills.add(topic.toLowerCase());
    }
  }
  return Array.from(skills).slice(0, 30);
}

function extractFrameworks(topics: string[]): string[] {
  return topics.filter((t) => FRAMEWORK_KEYWORDS.has(t.toLowerCase()));
}

/**
 * Normalizes all platform data into a single UnifiedProfile.
 */
export function normalizeProfile(
  uid: string,
  fetchResult: FetchAllResult,
  existingProfile?: Partial<UnifiedProfile>
): UnifiedProfile {
  const github = fetchResult.github?.data as GitHubRawData | null ?? null;
  const leetcode = fetchResult.leetcode?.data as LeetCodeRawData | null ?? null;
  const codeforces = fetchResult.codeforces?.data as CodeforcesRawData | null ?? null;
  const linkedin = fetchResult.linkedin?.data as LinkedInData | null ?? null;

  // Derive display name (priority: GitHub name → LinkedIn role → uid)
  const displayName =
    github?.name ||
    linkedin?.currentRole ||
    existingProfile?.displayName ||
    '';

  // Derive avatar (GitHub takes priority)
  const avatarUrl =
    github?.avatarUrl ||
    codeforces?.avatar ||
    existingProfile?.avatarUrl ||
    '';

  // Derive bio
  const bio =
    github?.bio ||
    linkedin?.headline ||
    existingProfile?.bio ||
    '';

  // Derive location
  const location =
    linkedin?.location ||
    existingProfile?.location ||
    '';

  // Derive website
  const website =
    github?.blog ||
    existingProfile?.website ||
    '';

  // Aggregate programming languages from GitHub
  const programmingLanguages = github?.topLanguages.map((l) => ({
    name: l.name,
    percentage: l.percentage,
  })) || existingProfile?.programmingLanguages || [];

  // Extract skills from topics
  const topicsSkills = github ? extractSkillsFromTopics(github.repos) : [];
  const linkedinSkills = (linkedin?.skills || []).map((s) => s.toLowerCase());
  const combinedSkills = Array.from(new Set([...topicsSkills, ...linkedinSkills])).slice(0, 40);

  const frameworks = extractFrameworks(combinedSkills);

  // Aggregate coding stats
  const totalRepositories = github?.publicRepos || existingProfile?.totalRepositories || 0;
  const totalStars = github?.totalStars || existingProfile?.totalStars || 0;
  const totalForks = github?.totalForks || existingProfile?.totalForks || 0;
  const codingProblemsSolved =
    (leetcode?.totalSolved || 0) + (codeforces?.problemsSolved || 0);
  const contestRating = Math.max(
    leetcode?.contestRating || 0,
    codeforces?.rating || 0
  );

  // Build connection records
  const connections: PlatformConnection[] = [];
  const now = new Date().toISOString();

  if (fetchResult.github) {
    connections.push({
      id: 'github',
      handle: github?.username || '',
      connectedAt: existingProfile?.connections?.find((c) => c.id === 'github')?.connectedAt || now,
      lastSyncAt: now,
      status: 'connected',
    });
  }
  if (fetchResult.leetcode) {
    connections.push({
      id: 'leetcode',
      handle: leetcode?.username || '',
      connectedAt: existingProfile?.connections?.find((c) => c.id === 'leetcode')?.connectedAt || now,
      lastSyncAt: now,
      status: 'connected',
    });
  }
  if (fetchResult.codeforces) {
    connections.push({
      id: 'codeforces',
      handle: codeforces?.handle || '',
      connectedAt: existingProfile?.connections?.find((c) => c.id === 'codeforces')?.connectedAt || now,
      lastSyncAt: now,
      status: 'connected',
    });
  }
  if (fetchResult.linkedin) {
    connections.push({
      id: 'linkedin',
      handle: linkedin?.profileUrl || '',
      connectedAt: existingProfile?.connections?.find((c) => c.id === 'linkedin')?.connectedAt || now,
      lastSyncAt: now,
      status: 'connected',
    });
  }

  // Mark failed connections
  for (const error of fetchResult.errors) {
    const existing = connections.find((c) => c.id === error.platformId);
    if (!existing) {
      connections.push({
        id: error.platformId,
        handle: '',
        connectedAt: '',
        lastSyncAt: now,
        status: 'error',
        error: error.message,
      });
    }
  }

  return {
    uid,
    displayName,
    avatarUrl,
    bio,
    location,
    website,
    skills: combinedSkills,
    programmingLanguages,
    frameworks,
    totalRepositories,
    totalStars,
    totalForks,
    codingProblemsSolved,
    contestRating,
    certifications: existingProfile?.certifications || [],
    github,
    leetcode,
    codeforces,
    linkedin,
    connections,
    lastSyncAt: now,
    createdAt: existingProfile?.createdAt || now,
  };
}
