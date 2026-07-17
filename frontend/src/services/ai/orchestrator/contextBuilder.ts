import { profileService } from '@/services/profile/profileService';

export interface IContextBuilder {
  buildContext(userId: string): Promise<string>;
}

export class ContextBuilder implements IContextBuilder {
  async buildContext(userId: string): Promise<string> {
    const profile = await profileService.getUnifiedProfile(userId);
    if (!profile) {
      return 'User profile context not found. Onboarding is incomplete.';
    }

    const personal = profile.personalInfo || {};
    const fullName = personal.fullName || 'User';
    const email = personal.email || '';
    
    const educationStr = profile.education?.map(
      (e) => `- ${e.degree} in ${e.stream || 'N/A'} from ${e.institution} (Graduated: ${e.graduationYear || 'N/A'})`
    ).join('\n') || 'None listed';

    const experienceStr = profile.experience?.map(
      (exp) => `- ${exp.role} at ${exp.company} (${exp.duration}): ${exp.description || ''}`
    ).join('\n') || 'None listed';

    const projectsStr = profile.projects?.map(
      (p) => `- ${p.title}: ${p.description} (Tech: ${p.technologies?.join(', ') || ''})`
    ).join('\n') || 'None listed';

    const skillsStr = profile.skills?.map(
      (s) => `- ${s}`
    ).join('\n') || 'None listed';

    const goals = profile.careerGoals || {};
    const preferredRoles = goals.preferredRoles?.join(', ') || 'None specified';
    const preferredIndustries = goals.preferredIndustries?.join(', ') || 'None specified';
    const preferredLocations = goals.preferredLocations?.join(', ') || 'None specified';

    return `
=== USER PROFILE ===
Full Name: ${fullName}
Email: ${email}

=== EDUCATION ===
${educationStr}

=== EXPERIENCE ===
${experienceStr}

=== PROJECTS ===
${projectsStr}

=== SKILLS ===
${skillsStr}

=== CAREER GOALS ===
Target Roles: ${preferredRoles}
Target Industries: ${preferredIndustries}
Preferred Locations: ${preferredLocations}
Profile Completeness: ${profile.profileCompleteness}%
    `.trim();
  }
}

export const contextBuilder: IContextBuilder = new ContextBuilder();
export default contextBuilder;
