import { FirestoreRepository, IBaseRepository } from '@/shared/infrastructure/repositories/baseRepository';
import { UnifiedUserProfile } from '@/services/onboarding/profileMemory';

export interface UserDocument {
  uid: string;
  currentResumeFilename?: string;
  currentResumeText?: string;
  updatedAt?: string;
  unifiedProfile?: UnifiedUserProfile;
  [key: string]: any;
}

export interface IUserRepository extends IBaseRepository<UserDocument> {
  getByUid(uid: string): Promise<UserDocument | null>;
}

export class UserRepository extends FirestoreRepository<UserDocument> implements IUserRepository {
  constructor() {
    super('users');
  }

  async getByUid(uid: string): Promise<UserDocument | null> {
    return this.getById(uid);
  }
}

export const userRepository: IUserRepository = new UserRepository();
export default userRepository;
