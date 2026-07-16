import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import '@/lib/firebaseAdmin';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

// GET bookmarks list
export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const db = getFirestore();
    const bookmarksSnap = await db.collection('users').doc(uid).collection('bookmarks').get();
    const bookmarks = bookmarksSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ success: true, bookmarks });
  } catch (error) {
    logger.error('[Bookmarks API] Error listing bookmarks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST toggle bookmark status
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const { opportunityId, type } = await req.json();

    if (!opportunityId || !type) {
      return NextResponse.json({ error: 'Missing opportunityId or type' }, { status: 400 });
    }

    const db = getFirestore();
    const bookmarkRef = db.collection('users').doc(uid).collection('bookmarks').doc(opportunityId);
    const bookmarkSnap = await bookmarkRef.get();

    if (bookmarkSnap.exists) {
      // Remove bookmark
      await bookmarkRef.delete();
      return NextResponse.json({ success: true, bookmarked: false });
    } else {
      // Save bookmark
      await bookmarkRef.set({
        type,
        bookmarkedAt: new Date().toISOString(),
        createdAt: FieldValue.serverTimestamp()
      });
      return NextResponse.json({ success: true, bookmarked: true });
    }
  } catch (error) {
    logger.error('[Bookmarks API] Error toggling bookmark:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
