import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebaseAdmin';
import { logger } from '@/services/logger';

// Lazy getter — ensures the Admin app is initialized before first use
function getAdminDb() {
  return getFirestore();
}

export interface UnifiedProfileFieldMetadata {
  source: string;
  confidence: number;
  updatedAt: string;
}

export interface UnifiedUserProfile {
  uid: string;
  personalInfo: {
    fullName: string;
    email: string;
    githubUrl?: string;
    linkedinUrl?: string;
    leetcodeUsername?: string;
    codeforcesHandle?: string;
    location?: string;
  };
  education: Array<{
    institution: string;
    degree: string;
    graduationYear?: number;
    stream?: string;
  }>;
  skills: string[];
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
  }>;
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    description?: string;
  }>;
  careerGoals: {
    preferredRoles: string[];
    preferredIndustries: string[];
    preferredLocations: string[];
    expectedSalary?: string;
    semester?: string;
  };
  profileCompleteness: number;
  confidenceMetadata: Record<string, UnifiedProfileFieldMetadata>;
  lastUpdated: string;
}

export const profileMemory = {
  /**
   * Retrieves the Unified User Profile from Firestore.
   */
  async getProfile(uid: string): Promise<UnifiedUserProfile | null> {
    try {
      const docRef = getAdminDb().collection('users').doc(uid);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data?.unifiedProfile) {
          return data.unifiedProfile as UnifiedUserProfile;
        }
      }
      return null;
    } catch (error: any) {
      logger.error(`[ProfileMemory] Error getting profile for ${uid}:`, error);
      // Don't swallow – re-throw so callers can surface the real error
      throw error;
    }
  },

  /**
   * Saves or merges the Unified User Profile in Firestore.
   */
  async saveProfile(uid: string, profile: Partial<UnifiedUserProfile>): Promise<UnifiedUserProfile> {
    const docRef = getAdminDb().collection('users').doc(uid);
    const docSnap = await docRef.get();

    let existingProfile: Partial<UnifiedUserProfile> = {};
    if (docSnap.exists) {
      const data = docSnap.data();
      existingProfile = data?.unifiedProfile || {};
    }

    // Merge deep nested properties carefully
    const mergedProfile: UnifiedUserProfile = {
      uid,
      personalInfo: {
        ...(existingProfile.personalInfo || {}),
        ...(profile.personalInfo || {}),
      } as any,
      education: profile.education ?? existingProfile.education ?? [],
      skills: Array.from(new Set([...(existingProfile.skills || []), ...(profile.skills || [])])),
      projects: profile.projects ?? existingProfile.projects ?? [],
      experience: profile.experience ?? existingProfile.experience ?? [],
      careerGoals: {
        ...(existingProfile.careerGoals || {}),
        ...(profile.careerGoals || {}),
      } as any,
      profileCompleteness: profile.profileCompleteness ?? existingProfile.profileCompleteness ?? 0,
      confidenceMetadata: {
        ...(existingProfile.confidenceMetadata || {}),
        ...(profile.confidenceMetadata || {}),
      },
      lastUpdated: new Date().toISOString(),
    };

    // Throws on permission/network errors – DO NOT catch here so callers surface the real message
    await docRef.set({ unifiedProfile: mergedProfile }, { merge: true });
    logger.info(`[ProfileMemory] Profile successfully saved for ${uid}`);
    return mergedProfile;
  }
};
