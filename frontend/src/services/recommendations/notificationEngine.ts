import { logger } from '@/services/logger';

export interface RecommendationAlert {
  id: string;
  title: string;
  message: string;
  type: 'job' | 'internship' | 'course' | 'cert' | 'project';
  relevanceScore: number;
  createdAt: string;
}

/**
 * Scans generated recommendations and raises alerts for high-matching items.
 */
export function generateRecommendationAlerts(
  userId: string,
  data: {
    jobs: any[];
    internships: any[];
    courses: any[];
    certs: any[];
    projects: any[];
  }
): RecommendationAlert[] {
  const alerts: RecommendationAlert[] = [];

  // Look for jobs with score >= 80
  data.jobs.forEach((j) => {
    if (j.scores.overall >= 80) {
      alerts.push({
        id: `alert_job_${j.id}_${Date.now()}`,
        title: 'New High-Match Job Available!',
        message: `A position for ${j.title} at ${j.company} fits your profile with an overall score of ${j.scores.overall}%.`,
        type: 'job',
        relevanceScore: j.scores.overall,
        createdAt: new Date().toISOString()
      });
    }
  });

  // Look for internships with score >= 80
  data.internships.forEach((i) => {
    if (i.scores.overall >= 80) {
      alerts.push({
        id: `alert_intern_${i.id}_${Date.now()}`,
        title: 'Top Internship Recommended!',
        message: `The ${i.title} internship at ${i.company} fits your skills and academic targets.`,
        type: 'internship',
        relevanceScore: i.scores.overall,
        createdAt: new Date().toISOString()
      });
    }
  });

  // Log alerts
  if (alerts.length > 0) {
    logger.info(`[Notification Engine] Triggered ${alerts.length} high-match recommendation alerts for user: ${userId}`);
  }

  return alerts;
}
