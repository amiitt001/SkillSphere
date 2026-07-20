/**
 * Resume Intelligence — Validation Engine
 *
 * Scans the structured profile for data anomalies, broken or invalid URLs,
 * timeline overlaps, impossible dates, and missing structural content.
 * Annotates each field validationStatus directly.
 */

import type {
  UnifiedCareerProfile,
  ValidationIssue,
  ProfileValidationReport,
  ExtractedField,
} from './types';

// ─── Simple Format Validation Regexes ─────────────────────────────────────────

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const URL_RE = /^https?:\/\/[^\s$.?#].[^\s]*$/i;
const GITHUB_RE = /github\.com/i;
const LINKEDIN_RE = /linkedin\.com/i;

function parseDateObject(dateStr: string): Date | null {
  if (!dateStr || /present/i.test(dateStr)) return new Date();
  const parts = dateStr.split('-');
  const year = parseInt(parts[0]);
  const month = parts[1] ? parseInt(parts[1]) - 1 : 0;
  if (isNaN(year)) return null;
  return new Date(year, month);
}

export class ResumeValidator {
  /**
   * Scans a career profile, compiles issues, and sets field validationStatus fields.
   */
  validate(profile: Omit<UnifiedCareerProfile, 'completeness' | 'validation' | 'careerProfile'>): ProfileValidationReport {
    const issues: ValidationIssue[] = [];

    // Helper to validate email
    const validateEmailField = (field: ExtractedField<string>, path: string) => {
      if (!field.value) {
        field.validationStatus = 'unverified';
        return;
      }
      if (!EMAIL_RE.test(field.value)) {
        field.validationStatus = 'invalid';
        issues.push({
          type: 'invalid_email',
          field: path,
          severity: 'critical',
          description: `Email address "${field.value}" has an invalid structure.`,
        });
      } else {
        field.validationStatus = 'valid';
      }
    };

    // Helper to validate URL syntax
    const validateUrlField = (field: ExtractedField<string>, path: string, isGitHub = false, isLinkedIn = false) => {
      if (!field.value) {
        field.validationStatus = 'unverified';
        return;
      }

      // Check if it has protocol prefix; if not, check common formats
      let urlToCheck = field.value;
      if (!/^https?:\/\//i.test(urlToCheck)) {
        urlToCheck = `https://${urlToCheck}`;
      }

      let parsedUrl: URL | null = null;
      try {
        parsedUrl = new URL(urlToCheck);
      } catch {
        // failed parsing
      }

      if (!parsedUrl || !URL_RE.test(urlToCheck) || !parsedUrl.hostname.includes('.')) {
        field.validationStatus = 'invalid';
        issues.push({
          type: 'broken_url',
          field: path,
          severity: 'warning',
          description: `URL "${field.value}" has an invalid format.`,
        });
      } else if (isGitHub && !GITHUB_RE.test(urlToCheck)) {
        field.validationStatus = 'warning';
        issues.push({
          type: 'invalid_github_url',
          field: path,
          severity: 'warning',
          description: `Expected a GitHub URL but got "${field.value}".`,
        });
      } else if (isLinkedIn && !LINKEDIN_RE.test(urlToCheck)) {
        field.validationStatus = 'warning';
        issues.push({
          type: 'invalid_linkedin_url',
          field: path,
          severity: 'warning',
          description: `Expected a LinkedIn URL but got "${field.value}".`,
        });
      } else {
        field.validationStatus = 'valid';
      }
    };

    // Validate Contact details
    const c = profile.contact;
    validateEmailField(c.email, 'contact.email');
    validateUrlField(c.github, 'contact.github', true, false);
    validateUrlField(c.linkedin, 'contact.linkedin', false, true);
    validateUrlField(c.portfolio, 'contact.portfolio');
    validateUrlField(c.website, 'contact.website');
    validateUrlField(c.leetcode, 'contact.leetcode');
    validateUrlField(c.codeforces, 'contact.codeforces');

    // Simple fields validation
    if (c.fullName.value) c.fullName.validationStatus = 'valid';
    if (c.phone.value) c.phone.validationStatus = 'valid';

    // Validate Education timelines
    for (let i = 0; i < profile.education.length; i++) {
      const edu = profile.education[i];
      const year = edu.passingYear.value;
      const currentYear = new Date().getFullYear();

      edu.institution.validationStatus = edu.institution.value ? 'valid' : 'invalid';
      edu.degree.validationStatus = edu.degree.value ? 'valid' : 'invalid';

      if (year) {
        if (year < 1980 || year > currentYear + 6) {
          edu.passingYear.validationStatus = 'invalid';
          issues.push({
            type: 'impossible_date',
            field: `education[${i}].passingYear`,
            severity: 'warning',
            description: `Passing year ${year} is outside of standard ranges.`,
          });
        } else {
          edu.passingYear.validationStatus = 'valid';
        }
      }
    }

    // Validate Experience dates and timelines
    const parsedExperiences = profile.experience.map((exp, idx) => {
      const start = parseDateObject(exp.startDate.value);
      const end = parseDateObject(exp.endDate.value);

      exp.company.validationStatus = exp.company.value ? 'valid' : 'invalid';
      exp.role.validationStatus = exp.role.value ? 'valid' : 'invalid';

      if (start && end) {
        if (start > end) {
          exp.startDate.validationStatus = 'invalid';
          exp.endDate.validationStatus = 'invalid';
          issues.push({
            type: 'impossible_timeline',
            field: `experience[${idx}]`,
            severity: 'critical',
            description: `Start date "${exp.startDate.value}" occurs after end date "${exp.endDate.value}".`,
          });
        } else if (start > new Date()) {
          exp.startDate.validationStatus = 'warning';
          issues.push({
            type: 'impossible_date',
            field: `experience[${idx}].startDate`,
            severity: 'warning',
            description: `Start date "${exp.startDate.value}" is in the future.`,
          });
        } else {
          exp.startDate.validationStatus = 'valid';
          exp.endDate.validationStatus = 'valid';
        }
      }
      return { start, end, idx, company: exp.company.value, role: exp.role.value };
    });

    // Check for overlapping experience timelines (only full-time roles, not internships)
    for (let i = 0; i < parsedExperiences.length; i++) {
      const e1 = parsedExperiences[i];
      if (!e1.start || !e1.end) continue;

      const type1 = profile.experience[e1.idx].employmentType.value.toLowerCase();
      if (type1.includes('intern') || type1.includes('part')) continue;

      for (let j = i + 1; j < parsedExperiences.length; j++) {
        const e2 = parsedExperiences[j];
        if (!e2.start || !e2.end) continue;

        const type2 = profile.experience[e2.idx].employmentType.value.toLowerCase();
        if (type2.includes('intern') || type2.includes('part')) continue;

        // Check intersection of date ranges
        const maxStart = e1.start > e2.start ? e1.start : e2.start;
        const minEnd = e1.end < e2.end ? e1.end : e2.end;

        if (maxStart < minEnd) {
          // Verify that overlapping range is larger than 1 month to ignore minor date resolution discrepancies
          const diffMs = minEnd.getTime() - maxStart.getTime();
          const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.4);

          if (diffMonths > 2) {
            issues.push({
              type: 'overlapping_experience',
              field: `experience[${e1.idx}] & experience[${e2.idx}]`,
              severity: 'warning',
              description: `Overlapping full-time experiences: "${e1.role} at ${e1.company}" and "${e2.role} at ${e2.company}" overlap by ${Math.round(diffMonths)} months.`,
            });
          }
        }
      }
    }

    // Validate Projects
    for (let i = 0; i < profile.projects.length; i++) {
      const p = profile.projects[i];
      p.projectName.validationStatus = p.projectName.value ? 'valid' : 'invalid';
      validateUrlField(p.github, `projects[${i}].github`, true, false);
      validateUrlField(p.liveDemo, `projects[${i}].liveDemo`);
    }

    // Validate Certifications
    for (let i = 0; i < profile.certifications.length; i++) {
      const cert = profile.certifications[i];
      cert.certificateName.validationStatus = cert.certificateName.value ? 'valid' : 'invalid';
      validateUrlField(cert.credentialUrl, `certifications[${i}].credentialUrl`);
    }

    return {
      isValid: issues.filter((i) => i.severity === 'critical').length === 0,
      issues,
    };
  }
}

export const resumeValidator = new ResumeValidator();
