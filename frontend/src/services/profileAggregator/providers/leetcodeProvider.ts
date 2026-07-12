/**
 * LeetCode Provider
 * Fetches public LeetCode profile data via their GraphQL endpoint.
 * Falls back to alfa-leetcode-api proxy when direct access is blocked.
 */

import type { LeetCodeRawData } from '@/types';
import type { ProfileProvider, ProviderResult } from '../types';
import { ProfileFetchError } from '../types';
import { logger } from '@/services/logger';

// The alfa-leetcode-api is a well-known open-source proxy used by the community
// Source: https://github.com/alfaarghya/alfa-leetcode-api
const ALFA_API = 'https://alfa-leetcode-api.onrender.com';

const PRIMARY_QUERY = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
      profile {
        ranking
        reputation
        starRating
        userAvatar
      }
    }
    userContestRanking(username: $username) {
      rating
      globalRanking
    }
    allQuestionsCount {
      difficulty
      count
    }
  }
`;

class LeetCodeProvider implements ProfileProvider<LeetCodeRawData> {
  readonly id = 'leetcode' as const;
  readonly displayName = 'LeetCode';

  validateHandle(handle: string): boolean {
    return /^[a-zA-Z0-9_-]{3,25}$/.test(handle.trim());
  }

  async fetchProfile(handle: string): Promise<ProviderResult<LeetCodeRawData>> {
    if (!this.validateHandle(handle)) {
      throw new ProfileFetchError('leetcode', handle, `Invalid LeetCode username: "${handle}"`, 'INVALID_HANDLE');
    }

    const username = handle.trim();
    logger.info(`[LeetCodeProvider] Fetching profile for: ${username}`);

    // Try primary GraphQL endpoint first
    try {
      return await this.fetchFromGraphQL(username);
    } catch (err) {
      logger.warn(`[LeetCodeProvider] Primary GraphQL failed, trying proxy: ${(err as Error).message}`);
    }

    // Fallback to alfa-leetcode-api proxy
    return await this.fetchFromProxy(username);
  }

  private async fetchFromGraphQL(username: string): Promise<ProviderResult<LeetCodeRawData>> {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
      },
      body: JSON.stringify({ query: PRIMARY_QUERY, variables: { username } }),
      next: { revalidate: 0 },
    });

    if (!res.ok) throw new Error(`LeetCode GraphQL HTTP ${res.status}`);
    const json = await res.json();
    if (json.errors?.length) throw new Error(json.errors[0].message);
    
    const user = json?.data?.matchedUser;
    if (!user) throw new ProfileFetchError('leetcode', username, `LeetCode user not found: ${username}`, 'NOT_FOUND');

    return this.parseGraphQLResponse(username, json.data);
  }

  private parseGraphQLResponse(username: string, data: Record<string, any>): ProviderResult<LeetCodeRawData> {
    const user = data.matchedUser;
    const stats = user.submitStatsGlobal?.acSubmissionNum || [];
    const allQ = data.allQuestionsCount || [];

    const getAC = (d: string) => stats.find((s: any) => s.difficulty === d)?.count ?? 0;
    const getTotal = (d: string) => allQ.find((q: any) => q.difficulty === d)?.count ?? 0;

    return {
      id: 'leetcode',
      fetchedAt: new Date().toISOString(),
      data: {
        username: user.username,
        totalSolved: getAC('All'),
        easySolved: getAC('Easy'),
        mediumSolved: getAC('Medium'),
        hardSolved: getAC('Hard'),
        acceptanceRate: 0,
        ranking: user.profile?.ranking ?? 0,
        reputation: user.profile?.reputation ?? 0,
        totalQuestions: getTotal('All'),
        easyTotal: getTotal('Easy'),
        mediumTotal: getTotal('Medium'),
        hardTotal: getTotal('Hard'),
        streak: 0,
        contestRating: Math.round(data.userContestRanking?.rating ?? 0),
        contestGlobalRanking: data.userContestRanking?.globalRanking ?? 0,
      },
    };
  }

  private async fetchFromProxy(username: string): Promise<ProviderResult<LeetCodeRawData>> {
    logger.info(`[LeetCodeProvider] Using alfa-leetcode-api proxy for: ${username}`);
    
    const [userRes, solvedRes] = await Promise.allSettled([
      fetch(`${ALFA_API}/${username}`, { next: { revalidate: 0 } }),
      fetch(`${ALFA_API}/${username}/solved`, { next: { revalidate: 0 } }),
    ]);

    if (userRes.status === 'rejected') {
      throw new ProfileFetchError('leetcode', username, 'LeetCode API unavailable', 'API_ERROR');
    }

    const res = userRes.value;
    if (res.status === 404) throw new ProfileFetchError('leetcode', username, `LeetCode user not found: ${username}`, 'NOT_FOUND');
    if (!res.ok) throw new ProfileFetchError('leetcode', username, `LeetCode proxy error: ${res.status}`, 'API_ERROR');

    const userData = await res.json();
    let solvedData: any = {};
    if (solvedRes.status === 'fulfilled' && solvedRes.value.ok) {
      solvedData = await solvedRes.value.json();
    }

    logger.info(`[LeetCodeProvider] Proxy fetch successful for: ${username}`);

    return {
      id: 'leetcode',
      fetchedAt: new Date().toISOString(),
      data: {
        username: userData.username || username,
        totalSolved: solvedData.solvedProblem || userData.totalSolved || 0,
        easySolved: solvedData.easySolved || 0,
        mediumSolved: solvedData.mediumSolved || 0,
        hardSolved: solvedData.hardSolved || 0,
        acceptanceRate: userData.acceptanceRate || 0,
        ranking: userData.ranking || 0,
        reputation: userData.reputation || 0,
        totalQuestions: userData.totalQuestions || 0,
        easyTotal: userData.easyQuestions || 0,
        mediumTotal: userData.mediumQuestions || 0,
        hardTotal: userData.hardQuestions || 0,
        streak: userData.streak || 0,
        contestRating: Math.round(userData.contestRating || 0),
        contestGlobalRanking: userData.contestGlobalRanking || 0,
      },
    };
  }
}

export const leetcodeProvider = new LeetCodeProvider();
