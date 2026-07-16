import { aiService } from '../ai/aiService';
import { buildCopilotContext } from './contextBuilder';
import { getUserMemory, saveUserMemory, updateMemoryFromChat } from './memoryEngine';
import { getOrCreateSession, saveSessionMessages } from './conversationManager';
import type { CopilotMode, ChatMessage } from './types';
import { db } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';

const SYSTEM_INSTRUCTIONS: Record<CopilotMode, string> = {
  General: 'You are the SkillSphere Career Copilot, an elite career mentor. Provide proactive, profile-aware guidance using user context. Keep answers to 2-3 concise paragraphs, friendly and direct.',
  Mentor: 'You are the SkillSphere Career Mentor. You help the user define long-term career roadmaps, make target tech selections, and analyze market trends based on their profile.',
  Resume: 'You are the SkillSphere Resume Coach. Review the user\'s profile, projects, and missing skills to advise on resume improvement, structure, keywords, and portfolio layout additions.',
  Interview: 'You are the SkillSphere Interview Coach. Provide mock question drills, evaluate responses, explain coding problems, and offer communication feedback.',
  Learning: 'You are the SkillSphere Learning Mentor. Advise on ROI courses, certifications, SWAYAM/Coursera curricula, and construct daily learning schedules.',
  Project: 'You are the SkillSphere Project Mentor. Guide the user in building github projects, resolving skill gaps, compiling README documentations, and structuring folders.',
  Job: 'You are the SkillSphere Job Advisor. Match opportunities, clarify job eligibility, advise on remote contracts, and assist with application tracking details.'
};

/**
 * Main coordinator function that processes user messages, updates chat history,
 * loads user context, queries the LLM, and updates session logs.
 */
export async function runCopilotConversation(params: {
  uid: string;
  userMessage: string;
  sessionId: string;
  modeOverride?: CopilotMode;
}): Promise<{ response: string; updatedMode: CopilotMode }> {
  const { uid, userMessage, sessionId, modeOverride } = params;

  // 1. Determine active mode from message content if not overridden
  let activeMode: CopilotMode = modeOverride || 'General';
  if (!modeOverride) {
    const msgLower = userMessage.toLowerCase();
    if (msgLower.includes('resume') || msgLower.includes('cv') || msgLower.includes('experience section')) {
      activeMode = 'Resume';
    } else if (msgLower.includes('interview') || msgLower.includes('mock') || msgLower.includes('question')) {
      activeMode = 'Interview';
    } else if (msgLower.includes('course') || msgLower.includes('learning') || msgLower.includes('certification') || msgLower.includes('study')) {
      activeMode = 'Learning';
    } else if (msgLower.includes('project') || msgLower.includes('portfolio') || msgLower.includes('github') || msgLower.includes('readme')) {
      activeMode = 'Project';
    } else if (msgLower.includes('job') || msgLower.includes('internship') || msgLower.includes('apply')) {
      activeMode = 'Job';
    }
  }

  // 2. Fetch User Profile Context from Firestore
  let contextString = 'No profile synced yet.';
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      
      const [bookmarksSnap, applicationsSnap, progressSnap] = await Promise.all([
        getDocs(collection(db, 'users', uid, 'bookmarks')),
        getDocs(collection(db, 'users', uid, 'applications')),
        getDocs(collection(db, 'users', uid, 'progress'))
      ]);

      contextString = buildCopilotContext({
        name: userData.name || userData.fullName || 'User',
        stream: userData.stream || 'Technology',
        year: userData.year || '3rd Year',
        location: userData.location || 'India',
        unifiedProfile: userData.unifiedProfile || null,
        profileScore: userData.profileScore || null,
        aiAnalysis: userData.aiAnalysis || null,
        bookmarks: bookmarksSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        applications: applicationsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        progress: progressSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        primaryCareerGoal: userData.primaryCareerGoal || undefined,
        careerBlueprint: userData.careerBlueprint || undefined
      });
    }
  } catch (err) {
    console.error('[Copilot Engine] Error loading user context:', err);
  }

  // 3. Load Long-term Memory
  const memory = await getUserMemory(uid);
  const memoryContext = `
LONG-TERM USER MEMORY:
- Goals: ${memory.careerGoals.join(', ') || 'Not set'}
- Preferred Tech Stack: ${memory.preferredTech.join(', ') || 'Not set'}
- Completed projects: ${memory.completedProjects.join(', ') || 'None'}
- Chat summaries history: ${memory.conversationSummaries.join(' | ') || 'None'}
`;

  // 4. Load & update Conversation History
  const session = await getOrCreateSession(uid, sessionId, activeMode);
  const history = session.messages.slice(-5); // keep last 5 messages for prompt context size

  const userChatMsg: ChatMessage = {
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString()
  };

  const updatedMessages = [...session.messages, userChatMsg];

  // 5. Construct LLM Prompts
  const systemInstruction = `
${SYSTEM_INSTRUCTIONS[activeMode]}
Always address the user with helpful, profile-aware mentoring. Use the provided user context and long-term memory to keep details relevant to their active path.
Avoid general, generic guidelines. Speak directly to their goals, missing skills, and metrics.
`;

  const chatHistoryPrompt = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');
  const finalPrompt = `
${contextString}
${memoryContext}

CONVERSATION HISTORY:
${chatHistoryPrompt}

User: ${userMessage}
Assistant:
`;

  // 6. Call AI Service
  let aiResponse = 'Hello! I am here to help guide your career path. Please connect your profile aggregator first so I can analyze your coding profiles and give personalized guidance.';
  
  try {
    const fallbackText = 'I am currently processing. Let\'s continue our session. What specific targets are we tracking next?';
    const result = await aiService.generateText(
      finalPrompt,
      fallbackText,
      systemInstruction,
      { temperature: 0.7 }
    );
    aiResponse = result.data;
  } catch (error) {
    console.error('[Copilot Engine] LLM call failed:', error);
  }

  // 7. Save Assistant Message and update Firestore
  const assistantChatMsg: ChatMessage = {
    role: 'assistant',
    content: aiResponse,
    timestamp: new Date().toISOString()
  };

  const finalMessages = [...updatedMessages, assistantChatMsg];
  await saveSessionMessages(uid, sessionId, finalMessages, activeMode);

  // 8. Background update memory with user information extracted
  // Analyze message to see if user states new goals or preferred technologies
  const goalsToSave: string[] = [];
  const techToSave: string[] = [];
  
  const cleanMsg = userMessage.toLowerCase();
  if (cleanMsg.includes('i want to become a') || cleanMsg.includes('my goal is')) {
    goalsToSave.push(userMessage);
  }
  if (cleanMsg.includes('learn') || cleanMsg.includes('using') || cleanMsg.includes('stack')) {
    ['react', 'node', 'docker', 'python', 'pytorch', 'aws', 'gcp', 'sql', 'redis'].forEach((t) => {
      if (cleanMsg.includes(t)) {
        techToSave.push(t.toUpperCase());
      }
    });
  }

  if (goalsToSave.length > 0 || techToSave.length > 0) {
    const updatedGoals = Array.from(new Set([...memory.careerGoals, ...goalsToSave]));
    const updatedTech = Array.from(new Set([...memory.preferredTech, ...techToSave]));
    await saveUserMemory(uid, {
      careerGoals: updatedGoals,
      preferredTech: updatedTech
    });
  }

  // Record conversation summarization
  if (finalMessages.length % 4 === 0) {
    const summary = `Discussed ${activeMode} tips on ${new Date().toLocaleDateString()}. User queried: "${userMessage.substring(0, 40)}..."`;
    await updateMemoryFromChat(uid, summary);
  }

  return {
    response: aiResponse,
    updatedMode: activeMode
  };
}
