export interface ConnectedAccount {
  id: string; // e.g. github, leetcode, google_calendar
  name: string;
  category: 'coding' | 'learning' | 'productivity' | 'job' | 'cloud';
  connected: boolean;
  connectedAt?: string;
  healthStatus: 'healthy' | 'error' | 'disconnected';
  lastSyncedAt?: string;
}

export interface WorkspaceWorkflow {
  id: string;
  name: string;
  triggerEvent: string; // e.g. leetcode_milestone, git_repository_pushed, resume_updated, interview_tomorrow
  actionType: 'refresh_portfolio' | 'increase_dsa_score' | 'run_ats_analysis' | 'generate_interview_plan';
  enabled: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'interview' | 'hackathon' | 'exam' | 'deadline';
  dateTime: string;
  description: string;
  aiPrepChecklist?: string[];
}

export interface SyncLog {
  id: string;
  integrationId: string;
  status: 'success' | 'error';
  message: string;
  timestamp: string;
}
