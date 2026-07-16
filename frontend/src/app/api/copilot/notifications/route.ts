import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { db } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { planContextualNotifications } from '@/services/copilot/notificationPlanner';
import { getUserTasks } from '@/services/copilot/actionGenerator';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;

    const userDocSnap = await getDoc(doc(db, 'users', uid));
    if (!userDocSnap.exists() || !userDocSnap.data()?.unifiedProfile) {
      return NextResponse.json({ error: 'Profile not initialized' }, { status: 400 });
    }

    const userData = userDocSnap.data();
    const profile = userData.unifiedProfile;

    // Load active tasks & bookmarks
    const tasks = await getUserTasks(uid);
    const activeTasks = tasks.filter(t => !t.completed);

    const bookmarksSnap = await getDocs(collection(db, 'users', uid, 'bookmarks'));
    const bookmarks = bookmarksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const notifications = planContextualNotifications(profile, activeTasks, bookmarks);

    return NextResponse.json({ success: true, notifications });

  } catch (error) {
    logger.error('[Copilot Notifications API] Error planning notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
