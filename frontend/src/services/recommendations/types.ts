export interface RelevanceScores {
  relevance: number;        // 0-100
  impact: number;           // 0-100
  difficulty: number;       // 0-100
  timeToComplete: string;   // e.g. "2 weeks", "3 months"
  confidence: number;       // 0-100
  overall: number;          // Weighted combination
}

export type EligibilityTier = 'Eligible' | 'Nearly Eligible' | 'Not Eligible';

export interface EligibilityStatus {
  status: EligibilityTier;
  reason: string;
}

// Raw Item Definitions
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote';
  provider: 'LinkedIn Jobs' | 'Indeed' | 'Naukri' | 'Wellfound' | 'RemoteOK';
  salaryEstimate: string;
  experienceRequired: number; // in years
  skillsRequired: string[];
  description: string;
  difficultyLevel: 'Entry' | 'Mid' | 'Senior';
  url: string;
}

export interface Internship {
  id: string;
  title: string;
  company: string;
  location: string;
  provider: 'Internshala' | 'LinkedIn' | 'Wellfound';
  duration: string;
  stipend: string;
  skillsRequired: string[];
  academicYearTarget: string[]; // e.g. ["3rd Year", "4th Year"]
  description: string;
  url: string;
}

export interface Course {
  id: string;
  title: string;
  provider: 'NPTEL' | 'SWAYAM' | 'Coursera' | 'edX' | 'freeCodeCamp' | 'YouTube' | 'Microsoft Learn' | 'AWS Skill Builder' | 'Google Cloud Skills Boost';
  cost: number; // 0 for free
  costCurrency: string;
  language: string; // e.g. "English", "Hindi", "Tamil"
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  skillsGained: string[];
  description: string;
  rating: number;
  url: string;
  category: 'Free Resources' | 'Paid Courses' | 'Regional Language Resources' | 'University Courses' | 'Hands-on Labs' | 'Books' | 'Documentation' | 'Video Tutorials';
}

export interface Certification {
  id: string;
  name: string;
  provider: 'Google' | 'AWS' | 'Microsoft' | 'Cisco' | 'Oracle' | 'Red Hat';
  cost: number;
  timeInvestment: string; // e.g. "2-3 months"
  demandScore: number; // 1-10 scale
  careerGoalsAligned: string[];
  skillsAddressed: string[];
  description: string;
  url: string;
}

export interface ProjectTemplate {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  skillsToClose: string[];
  githubReady: boolean;
  description: string;
  steps: string[];
}

// Orchestrated recommendation types
export interface JobRecommendation extends Job {
  matchPercentage: number;
  missingSkills: string[];
  strongSkills: string[];
  resumeCompatibility: number;
  experienceCompatibility: number;
  locationCompatibility: number;
  scores: RelevanceScores;
  eligibility: EligibilityStatus;
  isBookmarked?: boolean;
  applicationStatus?: string; // 'applied' | 'interviewing' | 'offered' | 'rejected'
}

export interface InternshipRecommendation extends Internship {
  matchPercentage: number;
  missingSkills: string[];
  strongSkills: string[];
  tier: 'Easy Win' | 'Stretch' | 'Dream';
  scores: RelevanceScores;
  eligibility: EligibilityStatus;
  isBookmarked?: boolean;
  applicationStatus?: string;
}

export interface LearningRecommendation extends Course {
  whyRecommended: string;
  expectedImpact: string;
  scores: RelevanceScores;
  eligibility: EligibilityStatus;
  isBookmarked?: boolean;
  isCompleted?: boolean;
}

export interface CertificationRecommendation extends Certification {
  whyRecommended: string;
  roiScore: number;
  scores: RelevanceScores;
  eligibility: EligibilityStatus;
  isBookmarked?: boolean;
  isCompleted?: boolean;
}

export interface ProjectRecommendation extends ProjectTemplate {
  whyRecommended: string;
  skillsToGain: string[];
  impactScore: number;
  scores: RelevanceScores;
  eligibility: EligibilityStatus;
  isBookmarked?: boolean;
  isCompleted?: boolean;
}

// General feed result
export interface RecommendationFeed {
  jobs: JobRecommendation[];
  internships: InternshipRecommendation[];
  learning: LearningRecommendation[];
  certifications: CertificationRecommendation[];
  projects: ProjectRecommendation[];
  analytics: {
    applicationsSubmitted: number;
    coursesCompleted: number;
    projectsFinished: number;
    certificationProgress: number;
    recommendationAcceptanceRate: number;
    careerScoreImprovement: number;
  };
}
