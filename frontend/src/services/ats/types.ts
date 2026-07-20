/**
 * ATS Intelligence Platform — Shared Type Definitions
 *
 * These types are self-contained within the ATS subsystem.
 * They do NOT import from @/types to avoid circular dependencies.
 */

// ─── Parsed Resume ───────────────────────────────────────────────────────────

export interface ParsedContactInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
  otherLinks: string[];
}

export interface ParsedEducation {
  institution: string;
  degree: string;
  branch: string;
  graduationYear: number | null;
  cgpa: string;
  relevantCoursework: string[];
}

export interface ParsedExperience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
  isInternship: boolean;
  bullets: string[];
  quantifiedBullets: string[];     // Bullets with measurable outcomes
  hasLeadershipKeywords: boolean;
  hasImpactKeywords: boolean;
}

export interface ParsedProject {
  title: string;
  description: string;
  technologies: string[];
  hasGitHubLink: boolean;
  hasDeploymentLink: boolean;
  hasDocumentation: boolean;
  complexitySignals: string[];     // Keywords indicating complexity
  businessImpactSignals: string[]; // Keywords indicating business value
}

export interface ParsedAchievement {
  raw: string;
  type: AchievementType;
}

export type AchievementType =
  | 'award'
  | 'hackathon'
  | 'research'
  | 'open_source'
  | 'leadership'
  | 'competitive_programming'
  | 'patent'
  | 'publication'
  | 'certification'
  | 'other';

export interface ParsedSkill {
  name: string;
  normalizedName: string;
  category: SkillCategory;
  isModern: boolean;              // In modern tech index
  modernityYear: number | null;   // Year when tech became mainstream
}

export type SkillCategory =
  | 'programming_language'
  | 'framework'
  | 'library'
  | 'cloud'
  | 'database'
  | 'devops'
  | 'testing'
  | 'ai_ml'
  | 'data'
  | 'security'
  | 'tool'
  | 'soft_skill'
  | 'other';

export interface StructuredResumeJSON {
  rawText: string;
  contact: ParsedContactInfo;
  summary: string;
  education: ParsedEducation[];
  experience: ParsedExperience[];
  projects: ParsedProject[];
  skills: ParsedSkill[];
  achievements: ParsedAchievement[];
  certifications: string[];
  languages: string[];
  sections: DetectedSection[];
  totalExperienceMonths: number;
  hasQuantifiedAchievements: boolean;
  detectedFormattingIssues: FormattingIssue[];
  parsedAt: string;
}

export interface DetectedSection {
  name: string;
  normalizedName: string;
  startLine: number;
  present: boolean;
}

export interface FormattingIssue {
  type: FormattingIssueType;
  description: string;
  severity: 'critical' | 'warning' | 'info';
}

export type FormattingIssueType =
  | 'table_detected'
  | 'image_placeholder'
  | 'header_footer_content'
  | 'inconsistent_dates'
  | 'multiple_columns_likely'
  | 'missing_section_headers'
  | 'font_inconsistency'
  | 'excessive_whitespace'
  | 'special_characters';

// ─── Parsed Job Description ───────────────────────────────────────────────────

export interface StructuredJobJSON {
  rawText: string;
  company: string;
  role: string;
  industry: string;
  requiredSkills: string[];
  preferredSkills: string[];
  responsibilities: string[];
  requiredExperienceYears: number | null;
  preferredExperienceYears: number | null;
  educationRequirements: string[];
  certificationRequirements: string[];
  tools: string[];
  keywords: KeywordWithWeight[];
  softSkillKeywords: string[];
  culturalKeywords: string[];
  parsedAt: string;
}

export interface KeywordWithWeight {
  keyword: string;
  normalizedKeyword: string;
  weight: number;   // 1–3; higher = appeared in title/heading or repeated
  occurrences: number;
}

// ─── Recommendation ───────────────────────────────────────────────────────────

export interface ATSRecommendation {
  id: string;
  category: string;
  title: string;
  reason: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  expectedScoreGain: number;        // In points (0–10)
  resources: ATSResource[];
}

export interface ATSResource {
  type: 'project' | 'course' | 'certification' | 'article';
  title: string;
  platform?: string;
  url?: string;
}

// ─── Universal ATS Report (Engine 1) ─────────────────────────────────────────

export interface ATSCategoryScore {
  name: string;
  weight: number;               // 0–1
  rawScore: number;             // 0–100 before weighting
  weightedScore: number;        // rawScore * weight (0–weight * 100)
  issues: string[];
  strengths: string[];
  recommendations: ATSRecommendation[];
}

export interface UniversalATSReport {
  universalScore: number;         // 0–100 final weighted score
  grade: ATSGrade;
  categories: {
    atsCompatibility: ATSCategoryScore;
    resumeStructure: ATSCategoryScore;
    technicalSkills: ATSCategoryScore;
    experienceQuality: ATSCategoryScore;
    projects: ATSCategoryScore;
    achievements: ATSCategoryScore;
    writingQuality: ATSCategoryScore;
    resumeCompleteness: ATSCategoryScore;
    industryReadiness: ATSCategoryScore;
  };
  strengths: string[];
  weaknesses: string[];
  missingSections: string[];
  formattingIssues: string[];
  improvementPriority: ATSRecommendation[];   // Top 5 sorted by expectedScoreGain
  estimatedScoreImprovement: number;           // Max possible gain if all recs applied
  parsedResume: StructuredResumeJSON;
  scoredAt: string;
  engineVersion: string;
}

export type ATSGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';

// ─── Job Match Report (Engine 2) ─────────────────────────────────────────────

export interface JobMatchCategoryScore {
  name: string;
  weight: number;
  rawScore: number;
  weightedScore: number;
  matched: string[];
  missing: string[];
  notes: string[];
}

export interface JobMatchReport {
  jobMatchScore: number;            // 0–100 final weighted score
  grade: ATSGrade;
  targetRole: string;
  company: string;
  categories: {
    keywordMatch: JobMatchCategoryScore;
    skillsMatch: JobMatchCategoryScore;
    experienceMatch: JobMatchCategoryScore;
    projectsMatch: JobMatchCategoryScore;
    educationMatch: JobMatchCategoryScore;
    achievementsMatch: JobMatchCategoryScore;
    responsibilitiesMatch: JobMatchCategoryScore;
    culturalSignals: JobMatchCategoryScore;
  };
  matchedSkills: string[];
  missingSkills: string[];
  missingKeywords: string[];
  transferableSkills: string[];
  experienceGaps: string[];
  projectGaps: string[];
  certificationGaps: string[];
  priorityImprovements: ATSRecommendation[];
  estimatedMatchImprovement: number;
  parsedJob: StructuredJobJSON;
  scoredAt: string;
  engineVersion: string;
}

// ─── Combined Report ──────────────────────────────────────────────────────────

export interface CombinedATSReport {
  universalReport: UniversalATSReport;
  jobMatchReport: JobMatchReport | null;
  aiExplanation: ATSAIExplanation | null;
  generatedAt: string;
}

export interface ATSAIExplanation {
  universalScoreExplanation: string;
  jobMatchExplanation: string | null;
  rewrittenBullets: RewrittenBullet[];
  improvedSummary: string;
  keywordSuggestions: string[];
  coverLetterSnippet: string | null;
  generatedAt: string;
}

export interface RewrittenBullet {
  original: string;
  rewritten: string;
  improvement: string;
}

// ─── Request Shapes ───────────────────────────────────────────────────────────

export interface UniversalATSRequest {
  resumeText: string;
}

export interface JobMatchATSRequest {
  resumeText: string;
  jobDescription: string;
  targetRole?: string;
  industry?: string;
}

export interface ATSExplainRequest {
  universalReport: UniversalATSReport;
  jobMatchReport?: JobMatchReport;
  resumeText: string;
  jobDescription?: string;
}
