import { IBaseRepository } from '@/shared/infrastructure/repositories/baseRepository';
import { UnifiedUserProfile, profileMemory } from '@/services/onboarding/profileMemory';

import '@/lib/firebaseAdmin';

export interface IProfileRepository extends IBaseRepository<UnifiedUserProfile> {
  getProfileByUid(uid: string): Promise<UnifiedUserProfile | null>;
}

export class ProfileRepository implements IProfileRepository {
  async getById(id: string): Promise<UnifiedUserProfile | null> {
    return this.getProfileByUid(id);
  }

  async getProfileByUid(uid: string): Promise<UnifiedUserProfile | null> {
    return await profileMemory.getProfile(uid);
  }

  async save(uid: string, profile: Partial<any>): Promise<any> {
    // If it has a resumeId or profileVersion, it is the rich UnifiedCareerProfile. Save it directly.
    if (profile.resumeId !== undefined || profile.profileVersion !== undefined) {
      const { getFirestore } = await import('firebase-admin/firestore');
      const db = getFirestore();
      try {
        db.settings({ ignoreUndefinedProperties: true });
      } catch (e) {
        // Settings already applied
      }
      const docRef = db.collection('users').doc(uid);
      const cleanProfile = JSON.parse(JSON.stringify(profile));
      await docRef.set({ unifiedProfile: cleanProfile }, { merge: true });
      return profile;
    }
    
    // Otherwise fall back to legacy simple profile merge
    return await profileMemory.saveProfile(uid, profile);
  }

  async delete(uid: string): Promise<void> {
    // Delete the nested profile field in user document
    const { getFirestore } = await import('firebase-admin/firestore');
    const db = getFirestore();
    const docRef = db.collection('users').doc(uid);
    await docRef.update({
      unifiedProfile: null
    });
  }
}

export const profileRepository: IProfileRepository = new ProfileRepository();
export default profileRepository;
