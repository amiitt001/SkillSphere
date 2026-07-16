export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type CopilotMode = 
  | 'Mentor' 
  | 'Resume' 
  | 'Interview' 
  | 'Learning' 
  | 'Project' 
  | 'Job' 
  | 'General';

export interface ChatSession {
  sessionId: string;
  mode: CopilotMode;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface DailyBrief {
  priority: string;
  recommendedSkill: string;
  recommendedProject: string;
  codingChallenge: string;
  learningResource: string;
  interviewQuestion: string;
  careerInsight: string;
  motivationalSummary: string;
}

export interface WeeklyPlan {
  priorities: string[];
  learningSchedule: string[];
  codingGoals: string[];
  projectGoals: string[];
  interviewPrep: string[];
  certificationMilestones: string[];
  applicationTargets: string[];
}

export interface CopilotMemory {
  careerGoals: string[];
  preferredTech: string[];
  completedProjects: string[];
  learningPreferences: string[];
  conversationSummaries: string[];
}

export interface WeeklyReflection {
  improved: string[];
  stagnated: string[];
  missedOpportunities: string[];
  achievements: string[];
  nextWeekPriorities: string[];
}

export interface TaskStep {
  text: string;
  completed: boolean;
}

export interface CopilotTask {
  id: string;
  title: string;
  steps: TaskStep[];
  category: 'learning' | 'project' | 'job' | 'resume' | 'general';
  completed: boolean;
  createdAt: string;
}
