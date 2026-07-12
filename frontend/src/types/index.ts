/**
 * Shared TypeScript interfaces used throughout the SkillSphere platform.
 * Defining types in a central location ensures data consistency and improves code quality.
 */

// ─── Career Recommendations ───
export interface SimpleSkillGapItem {
  name: string;
  level: number; // 0 to 100
}

export interface SkillGapAnalysis {
  readinessScore: number;
  estimatedTime: string;
  currentSkills: string[];
  missingSkills: SimpleSkillGapItem[];
  topPrioritySkills: string[];
  aiInsight: string;
}

export interface Recommendation {
  title: string;
  justification: string;
  roadmap: string[];
  estimatedSalary?: string;
  suggestedCertifications?: string[];
  keyCompanies?: string[];
  skillGapAnalysis?: SkillGapAnalysis;
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

// ─── User Profile ───
export interface Achievement {
  id: string;
  label: string;
  icon: string;
  color: string;
  unlocked: boolean;
}

export interface UserProfile {
  fullName: string;
  email: string;
  college: string;
  stream: string;
  year: string;
  bio: string;
  location: string;
  stats: {
    repos: number;
    skills: number;
    cgpa: number;
    streak: number;
  };
  achievements: Achievement[];
  preferences: {
    emailNotifications: boolean;
    weeklyReports: boolean;
    jobAlerts: boolean;
  };
}

// ─── Phase 2.0: Profile Intelligence Platform ───

export type PlatformId = 'github' | 'leetcode' | 'codeforces' | 'linkedin';

export interface PlatformConnection {
  id: PlatformId;
  handle: string;
  connectedAt: string;
  lastSyncAt: string | null;
  status: 'connected' | 'error' | 'idle';
  error?: string;
}

// Raw Platform Data Models (rich versions)
export interface GitHubRawData {
  username: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  blog: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  totalStars: number;
  totalForks: number;
  topLanguages: { name: string; bytes: number; percentage: number }[];
  repos: GitHubRepo[];
  pinnedRepos: string[];
  contributionsLastYear: number;
  joinedAt: string;
}

export interface GitHubRepo {
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  topics: string[];
  updatedAt: string;
  url: string;
  isForked: boolean;
}

export interface LeetCodeRawData {
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  acceptanceRate: number;
  ranking: number;
  reputation: number;
  totalQuestions: number;
  easyTotal: number;
  mediumTotal: number;
  hardTotal: number;
  streak: number;
  contestRating: number;
  contestGlobalRanking: number;
}

export interface CodeforcesRawData {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
  problemsSolved: number;
  contestsParticipated: number;
  ratingHistory: { contestName: string; rating: number; date: string; rank: number }[];
  avatar: string;
}

export interface LinkedInData {
  profileUrl: string;
  headline: string;
  currentRole: string;
  company: string;
  education: string;
  skills: string[];
  location: string;
}

// Normalized / Unified Profile
export interface UnifiedProfile {
  uid: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  location: string;
  website: string;

  // Aggregated technical data
  skills: string[];
  programmingLanguages: { name: string; percentage: number }[];
  frameworks: string[];
  totalRepositories: number;
  totalStars: number;
  totalForks: number;
  codingProblemsSolved: number;
  contestRating: number;
  certifications: string[];

  // Raw platform data
  github: GitHubRawData | null;
  leetcode: LeetCodeRawData | null;
  codeforces: CodeforcesRawData | null;
  linkedin: LinkedInData | null;

  // Metadata
  connections: PlatformConnection[];
  lastSyncAt: string;
  createdAt: string;
}

// Score Engine
export interface ProfileScore {
  overall: number;        // Career Readiness Score (0–100)
  github: number;         // Open Source Score
  dsa: number;            // DSA / LeetCode Score
  cp: number;             // Competitive Programming Score
  activity: number;       // Activity / Consistency Score
  learning: number;       // Learning / Breadth Score
  openSource: number;     // Open Source Contribution Score
  calculatedAt: string;
  breakdown: {
    label: string;
    score: number;
    maxScore: number;
    color: string;
    icon: string;
  }[];
}

export interface ScoreHistoryEntry {
  date: string;
  overall: number;
  github: number;
  dsa: number;
  cp: number;
}

// AI Analysis
export interface AIProfileAnalysis {
  strengths: string[];
  weaknesses: string[];
  missingSkills: { skill: string; priority: 'high' | 'medium' | 'low'; reason: string }[];
  careerReadinessSummary: string;
  suggestedCertifications: { name: string; provider: string; url?: string }[];
  suggestedProjects: string[];
  interviewTopics: string[];
  careerMatches: { title: string; matchPercentage: number; requiredSkills: string[] }[];
  generatedAt: string;
}

// ─── Phase 2.1: Career Intelligence & Skill Gap Engine ───

/** All supported target career archetypes */
export type CareerArchetype =
  | 'Software Engineer'
  | 'Backend Engineer'
  | 'Frontend Engineer'
  | 'Full Stack Engineer'
  | 'AI / ML Engineer'
  | 'Data Scientist'
  | 'DevOps Engineer'
  | 'Cloud Engineer'
  | 'Mobile Developer'
  | 'Security Engineer';

/** The 14 skill categories used in the skill graph */
export type SkillCategory =
  | 'Programming Languages'
  | 'Frameworks'
  | 'Backend'
  | 'Frontend'
  | 'Databases'
  | 'Cloud'
  | 'DevOps'
  | 'AI / ML'
  | 'Data Structures'
  | 'Algorithms'
  | 'System Design'
  | 'Testing'
  | 'Security'
  | 'Soft Skills';

/** A single skill node in the skill graph */
export interface SkillNode {
  name: string;
  category: SkillCategory;
  confidence: number;          // 0–100 — how confident we are the user knows this skill
  source: string[];            // e.g. ['github:topics', 'leetcode:hard', 'linkedin:skills']
  lastUpdated: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  requiredProficiency?: number; // 0–100 — what the target career needs (set during gap analysis)
}

/** The complete skill graph: categorized map of skill nodes */
export interface SkillGraph {
  uid: string;
  nodes: SkillNode[];
  categoryScores: Record<SkillCategory, number>; // Average confidence per category 0–100
  totalSkills: number;
  dominantCategory: SkillCategory;
  builtAt: string;
}

/** Status of a skill relative to the target career */
export type SkillStatus = 'strong' | 'adequate' | 'weak' | 'missing' | 'critical_missing';

/** A single skill in the gap analysis result */
export interface SkillGapItem {
  skill: string;
  category: SkillCategory;
  status: SkillStatus;
  userConfidence: number;       // 0–100 (0 = missing)
  requiredProficiency: number;  // 0–100 target
  gap: number;                  // requiredProficiency - userConfidence (positive = needs work)
  priorityScore: number;        // 0–100 — impact weight for this career
  reason: string;               // Why this skill matters for this career
}

/** Full gap analysis result for a target career */
export interface SkillGapResult {
  uid: string;
  targetCareer: CareerArchetype;
  overallReadiness: number;     // 0–100
  items: SkillGapItem[];
  strongSkills: SkillGapItem[];
  weakSkills: SkillGapItem[];
  missingSkills: SkillGapItem[];
  criticalMissingSkills: SkillGapItem[];
  topPriorities: SkillGapItem[]; // Top 5 highest-impact gaps
  analyzedAt: string;
}

/** 10-dimension Career Readiness Score */
export interface CareerReadinessScore {
  overall: number;
  dimensions: {
    technicalSkills: number;
    problemSolving: number;
    projects: number;
    openSource: number;
    competitiveProgramming: number;
    communication: number;
    portfolio: number;
    resume: number;
    learningConsistency: number;
    interviewReadiness: number;
  };
  targetCareer: CareerArchetype;
  calculatedAt: string;
}

/** A single milestone in the roadmap */
export interface RoadmapMilestone {
  period: '30 Days' | '60 Days' | '90 Days' | '180 Days' | '365 Days';
  title: string;
  focus: string;            // E.g. "Master core DSA patterns"
  skills: string[];
  projects: string[];
  courses: { name: string; platform: string; url?: string }[];
  certifications: string[];
  practiceGoals: string[];
  interviewPrep: string[];
  successMetric: string;    // How to know you achieved this milestone
}

/** AI-generated personalized roadmap */
export interface AIRoadmap {
  uid: string;
  targetCareer: CareerArchetype;
  milestones: RoadmapMilestone[];
  generatedAt: string;
  basedOnScore: number;         // Overall readiness score at time of generation
}

/** A single recommendation */
export interface IntelligenceRecommendation {
  id: string;
  type: 'course' | 'project' | 'certification' | 'challenge' | 'open_source';
  title: string;
  description: string;
  platform?: string;
  estimatedTime?: string;
  skillsCovered: string[];
  impactScore: number;          // 0–100 — expected career impact
  reasoning: string;            // Why this is recommended for THIS user
  url?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

/** An evidence-based AI insight */
export interface AIInsight {
  id: string;
  type: 'achievement' | 'warning' | 'suggestion' | 'milestone';
  text: string;
  evidenceKey: string;          // Which data point generated this (e.g. 'github.totalStars')
  evidenceValue: string;        // Human readable evidence (e.g. '47 stars, +12 this month')
  generatedAt: string;
}

/** A dated progress snapshot */
export interface ProgressSnapshot {
  date: string;
  readinessScore: number;
  dimensions: CareerReadinessScore['dimensions'];
  newSkills: string[];
  skillDelta: number;           // Change in total skills since previous snapshot
  insights: AIInsight[];
}

/** Weekly/monthly progress report */
export interface ProgressReport {
  uid: string;
  targetCareer: CareerArchetype;
  snapshots: ProgressSnapshot[];
  weeklyDelta: number;          // Change in overall score over last 7 days
  monthlyDelta: number;
  trendDirection: 'up' | 'down' | 'stable';
  insights: AIInsight[];
  generatedAt: string;
}

/** Full career intelligence report — the master output of Phase 2.1 */
export interface CareerIntelligenceReport {
  uid: string;
  targetCareer: CareerArchetype;
  skillGraph: SkillGraph;
  gapResult: SkillGapResult;
  readinessScore: CareerReadinessScore;
  roadmap?: AIRoadmap;
  recommendations?: IntelligenceRecommendation[];
  progress?: ProgressReport;
  analyzedAt: string;
}


