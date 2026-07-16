import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const querySnap = await getDocs(collection(db, 'audit_logs'));
    const logs: any[] = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort descending by timestamp
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ success: true, logs: logs.slice(0, 15) }); // return last 15 actions
  } catch (error) {
    logger.error('[Ecosystem Audit API] Error listing audit logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const email = authResult.user!.email || 'system-actor';
    const uid = authResult.user!.uid;
    const body = await req.json();
    const { action, targetId } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
    }

    const logId = `log_${Math.random().toString(36).substring(7)}`;
    const newLog = {
      id: logId,
      actorId: uid,
      actorEmail: email,
      action,
      targetId: targetId || 'none',
      timestamp: new Date().toISOString(),
      serverTime: serverTimestamp()
    };

    await setDoc(doc(db, 'audit_logs', logId), newLog);

    return NextResponse.json({ success: true, log: newLog });

  } catch (error) {
    logger.error('[Ecosystem Audit API] Error saving audit log:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
