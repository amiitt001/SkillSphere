/**
 * Shared TypeScript interfaces used throughout the SkillSphere platform.
 * Defining types in a central location ensures data consistency and improves code quality.
 */

// ─── Career Recommendations ───
export interface Recommendation {
  title: string;
  justification: string;
  roadmap: string[];
  estimatedSalary?: string;
  suggestedCertifications?: string[];
  keyCompanies?: string[];
}

// ─── Skill Assessment Quiz ───
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  skill: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface SkillScore {
  skill: string;
  score: number;       // 0-100
  maxScore: number;
  level: 'weak' | 'average' | 'strong' | 'expert';
}

export interface QuizResult {
  questions: QuizQuestion[];
  answers: number[];
  scores: SkillScore[];
  overallScore: number;
  weakAreas: string[];
  strongAreas: string[];
  recommendations: string[];
}

// ─── Resume Analyzer ───
export interface BulletAnalysis {
  original: string;
  rating: 'weak' | 'average' | 'strong';
  suggestion: string;
  rewritten: string;
}

export interface ResumeAnalysis {
  atsScore: number;           // 0-100
  bullets: BulletAnalysis[];
  missingSkills: string[];
  suggestedProjects: string[];
  professionalSummary: string;
  overallFeedback: string;
}

// ─── Project Generator ───
export interface GeneratedProject {
  title: string;
  description: string;
  techStack: string[];
  architecture: string;
  features: string[];
  resumeDescription: string;
  folderStructure: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
}

// ─── Interview Prep ───
export interface InterviewQuestion {
  id: string;
  question: string;
  type: 'technical' | 'behavioral' | 'coding';
  difficulty: 'easy' | 'medium' | 'hard';
  expectedPoints: string[];
  sampleAnswer?: string;
}

export interface InterviewFeedback {
  structureScore: number;     // 0-100
  clarityScore: number;
  technicalScore: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  revisedAnswer: string;
}

// ─── Profile Aggregator ───
export interface GitHubProfile {
  username: string;
  avatarUrl: string;
  publicRepos: number;
  followers: number;
  totalStars: number;
  topLanguages: { name: string; percentage: number }[];
  contributionsLastYear: number;
  repos: { name: string; stars: number; language: string; description: string }[];
}

export interface CodeforcesProfile {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
  problemsSolved: number;
}

export interface LeetCodeProfile {
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  acceptanceRate: number;
  ranking: number;
}

// ─── Learning Resources ───
export interface LearningResource {
  title: string;
  platform: 'NPTEL' | 'SWAYAM' | 'YouTube' | 'Coursera' | 'Udemy';
  url: string;
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skill: string;
  rating?: number;
  isFree: boolean;
}

// ─── Job Listings ───
export interface JobListing {
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'internship' | 'contract';
  salary?: string;
  skills: string[];
  url: string;
  fitPercentage?: number;
  postedDate: string;
}
