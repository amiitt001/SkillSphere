/**
 * POST /api/profile-aggregator/analyze
 * Generates AI career intelligence analysis from a stored UnifiedProfile.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { logger } from '@/services/logger';
import { globalRateLimiter } from '@/lib/rateLimit';
import { analyzeProfile } from '@/services/profileAggregator/profileAnalyzer';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { UnifiedProfile, ProfileScore } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;

    // Rate limit: 2 analyses/minute (AI is expensive)
    if (!globalRateLimiter.check(`profile-analyze:${uid}`, 2, 60000)) {
      return NextResponse.json({ error: 'Too many analysis requests. Please wait a minute.' }, { status: 429 });
    }

    logger.info(`[Analyze API] [${requestId}] Starting AI analysis for user: ${uid}`);

    // Load profile and score from Firestore
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'No profile found. Please sync your profiles first.' }, { status: 404 });
    }

    const data = userDoc.data();
    const profile = data?.unifiedProfile as UnifiedProfile | undefined;
    const score = data?.profileScore as ProfileScore | undefined;

    if (!profile || !score) {
      return NextResponse.json({ error: 'Profile not synced yet. Please connect your platforms first.' }, { status: 404 });
    }

    // Run AI analysis
    const analysis = await analyzeProfile(profile, score);

    // Persist analysis to Firestore
    await setDoc(
      doc(db, 'users', uid),
      { aiAnalysis: analysis, updatedAt: serverTimestamp() },
      { merge: true }
    );

    logger.info(`[Analyze API] [${requestId}] Analysis complete for user: ${uid}`);

    return NextResponse.json({ success: true, analysis });
  } catch (err) {
    logger.error(`[Analyze API] [${requestId}] Unhandled error:`, err);
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
  }
}
