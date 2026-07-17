import { DecodedIdToken } from '@/lib/authMiddleware';

export interface ISessionService {
  isSessionActive(user: DecodedIdToken | undefined): boolean;
}

export class SessionService implements ISessionService {
  isSessionActive(user: DecodedIdToken | undefined): boolean {
    if (!user) return false;
    
    // Check if Firebase token expiration time (exp) is in the future
    const currentTime = Math.floor(Date.now() / 1000);
    return user.exp > currentTime;
  }
}

export const sessionService: ISessionService = new SessionService();
export default sessionService;
