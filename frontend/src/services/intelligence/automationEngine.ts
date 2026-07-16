import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import type { WorkflowRule, EcosystemEvent } from './types';

export const DEFAULT_WORKFLOWS: WorkflowRule[] = [
  {
    id: 'wf_score_drop',
    name: 'If Career Score drops, compile recovery plan',
    triggerEvent: 'score_drop',
    actionType: 'generate_recovery',
    actionPayload: 'Triggered algorithmic diagnostics recovery checklist.',
    enabled: true
  },
  {
    id: 'wf_git_inactive',
    name: 'If GitHub inactive, suggest project milestone',
    triggerEvent: 'github_push',
    actionType: 'suggest_project',
    actionPayload: 'Recommend building E-Commerce Server docker package.',
    enabled: true
  },
  {
    id: 'wf_course_done',
    name: 'When course completes, recommend projects practice',
    triggerEvent: 'course_finished',
    actionType: 'recommend_learning',
    actionPayload: 'Suggest Cloud AWS deployment project guides.',
    enabled: true
  }
];

/**
 * Retrieves the user's workflow rules. If none exist, seeds default rules.
 */
export async function getUserWorkflows(uid: string): Promise<WorkflowRule[]> {
  try {
    const querySnap = await getDocs(collection(db, 'users', uid, 'workflows'));
    if (querySnap.empty) {
      // Seed default workflows
      for (const wf of DEFAULT_WORKFLOWS) {
        await setDoc(doc(db, 'users', uid, 'workflows', wf.id), wf);
      }
      return DEFAULT_WORKFLOWS;
    }
    return querySnap.docs.map(doc => doc.data() as WorkflowRule);
  } catch (error) {
    console.error('[Automation Engine] Error listing workflows:', error);
    return DEFAULT_WORKFLOWS;
  }
}

/**
 * Saves or updates a custom workflow rule for the user.
 */
export async function saveUserWorkflow(uid: string, rule: WorkflowRule): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid, 'workflows', rule.id), rule);
  } catch (error) {
    console.error('[Automation Engine] Error saving workflow:', error);
  }
}

/**
 * Runs matching workflows for an incoming ecosystem event.
 */
export async function runAutomationWorkflow(uid: string, event: EcosystemEvent): Promise<void> {
  try {
    const workflows = await getUserWorkflows(uid);
    const activeRules = workflows.filter(wf => wf.enabled && wf.triggerEvent === event.type);

    for (const rule of activeRules) {
      const notificationId = `notify_auto_${Math.random().toString(36).substring(7)}`;
      
      let message = `Automation rule "${rule.name}" triggered.`;
      let expectedImpact = 'Restore score consistency by 5 points.';
      let recommendedAction = 'Solve 1 Medium programming challenge today.';

      if (rule.actionType === 'generate_recovery') {
        message = 'Your readiness index decreased. We compiled a recovery checklist under Goals tab.';
        recommendedAction = 'Review cache logic architectures and complete LeetCode #146.';
        expectedImpact = 'Restore career readiness score by +8%.';

        // Add a mock recovery goal checklist in DB
        const taskId = `task_recovery_${Date.now()}`;
        await setDoc(doc(db, 'users', uid, 'copilot_tasks', taskId), {
          id: taskId,
          title: 'Career Score Recovery Plan',
          steps: [
            { text: 'Solve LRU Cache DSA challenge.', completed: false },
            { text: 'Read Redis keys setup guides.', completed: false },
            { text: 'Refactor local docker files settings.', completed: false }
          ],
          category: 'general',
          completed: false,
          createdAt: new Date().toISOString(),
          serverTime: serverTimestamp()
        });
      } else if (rule.actionType === 'suggest_project') {
        message = 'No GitHub commits detected in 10 days. We suggest starting a new portfolio project.';
        recommendedAction = 'Begin E-Commerce server docker deployment task.';
        expectedImpact = 'Raise GitHub portfolio score by 12 points.';
      } else if (rule.actionType === 'recommend_learning') {
        message = 'Course completed! Time to apply your knowledge in a project.';
        recommendedAction = 'Create a GitHub repository and deploy using AWS EC2.';
        expectedImpact = 'Verify systems engineering competence.';
      }

      // Save a smart, explainable notification to Firestore
      await setDoc(doc(db, 'users', uid, 'notifications', notificationId), {
        id: notificationId,
        message,
        whyItMatters: `Automation rule: ${rule.name}. Event: ${event.description}`,
        recommendedAction,
        expectedImpact,
        read: false,
        createdAt: new Date().toISOString(),
        serverTime: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('[Automation Engine] Error executing workflow rule:', error);
  }
}
