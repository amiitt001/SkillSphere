import type { UserRole } from './types';

// Map actions to roles allowed to execute them
const PERMISSION_MAP: Record<string, UserRole[]> = {
  'post_job': ['Recruiter', 'CompanyAdmin', 'SuperAdmin'],
  'shortlist_candidate': ['Recruiter', 'CompanyAdmin', 'SuperAdmin'],
  'view_student_analysis': ['Recruiter', 'Mentor', 'Faculty', 'PlacementOfficer', 'UniversityAdmin', 'CompanyAdmin', 'SuperAdmin'],
  'view_university_metrics': ['Faculty', 'PlacementOfficer', 'UniversityAdmin', 'SuperAdmin'],
  'schedule_mentor_session': ['Student', 'Mentor', 'SuperAdmin'],
  'trigger_intervention': ['Faculty', 'PlacementOfficer', 'UniversityAdmin', 'SuperAdmin'],
  'configure_campaign': ['CompanyAdmin', 'SuperAdmin'],
  'view_audit_logs': ['UniversityAdmin', 'CompanyAdmin', 'SuperAdmin']
};

/**
 * Checks whether a user role has permission to execute an action.
 */
export function hasPermission(role: UserRole, action: string): boolean {
  if (role === 'SuperAdmin') return true;
  const allowedRoles = PERMISSION_MAP[action];
  if (!allowedRoles) return true; // Actions not restricted are open
  return allowedRoles.includes(role);
}

/**
 * Verifies that the actor's organization matches the target organization
 * to enforce multi-tenant isolation.
 */
export function verifyTenantAccess(
  actorOrgId: string | undefined,
  targetOrgId: string | undefined
): boolean {
  if (!actorOrgId || !targetOrgId) return false;
  return actorOrgId === targetOrgId;
}
