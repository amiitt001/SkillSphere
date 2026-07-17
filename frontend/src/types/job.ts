/**
 * AI Job Intelligence Engine — Type Definitions
 * All types for job analysis, scoring, and artifact generation.
 */

// ─── Input Types ──────────────────────────────────────────────────────────────

export type JobInputSource = 'url' | 'text' | 'pdf';

export interface JobInput {
  source: JobInputSource;
  /** Raw text for 'text' source, URL string for 'url' source */
  content: string;
}

// ─── Normalised Job Description ───────────────────────────────────────────────

export interface JobRequirement {
  skill: string;
  required: boolean;  // true = must-have, false = nice-to-have
  yearsNeeded?: number;
}

export interface JobDescription {
  title: string;
  company: string;
  location: string;
  jobType: 'full-time' | 'part-time' | 'internship' | 'contract' | 'remote' | 'hybrid' | 'unknown';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead' | 'unknown';
  yearsOfExperience: string;    // e.g. "2-4 years"
  responsibilities: string[];
  requirements: JobRequirement[];
  niceToHave: string[];
  requiredSkills: string[];     // flat list derived from requirements
  niceSkills: string[];         // flat list derived from niceToHave
  salary?: string;
  domain: string;               // e.g. "Web Development", "Data Science"
  rawText: string;
  sourceUrl?: string;
}

// ─── Match Scores ─────────────────────────────────────────────────────────────

export interface JobMatchScores {
  overall: number;        // 0–100
  ats: number;            // keyword density match
  skills: number;         // required skills coverage
  experience: number;     // experience level alignment
  projects: number;       // project domain relevance
}

export type ApplicationRecommendation = 'apply_now' | 'improve_first' | 'strong_match' | 'reach';

export interface MissingSkill {
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedLearningTime: string;
  reason: string;
}

// ─── Match Report ─────────────────────────────────────────────────────────────

export interface JobMatchReport {
  scores: JobMatchScores;
  recommendation: ApplicationRecommendation;
  recommendationReason: string;
  readinessScore: number;   // 0–100 — overall readiness
  readinessEstimate: string; // e.g. "Ready in ~3 months"
  matchedSkills: string[];
  missingSkills: MissingSkill[];
  matchedExperience: string[];
  matchedProjects: string[];
  strengths: string[];
  gaps: string[];
  aiInsight: string;        // 2–3 sentence summary
}

// ─── Generated Artifacts ─────────────────────────────────────────────────────

export interface ResumeImprovement {
  section: string;
  original?: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
}

export interface InterviewRoadmapItem {
  topic: string;
  type: 'technical' | 'behavioral' | 'system-design' | 'domain';
  priority: 'must-know' | 'important' | 'good-to-know';
  resources: string[];
  sampleQuestion: string;
}

export interface LearningRoadmapItem {
  skill: string;
  duration: string;
  resources: string[];
  milestone: string;
}

export interface JobArtifacts {
  resumeImprovements: ResumeImprovement[];
  coverLetter: string;
  linkedInMessage: string;
  interviewRoadmap: InterviewRoadmapItem[];
  learningRoadmap: LearningRoadmapItem[];
}

// ─── Saved Job ────────────────────────────────────────────────────────────────

export interface SavedJob {
  id: string;           // Firestore document ID
  uid: string;
  jobDescription: JobDescription;
  matchReport: JobMatchReport;
  artifacts: JobArtifacts;
  savedAt: string;      // ISO timestamp
  lastRecalculatedAt: string;
  notes?: string;
  applicationStatus: 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected' | 'archived';
}
