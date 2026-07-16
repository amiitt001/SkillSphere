export type NodeType =
  | 'User'
  | 'Education'
  | 'Skill'
  | 'Project'
  | 'Resume'
  | 'Experience'
  | 'Certification'
  | 'GitHub'
  | 'LeetCode'
  | 'Codeforces'
  | 'LearningResource'
  | 'Interview'
  | 'Job'
  | 'CareerGoal'
  | 'Company'
  | 'Portfolio';

export type RelationshipType =
  | 'HAS_SKILL'
  | 'REQUIRED_BY'
  | 'HIRED_BY'
  | 'COMPLETED'
  | 'BUILT_IN'
  | 'HAS_EDUCATION'
  | 'STUDIED_AT'
  | 'WORKED_AT'
  | 'SYNCED_WITH'
  | 'TARGETING_ROLE';

export interface GraphNode {
  id: string;
  type: NodeType;
  properties: Record<string, any>;
}

export interface GraphRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  properties: Record<string, any>;
}

export interface CareerKnowledgeGraph {
  uid: string;
  nodes: Record<string, GraphNode>;
  relationships: GraphRelationship[];
}

export interface ProvenanceMetadata {
  extractionSource: 'resume' | 'github' | 'leetcode' | 'codeforces' | 'linkedin' | 'user_manual';
  provider: string; // e.g. "gemini-1.5-flash", "github-sync-api"
  extractionMethod: 'llm_extraction' | 'oauth_sync' | 'form_submission';
  timestamp: string;
  confidence: number; // 0.0 to 1.0
  verificationStatus: 'verified' | 'unverified' | 'rejected';
  version: number;
}

export interface ProfileItem<T> {
  value: T;
  meta: ProvenanceMetadata;
}

export interface PersonalInfo {
  fullName: ProfileItem<string>;
  email: ProfileItem<string>;
  location: ProfileItem<string>;
  bio: ProfileItem<string>;
  avatarUrl: ProfileItem<string>;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  stream: string;
  graduationYear?: number;
  grade?: string;
  meta: ProvenanceMetadata;
}

export interface ProjectEntry {
  title: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  meta: ProvenanceMetadata;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  duration: string;
  description?: string;
  meta: ProvenanceMetadata;
}

export interface CareerGoals {
  preferredRoles: ProfileItem<string[]>;
  preferredIndustries: ProfileItem<string[]>;
  preferredLocations: ProfileItem<string[]>;
  expectedSalary?: ProfileItem<string>;
  semester?: ProfileItem<string>;
}

export interface SkillNode {
  name: string;
  confidence: number;
  source: string[];
  lastUpdated: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface PlatformConnection {
  platformId: 'github' | 'leetcode' | 'codeforces' | 'linkedin';
  handle: string;
  connectedAt: string;
  lastSyncAt: string | null;
  status: 'connected' | 'error' | 'idle';
}

export interface CareerHealthMetric {
  overallScore: number;
  breakdown: {
    technicalSkills: number;
    projectsQuality: number;
    learningBreadth: number;
    interviewReadiness: number;
    resumeQuality: number;
    portfolioGlow: number;
    openSourceContrib: number;
    applicationRates: number;
  };
}

export interface UnifiedUserProfile {
  uid: string;
  personalInfo: PersonalInfo;
  education: EducationEntry[];
  skills: SkillNode[];
  projects: ProjectEntry[];
  experience: ExperienceEntry[];
  careerGoals: CareerGoals;
  certifications: ProfileItem<string[]>;
  achievements: ProfileItem<string[]>;
  connections: PlatformConnection[];
  profileCompleteness: {
    overall: number;
    critical: number;
    career: number;
    technical: number;
  };
  careerScore: number;
  careerHealth?: CareerHealthMetric;
  skillGraph?: any | null;
  aiMemory: Record<string, any>;
  lastSyncAt: string;
  createdAt: string;
}

export type ProfileEventType =
  | 'ResumeUploaded'
  | 'ProfileUpdated'
  | 'SkillAdded'
  | 'GitHubSynced'
  | 'InterviewCompleted'
  | 'QuizFinished'
  | 'CertificationCompleted'
  | 'JobApplied'
  | 'CareerGoalChanged';

export interface ProfileEvent {
  eventId: string;
  eventType: ProfileEventType;
  aggregateId: string;
  timestamp: string;
  payload: Record<string, any>;
  metadata: {
    actor: string;
    clientIp?: string;
    userAgent?: string;
  };
  version: number;
}
