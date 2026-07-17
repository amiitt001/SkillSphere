import { IProfileRepository, profileRepository } from '@/services/repositories/profileRepository';
import { UnifiedUserProfile } from '@/services/onboarding/profileMemory';

export interface IProfileService {
  getUnifiedProfile(userId: string): Promise<UnifiedUserProfile | null>;
  saveUnifiedProfile(userId: string, profile: Partial<UnifiedUserProfile>): Promise<UnifiedUserProfile>;
}

export class ProfileService implements IProfileService {
  private repository: IProfileRepository;

  constructor(repository: IProfileRepository = profileRepository) {
    this.repository = repository;
  }

  async getUnifiedProfile(userId: string): Promise<UnifiedUserProfile | null> {
    return await this.repository.getProfileByUid(userId);
  }

  async saveUnifiedProfile(userId: string, profile: Partial<UnifiedUserProfile>): Promise<UnifiedUserProfile> {
    return await this.repository.save(userId, profile);
  }
}

export const profileService: IProfileService = new ProfileService();
export default profileService;
