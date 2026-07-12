/**
 * Provider Factory — Registry and orchestration for all platform providers.
 * Adding a new platform requires only: 1) creating a provider file, 2) registering it here.
 */

import type { PlatformId, GitHubRawData, LeetCodeRawData, CodeforcesRawData, LinkedInData } from '@/types';
import type { ProfileProvider, ProviderResult, RawPlatformData } from './types';
import { ProfileFetchError } from './types';
import { githubProvider } from './providers/githubProvider';
import { leetcodeProvider } from './providers/leetcodeProvider';
import { codeforcesProvider } from './providers/codeforcesProvider';
import { linkedinProvider } from './providers/linkedinProvider';
import { logger } from '@/services/logger';

/** Map of all registered providers */
const providerRegistry = new Map<PlatformId, ProfileProvider<any>>();

/** Register a provider into the registry */
function register(provider: ProfileProvider<any>) {
  providerRegistry.set(provider.id, provider);
  logger.info(`[ProviderFactory] Registered provider: ${provider.displayName}`);
}

// ── Register all providers ──────────────────────────────────────────────────
register(githubProvider);
register(leetcodeProvider);
register(codeforcesProvider);
register(linkedinProvider);
// Adding HackerRank, Kaggle etc.: just register here

/** Retrieve a specific provider by ID */
export function getProvider(id: PlatformId): ProfileProvider<any> | undefined {
  return providerRegistry.get(id);
}

export interface FetchHandles {
  github?: string;
  leetcode?: string;
  codeforces?: string;
  linkedin?: string;
}

export interface FetchAllResult {
  github: ProviderResult<GitHubRawData> | null;
  leetcode: ProviderResult<LeetCodeRawData> | null;
  codeforces: ProviderResult<CodeforcesRawData> | null;
  linkedin: ProviderResult<LinkedInData> | null;
  errors: { platformId: PlatformId; message: string; code: string }[];
}

/**
 * Fetch all connected platforms in parallel.
 * A failure in one provider never blocks others.
 */
export async function fetchAllProfiles(handles: FetchHandles): Promise<FetchAllResult> {
  const result: FetchAllResult = {
    github: null,
    leetcode: null,
    codeforces: null,
    linkedin: null,
    errors: [],
  };

  const tasks: Promise<void>[] = [];

  for (const [platformId, handle] of Object.entries(handles) as [PlatformId, string][]) {
    if (!handle?.trim()) continue;

    const provider = providerRegistry.get(platformId);
    if (!provider) {
      logger.warn(`[ProviderFactory] No provider registered for: ${platformId}`);
      continue;
    }

    tasks.push(
      provider
        .fetchProfile(handle.trim())
        .then((res) => {
          (result as any)[platformId] = res;
          logger.info(`[ProviderFactory] ✓ ${provider.displayName} fetch completed`);
        })
        .catch((err) => {
          const error =
            err instanceof ProfileFetchError
              ? { platformId, message: err.message, code: err.code }
              : { platformId, message: String(err), code: 'API_ERROR' };
          result.errors.push(error);
          logger.error(`[ProviderFactory] ✗ ${provider.displayName} fetch failed: ${error.message}`);
        })
    );
  }

  await Promise.all(tasks);

  const connected = Object.values(result).filter((v) => v !== null && !Array.isArray(v)).length;
  logger.info(`[ProviderFactory] Sync complete: ${connected} providers connected, ${result.errors.length} errors`);

  return result;
}
