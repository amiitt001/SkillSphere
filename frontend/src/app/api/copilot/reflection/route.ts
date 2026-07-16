import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';
import { generateWeeklyReflection } from '@/services/copilot/reflectionEngine';
import { getUserTasks } from '@/services/copilot/actionGenerator';
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
    if (userData.weeklyReflection && userData.weeklyReflection.week === currentWeekStr) {
      return NextResponse.json({ success: true, reflection: userData.weeklyReflection.data });
    }

    // Retrieve active and completed tasks
    const tasks = await getUserTasks(uid);
    const completedTasks = tasks.filter(t => t.completed);
    const activeTasks = tasks.filter(t => !t.completed);

    // Retrieve bookmarks
    const bookmarksSnap = await getDocs(collection(db, 'users', uid, 'bookmarks'));
    const bookmarks = bookmarksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const reflection = await generateWeeklyReflection(completedTasks, activeTasks, bookmarks);

    // Save to Cache
    await setDoc(userRef, {
      weeklyReflection: {
        week: currentWeekStr,
        data: reflection,
        updatedAt: new Date().toISOString()
      }
    }, { merge: true });

    return NextResponse.json({ success: true, reflection });

  } catch (error) {
    logger.error('[Copilot Reflection API] Error calculating reflection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
