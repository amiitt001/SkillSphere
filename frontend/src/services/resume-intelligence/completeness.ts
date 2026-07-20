/**
 * Resume Intelligence — Profile Completeness Engine
 *
 * Evaluates the completion state of a career profile and generates a list
 * of specific missing sections, URLs, or details.
 */

import type {
  UnifiedCareerProfile,
  ProfileCompletenessReport,
  ParsedContactInfo,
  ParsedEducationEntry,
  ParsedExperienceEntry,
  ParsedProjectEntry,
  ParsedSkillsBlock,
  ParsedCertification,
  ParsedAchievementsBlock,
  ExtractedField,
} from './types';

export class ProfileCompleteness {
  calculate(
    contact: ParsedContactInfo,
    education: ParsedEducationEntry[],
    experience: ParsedExperienceEntry[],
    projects: ParsedProjectEntry[],
    skills: ParsedSkillsBlock,
    certifications: ParsedCertification[],
    achievements: ParsedAchievementsBlock,
    summary: ExtractedField<string>
  ): ProfileCompletenessReport {
    const missingItems: string[] = [];
    let score = 100;

    // Helper to evaluate field and subtract score if missing
    const checkRequired = (val: string, label: string, penalty: number) => {
      if (!val.trim()) {
        missingItems.push(`Missing ${label}`);
        score -= penalty;
      }
    };

    // 1. Check Contact details (total: 30%)
    checkRequired(contact.fullName.value, 'Full Name', 10);
    checkRequired(contact.email.value, 'Email Address', 10);
    checkRequired(contact.phone.value, 'Phone Number', 5);
    checkRequired(contact.city.value, 'Location City/Country', 5);

    // 2. Check Social links (total: 15%)
    checkRequired(contact.linkedin.value, 'LinkedIn Profile URL', 5);
    checkRequired(contact.github.value, 'GitHub Profile URL', 5);
    if (!contact.portfolio.value && !contact.website.value) {
      missingItems.push('Missing Portfolio Website URL');
      score -= 5;
    }

    // 3. Check Core sections (total: 35%)
    if (!summary.value.trim()) {
      missingItems.push('Missing Professional Summary');
      score -= 10;
    }

    if (education.length === 0) {
      missingItems.push('Missing Education History');
      score -= 10;
    }

    if (experience.length === 0) {
      missingItems.push('Missing Work Experience');
      score -= 15;
    }

    // 4. Check Projects & Skills (total: 15%)
    if (projects.length === 0) {
      missingItems.push('Missing Projects');
      score -= 8;
    } else {
      // Check deployment links on projects
      const hasDeploy = projects.some((p) => p.deployment.value || p.liveDemo.value);
      if (!hasDeploy) {
        missingItems.push('Missing Deployment Links on Projects');
        score -= 3;
      }
    }

    const totalSkills = Object.values(skills).flat().length;
    if (totalSkills === 0) {
      missingItems.push('Missing Technical Skills');
      score -= 7;
    }

    // 5. Check Certifications & Achievements (total: 5%)
    if (certifications.length === 0) {
      missingItems.push('Missing Certifications');
      score -= 2;
    }

    const totalAchievements = Object.values(achievements).flat().length;
    if (totalAchievements === 0) {
      missingItems.push('Missing Achievements/Awards');
      score -= 3;
    }

    return {
      overallScore: Math.max(0, Math.min(100, score)),
      missingItems,
    };
  }
}

export const profileCompleteness = new ProfileCompleteness();
