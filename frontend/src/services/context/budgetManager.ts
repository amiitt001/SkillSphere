import { TokenBudget } from '@/types/context';

export const budgetManager = {
  /**
   * Estimates token usage using character length heuristic (approx 4 chars = 1 token).
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  },

  /**
   * Fits ranked contexts into the allowed maximum token budget, filtering out excess text.
   */
  optimizeContext(
    rankedContexts: Array<{ text: string; score: number }>,
    budget: TokenBudget
  ): string[] {
    let currentTokens = 0;
    const includedText: string[] = [];

    for (const item of rankedContexts) {
      const estimated = this.estimateTokens(item.text);
      if (currentTokens + estimated > budget.maxContextTokens) {
        continue; // Skip items that would push us over context limit
      }
      includedText.push(item.text);
      currentTokens += estimated;
    }
    return includedText;
  }
};

export default budgetManager;
