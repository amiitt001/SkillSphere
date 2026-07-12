/**
 * Profile Aggregator — Provider Interface & Shared Types
 * All platform providers must implement the ProfileProvider interface.
 */

import type {
  GitHubRawData,
  LeetCodeRawData,
  CodeforcesRawData,
  LinkedInData,
  PlatformId,
} from '@/types';

/** Union of all raw platform data types */
export type RawPlatformData =
  | GitHubRawData
  | LeetCodeRawData
  | CodeforcesRawData
  | LinkedInData;

/** Normalized result returned by every provider */
export interface ProviderResult<T extends RawPlatformData> {
  id: PlatformId;
  data: T;
  fetchedAt: string;
}

/**
 * The contract every provider must implement.
 * Adding a new platform = creating a new file that implements this interface.
 */
export interface ProfileProvider<T extends RawPlatformData = RawPlatformData> {
  readonly id: PlatformId;
  readonly displayName: string;

  /**
   * Fetch profile data for the given handle.
   * @throws ProfileFetchError on API failure or user-not-found.
   */
  fetchProfile(handle: string): Promise<ProviderResult<T>>;

  /** Validate a handle before fetching (format check). */
  validateHandle(handle: string): boolean;
}

/** Structured error from provider fetch */
export class ProfileFetchError extends Error {
  constructor(
    public readonly platformId: PlatformId,
    public readonly handle: string,
    message: string,
    public readonly code: 'NOT_FOUND' | 'RATE_LIMITED' | 'API_ERROR' | 'INVALID_HANDLE'
  ) {
    super(message);
    this.name = 'ProfileFetchError';
  }
}
