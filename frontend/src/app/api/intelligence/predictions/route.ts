import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getCareerPredictions } from '@/services/intelligence/predictionEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const uid = authResult.user!.uid;
    const predictions = await getCareerPredictions(uid);
    return NextResponse.json({ success: true, predictions });
  } catch (error) {
    logger.error('[Intelligence Predictions API] Error predicting outcomes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
