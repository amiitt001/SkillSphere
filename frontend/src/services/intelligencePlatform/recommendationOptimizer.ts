export interface RecommendationEffectiveness {
  id: string;
  title: string;
  category: 'job' | 'course' | 'project';
  impressionsCount: number;
  clicksCount: number;
  acceptanceRate: number; // calculated percentage
}

const SAMPLE_EFFECTIVENESS: RecommendationEffectiveness[] = [
  { id: 'rec_opt_1', title: 'Software Engineer Intern - Google India', category: 'job', impressionsCount: 120, clicksCount: 96, acceptanceRate: 80 },
  { id: 'rec_opt_2', title: 'Next.js Advanced rendering & compose layouts - Udemy', category: 'course', impressionsCount: 80, clicksCount: 48, acceptanceRate: 60 },
  { id: 'rec_opt_3', title: 'AWS Cloud Developer Practice - AWS Builder', category: 'course', impressionsCount: 110, clicksCount: 55, acceptanceRate: 50 },
  { id: 'rec_opt_4', title: 'Real-time Redis caching microservice - Github projects guide', category: 'project', impressionsCount: 90, clicksCount: 36, acceptanceRate: 40 }
];

/**
 * Calculates and returns recommendation effectiveness statistics.
 */
export async function getRecommendationEffectiveness(): Promise<RecommendationEffectiveness[]> {
  // Simulates fetching calculated CTR details
  return SAMPLE_EFFECTIVENESS;
}
