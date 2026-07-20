/**
 * Resume Intelligence — Normalization Engine
 *
 * Normalizes synonym names, degree levels, dates, and institutions.
 * Deduplicates and cleans skills, certifications, and achievements.
 */

import { normalize as fuzzyNormalize } from '../ats/normalizer';
import type {
  ParsedContactInfo,
  ParsedEducationEntry,
  ParsedExperienceEntry,
  ParsedProjectEntry,
  ParsedSkillsBlock,
  ParsedCertification,
  ParsedAchievementsBlock,
} from './types';

// ─── Synonym Map Expansion ───────────────────────────────────────────────────

export const SYNONYM_MAP: Record<string, string> = {
  'js': 'JavaScript',
  'javascript': 'JavaScript',
  'py': 'Python',
  'python': 'Python',
  'node': 'Node.js',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  'ts': 'TypeScript',
  'typescript': 'TypeScript',
  'gcp': 'Google Cloud',
  'google cloud': 'Google Cloud',
  'aws': 'Amazon Web Services',
  'amazon web services': 'Amazon Web Services',
  'k8s': 'Kubernetes',
  'kubernetes': 'Kubernetes',
  'docker': 'Docker',
  'react': 'React',
  'reactjs': 'React',
  'next': 'Next.js',
  'nextjs': 'Next.js',
  'next.js': 'Next.js',
  'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL',
  'mongo': 'MongoDB',
  'mongodb': 'MongoDB',
  'cpp': 'C++',
  'c++': 'C++',
  'golang': 'Go',
  'go': 'Go',
  'rust': 'Rust',
  'ml': 'Machine Learning',
  'machine learning': 'Machine Learning',
  'ai': 'Artificial Intelligence',
  'artificial intelligence': 'Artificial Intelligence',
  'dl': 'Deep Learning',
  'deep learning': 'Deep Learning',
  'nlp': 'Natural Language Processing',
  'tf': 'TensorFlow',
  'tensorflow': 'TensorFlow',
  'torch': 'PyTorch',
  'pytorch': 'PyTorch',
  'kube': 'Kubernetes',
  'db': 'Database',
};

// ─── Degree Normalization Map ─────────────────────────────────────────────────

export const DEGREE_MAP: Record<string, string> = {
  'btech': 'B.Tech',
  'b.tech': 'B.Tech',
  'be': 'B.E.',
  'b.e.': 'B.E.',
  'bs': 'B.S.',
  'b.s.': 'B.S.',
  'bsc': 'B.Sc',
  'b.sc.': 'B.Sc',
  'bca': 'BCA',
  'mtech': 'M.Tech',
  'm.tech': 'M.Tech',
  'me': 'M.E.',
  'm.e.': 'M.E.',
  'ms': 'M.S.',
  'm.s.': 'M.S.',
  'msc': 'M.Sc',
  'm.sc.': 'M.Sc',
  'mca': 'MCA',
  'mba': 'MBA',
  'phd': 'PhD',
  'ph.d': 'PhD',
  'bachelor': "Bachelor's",
  'master': "Master's",
};

// ─── Month Index Map ──────────────────────────────────────────────────────────

const MONTHS: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

// ─── Date Normalization Helper ────────────────────────────────────────────────

export function normalizeDateString(dateStr: string): string {
  const clean = dateStr.trim().toLowerCase();
  if (!clean || /present|current|now|active/i.test(clean)) {
    return 'Present';
  }

  // Check format: YYYY-MM-DD or YYYY/MM/DD
  const yyyyMmDd = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (yyyyMmDd) {
    return `${yyyyMmDd[1]}-${yyyyMmDd[2].padStart(2, '0')}`;
  }

  // Check format: YYYY-MM
  const yyyyMm = clean.match(/^(\d{4})[-/](\d{1,2})$/);
  if (yyyyMm) {
    return `${yyyyMm[1]}-${yyyyMm[2].padStart(2, '0')}`;
  }

  // Check format: MM/YYYY or M/YYYY
  const mmYyyy = clean.match(/^(\d{1,2})[-/](\d{4})$/);
  if (mmYyyy) {
    return `${mmYyyy[2]}-${mmYyyy[1].padStart(2, '0')}`;
  }

  // Check format: Month YYYY (e.g. "January 2021" or "Jan 2021")
  const textMonth = clean.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})\b/);
  if (textMonth) {
    const monthNum = MONTHS[textMonth[1].slice(0, 3)];
    if (monthNum) {
      return `${textMonth[2]}-${monthNum}`;
    }
  }

  // Check format: YYYY only
  const yyyyOnly = clean.match(/\b(\d{4})\b/);
  if (yyyyOnly) {
    return `${yyyyOnly[1]}-01`; // Default to January
  }

  return dateStr;
}

// ─── Title Casing Helper ──────────────────────────────────────────────────────

export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ─── Normalization Class ──────────────────────────────────────────────────────

export class ResumeNormalizer {
  /**
   * Resolves technical term aliases to standard canonical forms.
   */
  normalizeSkillName(name: string): string {
    const clean = name.trim();
    const resolved = SYNONYM_MAP[clean.toLowerCase()];
    if (resolved) return resolved;

    // Default to fallback titlecasing/casing checks
    if (clean.length <= 3 && !/[aeiouy]/i.test(clean)) {
      return clean.toUpperCase(); // e.g. SQL, XML
    }
    return toTitleCase(clean);
  }

  /**
   * Resolves degree aliases (e.g. "BTech" -> "B.Tech").
   */
  normalizeDegree(degree: string): string {
    const clean = degree.trim().replace(/[.]/g, '').toLowerCase();
    const mapped = DEGREE_MAP[clean];
    if (mapped) return mapped;

    // Search for matches
    for (const [key, val] of Object.entries(DEGREE_MAP)) {
      if (clean.includes(key)) return val;
    }

    return degree.trim();
  }

  /**
   * Normalizes parsed sections.
   */
  normalizeProfileData(
    contact: ParsedContactInfo,
    education: ParsedEducationEntry[],
    experience: ParsedExperienceEntry[],
    projects: ParsedProjectEntry[],
    skills: ParsedSkillsBlock,
    certifications: ParsedCertification[],
    achievements: ParsedAchievementsBlock
  ): {
    contact: ParsedContactInfo;
    education: ParsedEducationEntry[];
    experience: ParsedExperienceEntry[];
    projects: ParsedProjectEntry[];
    skills: ParsedSkillsBlock;
    certifications: ParsedCertification[];
    achievements: ParsedAchievementsBlock;
  } {
    // 1. Contact Info Normalization
    contact.fullName.value = toTitleCase(contact.fullName.value.trim());
    contact.city.value = toTitleCase(contact.city.value.trim());
    contact.country.value = toTitleCase(contact.country.value.trim());

    // 2. Education Entry Normalization
    const normalizedEducation = education.map((edu) => {
      edu.institution.value = toTitleCase(edu.institution.value.trim());
      edu.degree.value = this.normalizeDegree(edu.degree.value);
      edu.branch.value = toTitleCase(edu.branch.value.trim());
      edu.university.value = toTitleCase(edu.university.value.trim());
      edu.college.value = toTitleCase(edu.college.value.trim());
      return edu;
    });

    // 3. Experience Entry Normalization
    const normalizedExperience = experience.map((exp) => {
      exp.company.value = toTitleCase(exp.company.value.trim());
      exp.role.value = toTitleCase(exp.role.value.trim());
      exp.startDate.value = normalizeDateString(exp.startDate.value);
      exp.endDate.value = normalizeDateString(exp.endDate.value);
      exp.technologiesUsed.value = exp.technologiesUsed.value.map((t) => this.normalizeSkillName(t));
      return exp;
    });

    // 4. Projects Entry Normalization
    const normalizedProjects = projects.map((p) => {
      p.projectName.value = toTitleCase(p.projectName.value.trim());
      p.technologyStack.value = p.technologyStack.value.map((t) => this.normalizeSkillName(t));
      return p;
    });

    // 5. Skills Block Normalization (resolves aliases, removes duplicates)
    const normalizeAndDeduplicateSkills = (skillsList: Array<{ value: string; confidence: number; source: string; validationStatus: any }>) => {
      const seen = new Set<string>();
      const result: typeof skillsList = [];
      for (const s of skillsList) {
        const norm = this.normalizeSkillName(s.value);
        if (!seen.has(norm.toLowerCase())) {
          seen.add(norm.toLowerCase());
          s.value = norm;
          result.push(s);
        }
      }
      return result;
    };

    const normalizedSkills: ParsedSkillsBlock = {
      programmingLanguages: normalizeAndDeduplicateSkills(skills.programmingLanguages),
      frameworks: normalizeAndDeduplicateSkills(skills.frameworks),
      libraries: normalizeAndDeduplicateSkills(skills.libraries),
      cloud: normalizeAndDeduplicateSkills(skills.cloud),
      devops: normalizeAndDeduplicateSkills(skills.devops),
      testing: normalizeAndDeduplicateSkills(skills.testing),
      ai: normalizeAndDeduplicateSkills(skills.ai),
      ml: normalizeAndDeduplicateSkills(skills.ml),
      dataScience: normalizeAndDeduplicateSkills(skills.dataScience),
      security: normalizeAndDeduplicateSkills(skills.security),
      databases: normalizeAndDeduplicateSkills(skills.databases),
      operatingSystems: normalizeAndDeduplicateSkills(skills.operatingSystems),
      tools: normalizeAndDeduplicateSkills(skills.tools),
      softSkills: normalizeAndDeduplicateSkills(skills.softSkills),
    };

    // 6. Certifications Normalization
    const normalizedCertifications = certifications.map((c) => {
      c.certificateName.value = toTitleCase(c.certificateName.value.trim());
      c.provider.value = toTitleCase(c.provider.value.trim());
      c.completionDate.value = normalizeDateString(c.completionDate.value);
      c.expiry.value = normalizeDateString(c.expiry.value);
      return c;
    });

    // 7. Achievements Normalization
    const deduplicateStrings = (list: Array<{ value: string; confidence: number; source: string; validationStatus: any }>) => {
      const seen = new Set<string>();
      return list.filter((item) => {
        const clean = item.value.trim().toLowerCase();
        if (seen.has(clean)) return false;
        seen.add(clean);
        return true;
      });
    };

    const normalizedAchievements: ParsedAchievementsBlock = {
      hackathons: deduplicateStrings(achievements.hackathons),
      awards: deduplicateStrings(achievements.awards),
      research: deduplicateStrings(achievements.research),
      publications: deduplicateStrings(achievements.publications),
      leadership: deduplicateStrings(achievements.leadership),
      competitiveProgramming: deduplicateStrings(achievements.competitiveProgramming),
      openSource: deduplicateStrings(achievements.openSource),
      scholarships: deduplicateStrings(achievements.scholarships),
    };

    return {
      contact,
      education: normalizedEducation,
      experience: normalizedExperience,
      projects: normalizedProjects,
      skills: normalizedSkills,
      certifications: normalizedCertifications,
      achievements: normalizedAchievements,
    };
  }
}

export const resumeNormalizer = new ResumeNormalizer();
