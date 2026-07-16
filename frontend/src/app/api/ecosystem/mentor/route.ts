import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { MOCK_MENTORS, MOCK_SESSIONS } from '@/services/ecosystem/mockEcosystemData';
import { aiService } from '@/services/ai/aiService';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

const DEFAULT_PLAN = [
  'Assess candidate current framework understanding.',
  'Analyze git repository structure and folders layouts.',
  'Formulate 2 target milestones with checkboxes.',
  'Conduct mock technical Q&A session.'
];

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const querySnap = await getDocs(collection(db, 'mentorship_sessions'));
    const dbSessions = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const allSessions = [...MOCK_SESSIONS, ...dbSessions];

    return NextResponse.json({
      success: true,
      mentors: MOCK_MENTORS,
      sessions: allSessions
    });
  } catch (error) {
    logger.error('[Ecosystem Mentor API] Error listing sessions/mentors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const body = await req.json();
    const { mentorId, mentorName, scheduledAt, topic } = body;

    if (!mentorId || !scheduledAt || !topic) {
      return NextResponse.json({ error: 'Missing mentorId, scheduledAt, or topic' }, { status: 400 });
    }

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    const studentName = userSnap.exists() ? userSnap.data().name || 'Student' : 'Student';

    // Generate AI Mentoring Plan checklist
    const prompt = `
You are the SkillSphere Mentor Plan Generator. Formulate 4 progressive mentoring checklist steps to guide the session.
Topic: "${topic}"

Output a JSON response that maps EXACTLY to the following format. Do not add markdown or conversational text:
{
  "plan": ["step 1", "step 2", "step 3", "step 4"]
}
`;

    let aiPlan = DEFAULT_PLAN;
    try {
      const res = await aiService.generateJSON(
        prompt,
        { plan: DEFAULT_PLAN },
        'You are a session advisor. Output strictly valid JSON matching the requested structure.'
      );
      aiPlan = res.data.plan;
    } catch (error) {
      console.error('[Ecosystem Mentor API] Error generating AI plan:', error);
    }

    const sessionId = `sess_${Math.random().toString(36).substring(7)}`;
    const newSession = {
      id: sessionId,
      mentorId,
      mentorName: mentorName || 'Assigned Mentor',
      menteeId: uid,
      menteeName: studentName,
      scheduledAt,
      topic,
      status: 'scheduled',
      aiMentoringPlan: aiPlan,
      createdAt: new Date().toISOString(),
      serverTime: serverTimestamp()
    };

    // Save session in DB
    await setDoc(doc(db, 'mentorship_sessions', sessionId), newSession);

    return NextResponse.json({ success: true, session: newSession });

  } catch (error) {
    logger.error('[Ecosystem Mentor API] Error scheduling session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
