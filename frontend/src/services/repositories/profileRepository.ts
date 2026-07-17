import { IBaseRepository } from '@/shared/infrastructure/repositories/baseRepository';
import { UnifiedUserProfile, profileMemory } from '@/services/onboarding/profileMemory';

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

  async save(uid: string, profile: Partial<UnifiedUserProfile>): Promise<UnifiedUserProfile> {
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
