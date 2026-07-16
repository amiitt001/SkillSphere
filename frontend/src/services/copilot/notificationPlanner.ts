import type { UnifiedProfile } from '@/types';
import type { CopilotTask } from './types';

export interface PlannedNotification {
  id: string;
  message: string;
  type: 'inactivity' | 'recommendation' | 'progress' | 'system';
  contextUrl?: string;
  createdAt: string;
}

/**
 * Generates personalized, contextual notification reminders for the user.
 */
export function planContextualNotifications(
  profile: UnifiedProfile,
  activeTasks: CopilotTask[],
  bookmarks: any[]
): PlannedNotification[] {
  const notifications: PlannedNotification[] = [];
  const nowStr = new Date().toISOString();

  // 1. Coding activity check
  if (profile.codingProblemsSolved === 0) {
    notifications.push({
      id: `notify_code_zero_${Date.now()}`,
      message: "You haven't connected your LeetCode profile or solved problems yet. Link your handle in the Aggregator page to update your readiness score.",
      type: 'inactivity',
      contextUrl: '/profile-aggregator',
      createdAt: nowStr
    });
  }

  // 2. Active tasks reminders
  if (activeTasks.length > 0) {
    const mainTask = activeTasks[0];
    const incompleteStepsCount = mainTask.steps.filter((s) => !s.completed).length;
    notifications.push({
      id: `notify_task_${mainTask.id}_${Date.now()}`,
      message: `You have ${incompleteStepsCount} pending steps on your "${mainTask.title}" goal. Completing this increases your readiness score.`,
      type: 'progress',
      contextUrl: '/copilot',
      createdAt: nowStr
    });
  }

  // 3. Bookmarks conversion reminder
  if (bookmarks.length > 0) {
    notifications.push({
      id: `notify_bookmark_${Date.now()}`,
      message: `You have saved opportunities awaiting action. Take the next step and apply/start them.`,
      type: 'recommendation',
      contextUrl: '/recommendations',
      createdAt: nowStr
    });
  }

  // Default fallback welcome reminder
  if (notifications.length === 0) {
    notifications.push({
      id: `notify_welcome_${Date.now()}`,
      message: `Welcome back! Check your Daily Briefing in the Copilot Dashboard to discover today's priority career action items.`,
      type: 'system',
      contextUrl: '/copilot',
      createdAt: nowStr
    });
  }

  return notifications;
}
