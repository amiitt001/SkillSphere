export type EcosystemEventType =
  | 'leetcode_solved'
  | 'github_push'
  | 'resume_modified'
  | 'interview_completed'
  | 'quiz_completed'
  | 'course_finished'
  | 'certification_earned'
  | 'job_applied'
  | 'score_drop';

export interface EcosystemEvent {
  id: string;
  type: EcosystemEventType;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface WorkflowRule {
  id: string;
  name: string;
  triggerEvent: EcosystemEventType;
  conditionFormula?: string; // e.g. "score < 70"
  actionType: 'generate_recovery' | 'suggest_project' | 'recommend_learning' | 'alert_user';
  actionPayload: string;
  enabled: boolean;
}

export interface CareerHealthScore {
  overall: number; // 0-100
  factors: {
    consistency: number;
    projects: number;
    learning: number;
    coding: number;
    resume: number;
  };
  trendHistory: { date: string; score: number }[];
  updatedAt: string;
}

export interface CareerOutcomePrediction {
  placementProbability: number; // 0-100
  interviewSuccessPct: number;
  atsSuccessPct: number;
  expectedSalaryBand: string;
  riskLevel: 'low' | 'medium' | 'high';
  stagnationRiskScore: number;
  readinessForecast30Days: number;
  readinessForecast60Days: number;
  readinessForecast90Days: number;
  aiExplanation: string;
}

export interface CareerReport {
  id: string;
  type: 'weekly' | 'monthly';
  progressSummary: string;
  skillGrowth: string[];
  goalsAchieved: string[];
  missedOpportunities: string[];
  nextActions: string[];
  createdAt: string;
}
