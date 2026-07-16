export interface RankableContext {
  text: string;
  importance: number; // Scale of 1 to 10
  timestamp: string; // ISO string
  confidence: number; // 0.0 to 1.0
}

export const rankingEngine = {
  /**
   * Evaluates and scores context chunks using Importance, Freshness, and Confidence.
   * Higher relevance scores are sorted first.
   */
  rank(contexts: RankableContext[]): Array<{ text: string; score: number }> {
    const now = Date.now();
    const ranked = contexts.map((ctx) => {
      // Age calculation in days, minimum bound at 0.1 to avoid division by zero or negative age
      const ageInDays = Math.max(
        0.1,
        (now - new Date(ctx.timestamp).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Freshness decays logarithmically based on age
      const freshness = Math.max(0.1, 1 / Math.log1p(ageInDays));

      // Score formula: (0.50 * Importance) + (0.30 * Freshness) + (0.20 * Confidence)
      const importanceNormalized = ctx.importance / 10;
      const score =
        0.5 * importanceNormalized + 0.3 * freshness + 0.2 * ctx.confidence;

      return {
        text: ctx.text,
        score,
      };
    });

    // Sort descending by score
    return ranked.sort((a, b) => b.score - a.score);
  }
};

export default rankingEngine;
