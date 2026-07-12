/**
 * POST /api/profile-aggregator/sync
 * Master sync endpoint: fetches all connected platforms, normalizes, scores, and persists to Firestore.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { logger } from '@/services/logger';
import { globalRateLimiter } from '@/lib/rateLimit';
import { fetchAllProfiles, type FetchHandles } from '@/services/profileAggregator/providerFactory';
import { normalizeProfile } from '@/services/profileAggregator/profileNormalizer';
import { computeProfileScore } from '@/services/profileAggregator/profileScorer';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import type { UnifiedProfile, ScoreHistoryEntry } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);
  const start = Date.now();

  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;

    // Rate limit: 3 syncs/minute per user
    if (!globalRateLimiter.check(`profile-sync:${uid}`, 3, 60000)) {
      return NextResponse.json({ error: 'Too many sync requests. Please wait a minute.' }, { status: 429 });
    }

    const body = await req.json();
    const handles: FetchHandles = {
      github: body.handles?.github?.trim() || undefined,
      leetcode: body.handles?.leetcode?.trim() || undefined,
      codeforces: body.handles?.codeforces?.trim() || undefined,
      linkedin: body.handles?.linkedin?.trim() || undefined,
    };

    const linkedinData = body.linkedin || null;

    logger.info(`[Sync API] [${requestId}] Starting profile sync for user: ${uid}`, {
      platforms: Object.keys(handles).filter((k) => handles[k as keyof FetchHandles]),
    });

    // Fetch existing profile from Firestore for merge
    let existingProfile: Partial<UnifiedProfile> | undefined;
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists() && userDoc.data()?.unifiedProfile) {
        existingProfile = userDoc.data()!.unifiedProfile as Partial<UnifiedProfile>;
      }
    } catch (err) {
      logger.warn(`[Sync API] [${requestId}] Could not load existing profile: ${err}`);
    }

    // Fetch all platforms in parallel
    const fetchResult = await fetchAllProfiles(handles);

    // Override linkedin data with user-provided if present
    if (linkedinData && handles.linkedin) {
      fetchResult.linkedin = {
        id: 'linkedin',
        fetchedAt: new Date().toISOString(),
        data: linkedinData,
      };
    }

    // Normalize and score
    const profile = normalizeProfile(uid, fetchResult, existingProfile);
    const score = computeProfileScore(profile);

    // Persist to Firestore
    const userRef = doc(db, 'users', uid);
    const prevScore = existingProfile
      ? (existingProfile as any)?.score?.overall ?? null
      : null;

    await setDoc(
      userRef,
      {
        unifiedProfile: profile,
        profileScore: score,
        profileHandles: handles,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Write score history only if meaningful change (>=2 pts)
    if (prevScore === null || Math.abs(score.overall - prevScore) >= 2) {
      try {
        const historyEntry: ScoreHistoryEntry = {
          date: new Date().toISOString(),
          overall: score.overall,
          github: score.github,
          dsa: score.dsa,
          cp: score.cp,
        };
        await addDoc(collection(db, 'users', uid, 'scoreHistory'), historyEntry);
      } catch (err) {
        logger.warn(`[Sync API] [${requestId}] Score history write failed: ${err}`);
      }
    }

    const latency = Date.now() - start;
    logger.info(`[Sync API] [${requestId}] Sync completed in ${latency}ms for user: ${uid}`, {
      connected: profile.connections.filter((c) => c.status === 'connected').length,
      errors: fetchResult.errors.length,
      overallScore: score.overall,
    });

    return NextResponse.json({
      success: true,
      profile,
      score,
      errors: fetchResult.errors,
      latency,
    });
  } catch (err) {
    logger.error(`[Sync API] [${requestId}] Unhandled error:`, err);
    return NextResponse.json({ error: 'Profile sync failed. Please try again.' }, { status: 500 });
  }
}
