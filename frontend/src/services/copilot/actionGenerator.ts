import { aiService } from '../ai/aiService';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import '@/lib/firebaseAdmin';
import type { CopilotTask } from './types';

const DEFAULT_STEPS = [
  { text: 'Set up local project folder and repository initialization.', completed: false },
  { text: 'Read the official documentation for core fundamentals.', completed: false },
  { text: 'Complete a basic beginner walkthrough or tutorial.', completed: false },
  { text: 'Implement a minimal working prototype on your system.', completed: false },
  { text: 'Deploy the working application to a cloud hosting platform.', completed: false }
];

function getAdminDb() {
  return getFirestore();
}

/**
 * Uses AI to break down a high-level recommendation/goal into 5 actionable steps.
 */
export async function generateTasksFromGoal(
  uid: string,
  goal: string,
  category: 'learning' | 'project' | 'job' | 'resume' | 'general' = 'general'
): Promise<CopilotTask> {
  const taskId = `task_${Math.random().toString(36).substring(7)}`;
  const prompt = `
You are the SkillSphere Task planner. Convert this high-level recommendation/goal into 5 concrete, incremental steps.
Goal: "${goal}"
Category: "${category}"

Output a JSON response that maps EXACTLY to the following format. Do not add markdown or extra text:
{
  "title": "A concise title summarizing the goal",
  "steps": [
    { "text": "Step 1 action details", "completed": false },
    { "text": "Step 2 action details", "completed": false },
    { "text": "Step 3 action details", "completed": false },
    { "text": "Step 4 action details", "completed": false },
    { "text": "Step 5 action details", "completed": false }
  ]
}
`;

  let parsedResponse = {
    title: goal,
    steps: DEFAULT_STEPS
  };

  try {
    const res = await aiService.generateJSON(
      prompt,
      parsedResponse,
      'You are a workflow planner. Output strictly valid JSON matching the requested structure.'
    );
    parsedResponse = res.data;
  } catch (error) {
    console.error('[Action Planner] Error generating steps from goal:', error);
  }

  const newTask: CopilotTask = {
    id: taskId,
    title: parsedResponse.title,
    steps: parsedResponse.steps,
    category,
    completed: false,
    createdAt: new Date().toISOString()
  };

  // Save to Firestore
  try {
    const db = getAdminDb();
    await db.collection('users').doc(uid).collection('copilot_tasks').doc(taskId).set({
      ...newTask,
      serverTime: FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('[Action Planner] Error saving task to DB:', error);
  }

  return newTask;
}

/**
 * Retrieves all active copilot tasks for a user from Firestore.
 */
export async function getUserTasks(uid: string): Promise<CopilotTask[]> {
  try {
    const db = getAdminDb();
    const querySnap = await db.collection('users').doc(uid).collection('copilot_tasks').get();
    const tasks = querySnap.docs.map((doc) => ({
      ...doc.data()
    })) as CopilotTask[];
    return tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('[Action Planner] Error loading user tasks:', error);
    return [];
  }
}

/**
 * Toggles the completion status of a specific step inside a task.
 */
export async function toggleTaskStep(uid: string, taskId: string, stepIndex: number): Promise<CopilotTask | null> {
  try {
    const db = getAdminDb();
    const taskRef = db.collection('users').doc(uid).collection('copilot_tasks').doc(taskId);
    const snap = await taskRef.get();
    if (!snap.exists) return null;

    const data = snap.data() as CopilotTask;
    const steps = [...data.steps];
    if (steps[stepIndex]) {
      steps[stepIndex].completed = !steps[stepIndex].completed;
    }

    const completed = steps.every((s) => s.completed);
    const updatedTask = {
      ...data,
      steps,
      completed,
      updatedAt: new Date().toISOString()
    };

    await taskRef.set({
      ...updatedTask,
      serverTime: FieldValue.serverTimestamp()
    }, { merge: true });

    return updatedTask;
  } catch (error) {
    console.error('[Action Planner] Error toggling task step:', error);
    return null;
  }
}

/**
 * Deletes a copilot task.
 */
export async function deleteUserTask(uid: string, taskId: string): Promise<void> {
  try {
    const db = getAdminDb();
    await db.collection('users').doc(uid).collection('copilot_tasks').doc(taskId).delete();
  } catch (error) {
    console.error('[Action Planner] Error deleting task:', error);
  }
}
