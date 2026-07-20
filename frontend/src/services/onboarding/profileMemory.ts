import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebaseAdmin';
import { logger } from '@/services/logger';

// Lazy getter — ensures the Admin app is initialized before first use
function getAdminDb() {
  const db = getFirestore();
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch (e) {
    // Settings already applied
  }
  return db;
}

export interface UnifiedProfileFieldMetadata {
  source: string;
  confidence: number;
  updatedAt: string;
}

export interface UnifiedUserProfile {
  uid: string;
  profileVersion?: number;
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
  certifications?: string[];
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
      certifications: Array.from(new Set([...(existingProfile.certifications || []), ...(profile.certifications || [])])),
      projects: profile.projects ?? existingProfile.projects ?? [],
      experience: profile.experience ?? existingProfile.experience ?? [],
      careerGoals: {
        ...(existingProfile.careerGoals || {}),
        ...(profile.careerGoals || {}),
      } as any,
      profileCompleteness: profile.profileCompleteness ?? existingProfile.profileCompleteness ?? 0,
      profileVersion: (existingProfile.profileVersion || 0) + 1,
      confidenceMetadata: {
        ...(existingProfile.confidenceMetadata || {}),
        ...(profile.confidenceMetadata || {}),
      },
      lastUpdated: new Date().toISOString(),
    };

    // Clean undefined fields to ensure Firestore save compatibility
    const cleanProfile = JSON.parse(JSON.stringify(mergedProfile));

    await docRef.set({ unifiedProfile: cleanProfile }, { merge: true });
    logger.info(`[ProfileMemory] Profile successfully saved for ${uid}`);
    return mergedProfile;
  }
};
