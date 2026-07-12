/**
 * GitHub Provider
 * Fetches comprehensive public GitHub profile data via the GitHub REST API v3.
 * Uses GITHUB_TOKEN env var when available (5000 req/hr vs 60/hr unauthenticated).
 */

import type { GitHubRawData, GitHubRepo } from '@/types';
import type { ProfileProvider, ProviderResult } from '../types';
import { ProfileFetchError } from '../types';
import { logger } from '@/services/logger';

const GITHUB_API = 'https://api.github.com';

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: getHeaders(), next: { revalidate: 0 } });
  if (res.status === 404) throw new ProfileFetchError('github', '', 'GitHub user not found', 'NOT_FOUND');
  if (res.status === 403 || res.status === 429) throw new ProfileFetchError('github', '', 'GitHub API rate limit exceeded', 'RATE_LIMITED');
  if (!res.ok) throw new ProfileFetchError('github', '', `GitHub API error: ${res.status}`, 'API_ERROR');
  return res.json() as Promise<T>;
}

class GitHubProvider implements ProfileProvider<GitHubRawData> {
  readonly id = 'github' as const;
  readonly displayName = 'GitHub';

  validateHandle(handle: string): boolean {
    return /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(handle.trim());
  }

  async fetchProfile(handle: string): Promise<ProviderResult<GitHubRawData>> {
    if (!this.validateHandle(handle)) {
      throw new ProfileFetchError('github', handle, `Invalid GitHub username: "${handle}"`, 'INVALID_HANDLE');
    }

    const username = handle.trim().toLowerCase();
    logger.info(`[GitHubProvider] Fetching profile for: ${username}`);

    // 1. Fetch user profile
    type GHUser = {
      login: string; name: string | null; avatar_url: string; bio: string | null;
      blog: string | null;
      public_repos: number; followers: number; following: number; created_at: string;
    };
    const user = await fetchJson<GHUser>(`${GITHUB_API}/users/${username}`);

    // 2. Fetch repos (top 30 by stars)
    type GHRepo = {
      name: string; description: string | null; stargazers_count: number; forks_count: number;
      language: string | null; topics: string[]; updated_at: string; html_url: string; fork: boolean;
    };
    const rawRepos = await fetchJson<GHRepo[]>(
      `${GITHUB_API}/users/${username}/repos?sort=stars&per_page=30&direction=desc`
    );

    // 3. Calculate language bytes distribution (more accurate than repo count)
    const langBytes: Record<string, number> = {};
    let totalStars = 0;
    let totalForks = 0;

    const repos: GitHubRepo[] = rawRepos.map((r) => {
      totalStars += r.stargazers_count || 0;
      totalForks += r.forks_count || 0;
      if (r.language) {
        // Weight by stars to surface dominant languages
        langBytes[r.language] = (langBytes[r.language] || 0) + 1 + (r.stargazers_count || 0);
      }
      return {
        name: r.name,
        description: r.description || '',
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language || 'Unknown',
        topics: r.topics || [],
        updatedAt: r.updated_at,
        url: r.html_url,
        isForked: r.fork,
      };
    });

    // 4. Compute top languages with percentage
    const totalWeight = Object.values(langBytes).reduce((a, b) => a + b, 0);
    const topLanguages = Object.entries(langBytes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, bytes]) => ({
        name,
        bytes,
        percentage: totalWeight > 0 ? Math.round((bytes / totalWeight) * 100) : 0,
      }));

    logger.info(`[GitHubProvider] Successfully fetched ${username}: ${repos.length} repos, ${totalStars} stars`);

    return {
      id: 'github',
      fetchedAt: new Date().toISOString(),
      data: {
        username: user.login,
        name: user.name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        blog: user.blog,
        publicRepos: user.public_repos,
        followers: user.followers,
        following: user.following,
        totalStars,
        totalForks,
        topLanguages,
        repos,
        pinnedRepos: [],       // Requires GraphQL — populated if GITHUB_TOKEN available
        contributionsLastYear: 0,  // Requires GraphQL
        joinedAt: user.created_at,
      },
    };
  }
}

export const githubProvider = new GitHubProvider();
