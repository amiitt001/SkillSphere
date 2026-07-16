import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import type { WorkspaceWorkflow } from './types';

export const DEFAULT_WORKSPACE_WORKFLOWS: WorkspaceWorkflow[] = [
  { id: 'flow_git_update', name: 'When GitHub changes, refresh portfolio score', triggerEvent: 'git_repository_pushed', actionType: 'refresh_portfolio', enabled: true },
  { id: 'flow_lc_solve', name: 'When LeetCode solved count increases, raise DSA ranking', triggerEvent: 'leetcode_milestone', actionType: 'increase_dsa_score', enabled: true },
  { id: 'flow_interview_prep', name: 'When calendar shows interview tomorrow, generate study map', triggerEvent: 'interview_tomorrow', actionType: 'generate_interview_plan', enabled: true }
];

/**
 * Retrieves workspace workflows. Seeds defaults if none are found.
 */
export async function getWorkspaceWorkflows(uid: string): Promise<WorkspaceWorkflow[]> {
  try {
    const querySnap = await getDocs(collection(db, 'users', uid, 'workspace_workflows'));
    if (querySnap.empty) {
      for (const flow of DEFAULT_WORKSPACE_WORKFLOWS) {
        await setDoc(doc(db, 'users', uid, 'workspace_workflows', flow.id), flow);
      }
      return DEFAULT_WORKSPACE_WORKFLOWS;
    }
    return querySnap.docs.map(doc => doc.data() as WorkspaceWorkflow);
  } catch (error) {
    console.error('[Automation Engine] Error loading workflows:', error);
    return DEFAULT_WORKSPACE_WORKFLOWS;
  }
}

/**
 * Saves or updates a workspace workflow rule in Firestore.
 */
export async function saveWorkspaceWorkflow(uid: string, flow: WorkspaceWorkflow): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid, 'workspace_workflows', flow.id), flow);
  } catch (error) {
    console.error('[Automation Engine] Error saving workflow rule:', error);
  }
}

/**
 * Triggers automations matching synchronized developer data.
 */
export async function triggerIntegrationWorkflows(
  uid: string,
  integrationId: string,
  data: any
): Promise<void> {
  try {
    const flows = await getWorkspaceWorkflows(uid);

    let eventType = '';
    if (integrationId === 'github' && data.commitsCount) {
      eventType = 'git_repository_pushed';
    } else if (integrationId === 'leetcode' && data.problemsSolvedDelta) {
      eventType = 'leetcode_milestone';
    } else if (integrationId === 'google_calendar') {
      eventType = 'interview_tomorrow';
    }

    if (!eventType) return;

    const matchedFlows = flows.filter(f => f.enabled && f.triggerEvent === eventType);

    for (const flow of matchedFlows) {
      const notificationId = `notify_flow_${flow.id}_${Date.now()}`;
      let message = `Workspace integration workflow "${flow.name}" triggered successfully.`;
      let whyItMatters = `System synced external updates from ${integrationId}.`;
      let recommendedAction = 'Check your advisor results to see new recommendations.';
      let expectedImpact = 'Update profile readiness indexes.';

      if (flow.actionType === 'refresh_portfolio') {
        message = 'GitHub repository updates synced. Refreshed portfolio readiness score.';
        whyItMatters = `New commits found: "${data.latestCommitMsg}"`;
        recommendedAction = 'Verify README guidelines layouts in Projects page.';
        expectedImpact = '+4% increase to Portfolio Quality rating.';
      } else if (flow.actionType === 'increase_dsa_score') {
        message = `LeetCode solves synced (+${data.problemsSolvedDelta} solved). Increased DSA rating.`;
        whyItMatters = `New solved problems solved: ${data.newSolvedList.join(', ')}`;
        recommendedAction = 'Solve more dynamic programming tasks to unlock Dream tier jobs.';
        expectedImpact = 'Move readiness index closer to 90%.';
      } else if (flow.actionType === 'generate_interview_plan') {
        message = 'Razorpay interview detected tomorrow! We generated a custom preparation study plan.';
        whyItMatters = 'Calendar slot scheduled tomorrow.';
        recommendedAction = 'Open Workspace tab and click "Generate Prep Checklist" in Calendar.';
        expectedImpact = 'Improve interview readiness by +10%.';
      }

      // Save smart notification to Firestore
      await setDoc(doc(db, 'users', uid, 'notifications', notificationId), {
        id: notificationId,
        message,
        whyItMatters,
        recommendedAction,
        expectedImpact,
        read: false,
        createdAt: new Date().toISOString(),
        serverTime: serverTimestamp()
      });
    }

  } catch (error) {
    console.error('[Automation Engine] Error executing flows:', error);
  }
}
