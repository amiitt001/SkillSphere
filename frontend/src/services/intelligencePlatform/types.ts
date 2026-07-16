export interface AiFeedback {
  id: string;
  itemId: string; // e.g. job_1, course_1, copilot_response
  itemType: 'job' | 'course' | 'project' | 'copilot' | 'advisor';
  rating: 'helpful' | 'not-helpful';
  reason?: 'needs-detail' | 'incorrect' | 'already-knew' | 'good' | 'other';
  comments?: string;
  timestamp: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  rolloutPercentage: number; // 0 to 100
  targetRoles?: string[];
}

export interface AbExperiment {
  id: string;
  name: string;
  treatment: 'A' | 'B';
  metricGoal: string;
  conversionsCount: number;
  participantsCount: number;
  active: boolean;
}

export interface ApiQualityLog {
  id: string;
  provider: 'gemini' | 'deepseek' | 'mock';
  endpoint: string;
  latencyMs: number;
  tokensUsed: number;
  estimatedCostUsd: number;
  success: boolean;
  timestamp: string;
}

export interface UserTelemetryEvent {
  id: string;
  action: string; // e.g. "job_applied", "quiz_finished", "score_improved"
  metadata?: Record<string, any>;
  timestamp: string;
}
