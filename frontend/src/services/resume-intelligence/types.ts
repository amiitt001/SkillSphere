/**
 * Resume Intelligence Engine — Type Definitions
 *
 * Exposes clean, strict TypeScript interfaces for parsed, normalized, validated,
 * and enriched profiles, as well as versioning details.
 */

// ─── Field Metadata Wrapper ──────────────────────────────────────────────────

export interface ExtractedField<T> {
  value: T;
  confidence: number; // 0.0 to 1.0
  source: string; // e.g. "resume", "user", "github"
  validationStatus: 'valid' | 'invalid' | 'warning' | 'unverified';
}

// ─── Base Sub-Structures ──────────────────────────────────────────────────────

export interface ParsedContactInfo {
  fullName: ExtractedField<string>;
  email: ExtractedField<string>;
  phone: ExtractedField<string>;
  country: ExtractedField<string>;
  city: ExtractedField<string>;
  linkedin: ExtractedField<string>;
  github: ExtractedField<string>;
  portfolio: ExtractedField<string>;
  website: ExtractedField<string>;
  leetcode: ExtractedField<string>;
  codeforces: ExtractedField<string>;
  hackerrank: ExtractedField<string>;
  geeksforgeeks: ExtractedField<string>;
  kaggle: ExtractedField<string>;
  behance: ExtractedField<string>;
  dribbble: ExtractedField<string>;
  stackoverflow: ExtractedField<string>;
}

export interface ParsedEducationEntry {
  institution: ExtractedField<string>;
  degree: ExtractedField<string>;
  branch: ExtractedField<string>;
  specialization: ExtractedField<string>;
  university: ExtractedField<string>;
  college: ExtractedField<string>;
  cgpa: ExtractedField<string>;
  percentage: ExtractedField<string>;
  passingYear: ExtractedField<number | null>;
  currentStatus: ExtractedField<'completed' | 'ongoing' | string>;
}

export interface ParsedExperienceEntry {
  company: ExtractedField<string>;
  role: ExtractedField<string>;
  employmentType: ExtractedField<string>; // e.g. "Full-time", "Internship", "Contract"
  location: ExtractedField<string>;
  startDate: ExtractedField<string>; // YYYY-MM
  endDate: ExtractedField<string>; // YYYY-MM or "Present"
  currentJob: ExtractedField<boolean>;
  responsibilities: ExtractedField<string[]>;
  achievements: ExtractedField<string[]>;
  technologiesUsed: ExtractedField<string[]>;
  leadership: ExtractedField<boolean>;
  teamSize: ExtractedField<number | null>;
}

export interface ParsedProjectEntry {
  projectName: ExtractedField<string>;
  description: ExtractedField<string>;
  technologyStack: ExtractedField<string[]>;
  github: ExtractedField<string>;
  liveDemo: ExtractedField<string>;
  deployment: ExtractedField<string>; // e.g. "Vercel", "AWS", "Netlify", "Docker"
  businessProblem: ExtractedField<string>;
  features: ExtractedField<string[]>;
  role: ExtractedField<string>;
  duration: ExtractedField<string>; // e.g. "3 months"
  impact: ExtractedField<string>;
  awards: ExtractedField<string[]>;
}

export interface ParsedSkillsBlock {
  programmingLanguages: Array<ExtractedField<string>>;
  frameworks: Array<ExtractedField<string>>;
  libraries: Array<ExtractedField<string>>;
  cloud: Array<ExtractedField<string>>;
  devops: Array<ExtractedField<string>>;
  testing: Array<ExtractedField<string>>;
  ai: Array<ExtractedField<string>>;
  ml: Array<ExtractedField<string>>;
  dataScience: Array<ExtractedField<string>>;
  security: Array<ExtractedField<string>>;
  databases: Array<ExtractedField<string>>;
  operatingSystems: Array<ExtractedField<string>>;
  tools: Array<ExtractedField<string>>;
  softSkills: Array<ExtractedField<string>>;
}

export interface ParsedCertification {
  certificateName: ExtractedField<string>;
  provider: ExtractedField<string>;
  completionDate: ExtractedField<string>;
  credentialId: ExtractedField<string>;
  credentialUrl: ExtractedField<string>;
  expiry: ExtractedField<string>;
  verification: ExtractedField<boolean>;
}

export interface ParsedAchievementsBlock {
  hackathons: Array<ExtractedField<string>>;
  awards: Array<ExtractedField<string>>;
  research: Array<ExtractedField<string>>;
  publications: Array<ExtractedField<string>>;
  leadership: Array<ExtractedField<string>>;
  competitiveProgramming: Array<ExtractedField<string>>;
  openSource: Array<ExtractedField<string>>;
  scholarships: Array<ExtractedField<string>>;
}

// ─── Profile Enrichment ───────────────────────────────────────────────────────

export interface CareerProfileEnrichment {
  yearsOfExperience: number;
  primaryDomain: string; // e.g. "Frontend", "Backend", "AI/ML", "DevOps"
  secondaryDomain: string;
  careerLevel: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal' | string;
  topTechnologies: string[];
  technologyFrequency: Record<string, number>;
  learningStage: 'Student' | 'Entry-Level' | 'Professional' | 'Manager' | string;
  careerInterests: string[];
  potentialCareerPaths: string[];
  dominantProgrammingLanguage: string;
  skillDensity: number; // calculated ratio
  projectDiversity: number;
  openSourceActivity: number; // 0.0 to 1.0 index
  leadershipIndex: number; // 0.0 to 1.0 index
  deploymentExperience: number; // 0.0 to 1.0 index
  cloudReadiness: number;
  aiReadiness: number;
  dataEngineeringReadiness: number;
}

// ─── Profile Completeness ─────────────────────────────────────────────────────

export interface ProfileCompletenessReport {
  overallScore: number; // 0 to 100
  missingItems: string[];
}

// ─── Data Validation ──────────────────────────────────────────────────────────

export interface ValidationIssue {
  type: string; // e.g. "broken_url", "invalid_email", "impossible_timeline", "empty_section"
  field: string; // e.g. "contact.portfolio"
  severity: 'critical' | 'warning' | 'info';
  description: string;
}

export interface ProfileValidationReport {
  isValid: boolean;
  issues: ValidationIssue[];
}

// ─── Versioning & History ─────────────────────────────────────────────────────

export interface ProfileVersionEntry {
  versionNumber: number;
  uploadTime: string;
  fileHash: string;
  profileHash: string;
  changedFields: string[];
  addedSkills: string[];
  removedSkills: string[];
  updatedExperience: string[];
  completenessScoreDifference: number;
}

// ─── Combined Unified Career Profile Output ────────────────────────────────────

export interface UnifiedCareerProfile {
  resumeId: string;
  uid: string;
  profileVersion: number;
  profileHash: string;
  contact: ParsedContactInfo;
  education: ParsedEducationEntry[];
  experience: ParsedExperienceEntry[];
  projects: ParsedProjectEntry[];
  skills: ParsedSkillsBlock;
  certifications: ParsedCertification[];
  achievements: ParsedAchievementsBlock;
  summary: ExtractedField<string>;
  careerProfile: CareerProfileEnrichment;
  completeness: ProfileCompletenessReport;
  validation: ProfileValidationReport;
  metadata: {
    parseTimeMs: number;
    timestamp: string;
    version: string;
  };
}
