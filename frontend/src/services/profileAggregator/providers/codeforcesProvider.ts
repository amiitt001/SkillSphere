/**
 * Codeforces Provider
 * Fetches public Codeforces profile data via the official REST API (no auth required).
 */

import type { CodeforcesRawData } from '@/types';
import type { ProfileProvider, ProviderResult } from '../types';
import { ProfileFetchError } from '../types';
import { logger } from '@/services/logger';

const CF_API = 'https://codeforces.com/api';

class CodeforcesProvider implements ProfileProvider<CodeforcesRawData> {
  readonly id = 'codeforces' as const;
  readonly displayName = 'Codeforces';

  validateHandle(handle: string): boolean {
    return /^[a-zA-Z0-9._-]{3,24}$/.test(handle.trim());
  }

  async fetchProfile(handle: string): Promise<ProviderResult<CodeforcesRawData>> {
    if (!this.validateHandle(handle)) {
      throw new ProfileFetchError('codeforces', handle, `Invalid Codeforces handle: "${handle}"`, 'INVALID_HANDLE');
    }

    const cleanHandle = handle.trim();
    logger.info(`[CodeforcesProvider] Fetching profile for: ${cleanHandle}`);

    // 1. Fetch user info
    const userRes = await fetch(`${CF_API}/user.info?handles=${cleanHandle}`, {
      next: { revalidate: 0 },
    });

    if (!userRes.ok) {
      if (userRes.status === 429) throw new ProfileFetchError('codeforces', cleanHandle, 'Codeforces rate limit exceeded', 'RATE_LIMITED');
      throw new ProfileFetchError('codeforces', cleanHandle, `Codeforces API error: ${userRes.status}`, 'API_ERROR');
    }

    const userData = await userRes.json();
    if (userData.status !== 'OK' || !userData.result?.length) {
      throw new ProfileFetchError('codeforces', cleanHandle, `Codeforces user not found: ${cleanHandle}`, 'NOT_FOUND');
    }

    const user = userData.result[0];

    // 2. Fetch rating history (parallel with submission stats)
    const [ratingRes, subsRes] = await Promise.allSettled([
      fetch(`${CF_API}/user.rating?handle=${cleanHandle}`, { next: { revalidate: 0 } }),
      fetch(`${CF_API}/user.status?handle=${cleanHandle}&from=1&count=5000`, { next: { revalidate: 0 } }),
    ]);

    // 3. Process rating history
    let ratingHistory: CodeforcesRawData['ratingHistory'] = [];
    if (ratingRes.status === 'fulfilled' && ratingRes.value.ok) {
      const ratingData = await ratingRes.value.json();
      if (ratingData.status === 'OK') {
        ratingHistory = (ratingData.result || []).slice(-24).map((r: any) => ({
          contestName: r.contestName,
          rating: r.newRating,
          date: new Date(r.ratingUpdateTimeSeconds * 1000).toISOString(),
          rank: r.rank,
        }));
      }
    }

    // 4. Process unique solved problems
    let problemsSolved = 0;
    if (subsRes.status === 'fulfilled' && subsRes.value.ok) {
      const subsData = await subsRes.value.json();
      if (subsData.status === 'OK') {
        const uniqueSolved = new Set<string>();
        for (const sub of subsData.result || []) {
          if (sub.verdict === 'OK' && sub.problem) {
            uniqueSolved.add(`${sub.problem.contestId}-${sub.problem.index}`);
          }
        }
        problemsSolved = uniqueSolved.size;
      }
    }

    logger.info(
      `[CodeforcesProvider] Fetched ${cleanHandle}: rating=${user.rating || 0}, solved=${problemsSolved}, contests=${ratingHistory.length}`
    );

    return {
      id: 'codeforces',
      fetchedAt: new Date().toISOString(),
      data: {
        handle: user.handle,
        rating: user.rating || 0,
        maxRating: user.maxRating || 0,
        rank: user.rank || 'unrated',
        maxRank: user.maxRank || 'unrated',
        problemsSolved,
        contestsParticipated: ratingHistory.length,
        ratingHistory,
        avatar: user.avatar || user.titlePhoto || '',
      },
    };
  }
}

export const codeforcesProvider = new CodeforcesProvider();
