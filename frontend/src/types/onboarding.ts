export interface SmartQuestion {
  fieldKey: string;
  question: string;
  type: 'text' | 'choice' | 'tags';
  options?: string[];
}

export interface OnboardingState {
  userId: string;
  currentStep: 'welcome' | 'resume_upload' | 'github_sync' | 'manual_review' | 'completed';
  skipped: boolean;
  lastQuestionAnsweredAt?: string;
}
