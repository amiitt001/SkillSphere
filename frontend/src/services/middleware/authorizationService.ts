import { DecodedIdToken } from '@/lib/authMiddleware';

export interface IAuthorizationService {
  isOwner(user: DecodedIdToken | undefined, resourceOwnerId: string): boolean;
  isAdmin(user: DecodedIdToken | undefined): boolean;
}

export class AuthorizationService implements IAuthorizationService {
  isOwner(user: DecodedIdToken | undefined, resourceOwnerId: string): boolean {
    if (!user) return false;
    return user.uid === resourceOwnerId;
  }

  isAdmin(user: DecodedIdToken | undefined): boolean {
    if (!user) return false;
    return !!user.admin || user.role === 'admin';
  }
}

export const authorizationService: IAuthorizationService = new AuthorizationService();
export default authorizationService;
