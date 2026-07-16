import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { getSystemPerformanceAggregate } from '@/services/intelligencePlatform/metricsEngine';
import { getRecommendationEffectiveness } from '@/services/intelligencePlatform/recommendationOptimizer';
import { getAiFeedbackList } from '@/services/intelligencePlatform/feedbackEngine';
import { getTelemetryEvents } from '@/services/intelligencePlatform/analyticsEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const [performance, effectiveness, feedback, telemetry] = await Promise.all([
      getSystemPerformanceAggregate(),
      getRecommendationEffectiveness(),
      getAiFeedbackList(),
      getTelemetryEvents()
    ]);

    return NextResponse.json({
      success: true,
      performance,
      effectiveness,
      feedback,
      telemetry
    });
  } catch (error) {
    logger.error('[Intelligence Platform Analytics API] Error collecting aggregates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
