import type { RelevanceScores } from './types';

/**
 * Calculates a standard set of scores for a given recommendation.
 */
export function calculateRelevanceScores(params: {
  relevance: number;        // base relevance (e.g. match percentage)
  impact: number;           // career impact (e.g. demand score or skills closed)
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Entry' | 'Mid' | 'Senior';
  timeToComplete: string;
  weights: { relevance: number; impact: number; difficulty: number };
}): RelevanceScores {
  const { relevance, impact, difficultyLevel, timeToComplete, weights } = params;

  // Convert difficulty to numerical score (0 to 100)
  let difficulty = 50;
  if (difficultyLevel === 'Beginner' || difficultyLevel === 'Entry') difficulty = 30;
  else if (difficultyLevel === 'Intermediate' || difficultyLevel === 'Mid') difficulty = 60;
  else if (difficultyLevel === 'Advanced' || difficultyLevel === 'Senior') difficulty = 90;

  // Confidence is high if relevance is high, reduced if user profile is sparse
  const confidence = Math.min(100, Math.round(relevance * 0.9 + impact * 0.1));

  // Compute Overall Score based on weights (e.g. weights sum up to 1)
  // We prefer items that have high relevance, high impact, and a reasonable difficulty
  const overall = Math.max(0, Math.min(100, Math.round(
    relevance * weights.relevance +
    impact * weights.impact +
    (100 - difficulty) * weights.difficulty
  )));

  return {
    relevance: Math.round(relevance),
    impact: Math.round(impact),
    difficulty: Math.round(difficulty),
    timeToComplete,
    confidence,
    overall
  };
}
