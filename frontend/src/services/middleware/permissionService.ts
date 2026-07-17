import { DecodedIdToken } from '@/lib/authMiddleware';

export interface IPermissionService {
  canAccessFeature(user: DecodedIdToken | undefined, feature: string): boolean;
}

export class PermissionService implements IPermissionService {
  canAccessFeature(user: DecodedIdToken | undefined, feature: string): boolean {
    if (!user) return false;
    
    // Admin has access to all features
    if (user.admin || user.role === 'admin') return true;

    // Feature permission rules (could check claims or subscription level)
    const subTier = user.subscriptionTier || 'free';

    if (feature === 'enterprise-analytics') {
      return subTier === 'enterprise';
    }

    if (feature === 'advanced-job-matching' || feature === 'copilot-chat') {
      return ['premium', 'enterprise'].includes(subTier);
    }

    // Default features are public
    return true;
  }
}

export const permissionService: IPermissionService = new PermissionService();
export default permissionService;
