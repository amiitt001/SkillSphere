import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { buildCopilotContext } from '@/services/copilot/contextBuilder';
import { generateWeeklyPlan } from '@/services/copilot/recommendationPlanner';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

function getStartOfWeekString() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toDateString();
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists() || !userSnap.data()?.unifiedProfile) {
      return NextResponse.json({ error: 'Profile not initialized' }, { status: 400 });
    }

    const userData = userSnap.data();
    const currentWeekStr = getStartOfWeekString();

    // Check caching
    if (userData.weeklyPlan && userData.weeklyPlan.week === currentWeekStr) {
      return NextResponse.json({ success: true, plan: userData.weeklyPlan.data });
    }

    // Load subcollections for context
    const [bookmarksSnap, applicationsSnap, progressSnap] = await Promise.all([
      getDocs(collection(db, 'users', uid, 'bookmarks')),
      getDocs(collection(db, 'users', uid, 'applications')),
      getDocs(collection(db, 'users', uid, 'progress'))
    ]);

    const context = buildCopilotContext({
      name: userData.name || userData.fullName || 'User',
      stream: userData.stream || 'Technology',
      year: userData.year || '3rd Year',
      location: userData.location || 'India',
      unifiedProfile: userData.unifiedProfile || null,
      profileScore: userData.profileScore || null,
      aiAnalysis: userData.aiAnalysis || null,
      bookmarks: bookmarksSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      applications: applicationsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      progress: progressSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    });

    const plan = await generateWeeklyPlan(context);

    // Save to Cache
    await setDoc(userRef, {
      weeklyPlan: {
        week: currentWeekStr,
        data: plan,
        updatedAt: new Date().toISOString()
      }
    }, { merge: true });

    return NextResponse.json({ success: true, plan });

  } catch (error) {
    logger.error('[Copilot Plan API] Error generating weekly plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
