import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

// GET active role and organization configuration
export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();
      return NextResponse.json({
        success: true,
        role: data.role || 'Student',
        organizationId: data.organizationId || 'org_iitb'
      });
    }

    return NextResponse.json({ success: true, role: 'Student', organizationId: 'org_iitb' });
  } catch (error) {
    logger.error('[Ecosystem Profile API] Error loading configuration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST update user role or organization association
export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const body = await req.json();
    const { role, organizationId } = body;

    if (!role) {
      return NextResponse.json({ error: 'Missing role parameter' }, { status: 400 });
    }

    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      role,
      organizationId: organizationId || 'org_iitb',
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return NextResponse.json({ success: true, role, organizationId: organizationId || 'org_iitb' });
  } catch (error) {
    logger.error('[Ecosystem Profile API] Error updating configuration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
