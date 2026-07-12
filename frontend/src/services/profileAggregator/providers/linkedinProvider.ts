/**
 * LinkedIn Provider — ToS-Compliant Display-Only Implementation
 *
 * LinkedIn's Terms of Service prohibit scraping and require OAuth for API access.
 * This provider handles user-provided information only — no scraping or unauthorized access.
 */

import type { LinkedInData } from '@/types';
import type { ProfileProvider, ProviderResult } from '../types';
import { ProfileFetchError } from '../types';

class LinkedInProvider implements ProfileProvider<LinkedInData> {
  readonly id = 'linkedin' as const;
  readonly displayName = 'LinkedIn';

  validateHandle(handle: string): boolean {
    // Accept profile URL or linkedin.com/in/username format
    const cleaned = handle.trim();
    if (cleaned.includes('linkedin.com/in/')) return true;
    // Also accept plain username
    return /^[a-zA-Z0-9_-]{3,100}$/.test(cleaned);
  }

  /**
   * LinkedIn provider does not fetch any remote data.
   * It validates the URL and returns whatever user-provided data is passed.
   * This method expects `handle` to be a JSON-encoded LinkedInData object.
   */
  async fetchProfile(handle: string): Promise<ProviderResult<LinkedInData>> {
    if (!handle.trim()) {
      throw new ProfileFetchError('linkedin', handle, 'LinkedIn profile URL is required', 'INVALID_HANDLE');
    }

    // handle is the profile URL; the rest of the data comes from the caller
    const profileUrl = handle.trim();
    const normalizedUrl = profileUrl.startsWith('http')
      ? profileUrl
      : `https://www.linkedin.com/in/${profileUrl}`;

    return {
      id: 'linkedin',
      fetchedAt: new Date().toISOString(),
      data: {
        profileUrl: normalizedUrl,
        headline: '',
        currentRole: '',
        company: '',
        education: '',
        skills: [],
        location: '',
      },
    };
  }

  /**
   * Accepts complete user-provided data instead of fetching remotely.
   */
  fromUserData(data: Partial<LinkedInData> & { profileUrl: string }): ProviderResult<LinkedInData> {
    return {
      id: 'linkedin',
      fetchedAt: new Date().toISOString(),
      data: {
        profileUrl: data.profileUrl,
        headline: data.headline || '',
        currentRole: data.currentRole || '',
        company: data.company || '',
        education: data.education || '',
        skills: data.skills || [],
        location: data.location || '',
      },
    };
  }
}

export const linkedinProvider = new LinkedInProvider();
