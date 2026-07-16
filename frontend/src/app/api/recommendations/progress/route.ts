import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    if (action === 'apply') {
      const { opportunityId, type, company, title, status } = body;
      if (!opportunityId || !status) {
        return NextResponse.json({ error: 'Missing opportunityId or status' }, { status: 400 });
      }

      await setDoc(doc(db, 'users', uid, 'applications', opportunityId), {
        type: type || 'job',
        company: company || 'Unknown Company',
        title: title || 'Position',
        status,
        updatedAt: new Date().toISOString(),
        serverTime: serverTimestamp()
      }, { merge: true });

      return NextResponse.json({ success: true });
    } 
    
    if (action === 'complete') {
      const { itemId, type, status } = body;
      if (!itemId || !status) {
        return NextResponse.json({ error: 'Missing itemId or status' }, { status: 400 });
      }

      await setDoc(doc(db, 'users', uid, 'progress', itemId), {
        type: type || 'course',
        status,
        updatedAt: new Date().toISOString(),
        serverTime: serverTimestamp()
      }, { merge: true });

      return NextResponse.json({ success: true });
    }

    if (action === 'ignore') {
      const { opportunityId } = body;
      if (!opportunityId) {
        return NextResponse.json({ error: 'Missing opportunityId' }, { status: 400 });
      }

      await setDoc(doc(db, 'users', uid, 'ignored', opportunityId), {
        ignoredAt: new Date().toISOString(),
        serverTime: serverTimestamp()
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'feedback') {
      const { opportunityId, feedback } = body;
      if (!opportunityId || !feedback) {
        return NextResponse.json({ error: 'Missing opportunityId or feedback' }, { status: 400 });
      }

      await setDoc(doc(db, 'users', uid, 'feedback', opportunityId), {
        feedback,
        submittedAt: new Date().toISOString(),
        serverTime: serverTimestamp()
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unsupported action value' }, { status: 400 });

  } catch (error) {
    logger.error('[Progress API] Error processing progress action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
