/**
 * ATS AI Explainer
 *
 * The ONLY module in the ATS subsystem that may call an LLM.
 *
 * STRICT RULES:
 * 1. May ONLY produce text (explanations, rewrites, suggestions)
 * 2. May NEVER modify, calculate, or invent numeric scores
 * 3. Receives the already-computed report — treats all scores as immutable
 * 4. Falls back gracefully if AI is unavailable
 *
 * Input: UniversalATSReport + optional JobMatchReport + resume text + job text
 * Output: ATSAIExplanation
 */

import { modelRouter as aiService } from '@/services/ai/orchestrator/modelRouter';
import { logger } from '@/services/logger';
import type { UniversalATSReport, JobMatchReport, ATSAIExplanation } from './types';

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildExplainerPrompt(
  universalReport: UniversalATSReport,
  jobMatchReport: JobMatchReport | undefined,
  resumeText: string,
  jobDescription: string | undefined
): string {
  const categoryLines = Object.entries(universalReport.categories)
    .map(([, cat]) => `- ${cat.name}: ${cat.rawScore}/100 (issues: ${cat.issues.slice(0, 2).join('; ') || 'none'})`)
    .join('\n');

  const jobMatchSection = jobMatchReport
    ? `
JOB MATCH REPORT:
- Job Match Score: ${jobMatchReport.jobMatchScore}/100
- Target Role: ${jobMatchReport.targetRole}
- Missing Skills: ${jobMatchReport.missingSkills.slice(0, 8).join(', ')}
- Missing Keywords: ${jobMatchReport.missingKeywords.slice(0, 8).join(', ')}
`
    : '';

  const experienceBullets = universalReport.parsedResume.experience
    .flatMap((e) => e.bullets.slice(0, 3))
    .slice(0, 6);

  return `You are an expert ATS resume coach. You have received pre-computed ATS scores from a deterministic scoring engine.

IMPORTANT CONSTRAINTS:
- You must NEVER modify, recalculate, or challenge any numeric score
- You must NEVER invent resume content
- You may ONLY explain the scores and provide text improvements

UNIVERSAL ATS REPORT:
- Universal Score: ${universalReport.universalScore}/100 (Grade: ${universalReport.grade})
- Category Scores:
${categoryLines}
- Top Issues: ${universalReport.weaknesses.slice(0, 4).join('; ')}
- Strengths: ${universalReport.strengths.slice(0, 4).join('; ')}
${jobMatchSection}

RESUME SUMMARY (for context):
${resumeText.slice(0, 1500)}

${jobDescription ? `JOB DESCRIPTION (for context):\n${jobDescription.slice(0, 800)}` : ''}

EXPERIENCE BULLETS TO POTENTIALLY REWRITE:
${experienceBullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Please respond with ONLY a valid JSON object matching this exact structure (no markdown fences):
{
  "universalScoreExplanation": "2-3 sentences explaining the universal score in plain English, referencing the category scores. Do not state the score again.",
  "jobMatchExplanation": "${jobMatchReport ? '2-3 sentences about the job match score and key gaps.' : 'null'}",
  "rewrittenBullets": [
    {
      "original": "exact original bullet text",
      "rewritten": "improved version using action verb + metric + impact",
      "improvement": "what changed and why"
    }
  ],
  "improvedSummary": "An improved professional summary in 3-4 sentences, based ONLY on information in the resume. Do not add any skills or experience not present.",
  "keywordSuggestions": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "coverLetterSnippet": ${jobMatchReport ? '"A 2-3 sentence opening paragraph for a cover letter for this specific role."' : 'null'}
}`;
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

function buildFallbackExplanation(
  universalReport: UniversalATSReport,
  jobMatchReport: JobMatchReport | undefined
): ATSAIExplanation {
  const score = universalReport.universalScore;
  const grade = universalReport.grade;
  const topIssue = universalReport.weaknesses[0] || 'formatting';

  const explanation = score >= 80
    ? `Your resume scores ${score}/100 (${grade}), indicating strong overall quality. The main areas to optimize are: ${topIssue}. Focus on the high-priority recommendations to push toward an A+.`
    : score >= 60
      ? `Your resume scores ${score}/100 (${grade}), which is average for ATS systems. To move to the next tier, prioritize: ${topIssue}. Quantifying your achievements and modernizing your tech stack will have the largest impact.`
      : `Your resume scores ${score}/100 (${grade}), which is below the typical ATS threshold. Key issues include: ${topIssue}. Start with structural fixes — missing sections, formatting, and contact completeness — before optimizing content.`;

  return {
    universalScoreExplanation: explanation,
    jobMatchExplanation: jobMatchReport
      ? `Your job match score is ${jobMatchReport.jobMatchScore}/100. The biggest gaps are: ${jobMatchReport.missingSkills.slice(0, 3).join(', ')}. Focus on adding these skills to your resume to improve match rate.`
      : null,
    rewrittenBullets: universalReport.parsedResume.experience
      .flatMap((e) => e.bullets.filter((b) =>
        /^(responsible for|worked on|helped with|assisted in)/i.test(b)
      ))
      .slice(0, 3)
      .map((b) => ({
        original: b,
        rewritten: `Developed and maintained ${b.replace(/^responsible for /i, '')} resulting in measurable improvements.`,
        improvement: 'Added action verb and impact framing.',
      })),
    improvedSummary: `Detail-oriented ${universalReport.parsedResume.experience[0]?.role || 'professional'} with ${Math.round(universalReport.parsedResume.totalExperienceMonths / 12)} years of experience. Proficient in ${universalReport.parsedResume.skills.slice(0, 4).map((s) => s.name).join(', ')}. Seeking to leverage technical expertise to drive impact in a results-oriented environment.`,
    keywordSuggestions: universalReport.improvementPriority
      .flatMap((r) => r.resources)
      .map((r) => r.title.split(' ')[0])
      .slice(0, 5),
    coverLetterSnippet: null,
    generatedAt: new Date().toISOString(),
  };
}

// ─── AI Explainer ─────────────────────────────────────────────────────────────

export class ATSAIExplainer {
  async explain(
    universalReport: UniversalATSReport,
    jobMatchReport?: JobMatchReport,
    resumeText?: string,
    jobDescription?: string
  ): Promise<ATSAIExplanation> {
    const fallback = buildFallbackExplanation(universalReport, jobMatchReport);

    try {
      const prompt = buildExplainerPrompt(
        universalReport,
        jobMatchReport,
        resumeText || universalReport.parsedResume.rawText.slice(0, 1500),
        jobDescription
      );

      const systemInstruction = `You are a factual ATS resume coach. You NEVER make up data. You NEVER modify scores. You only explain pre-computed results and suggest textual improvements.`;

      const result = await aiService.generateJSON<ATSAIExplanation>(
        prompt,
        fallback,
        systemInstruction,
        { temperature: 0.3, maxTokens: 1500 }
      );

      if (!result.success || !result.data?.universalScoreExplanation) {
        logger.warn('[ATSAIExplainer] AI response missing required fields, using fallback.');
        return fallback;
      }

      // Validate: ensure the AI didn't sneak a numeric score into the explanation
      const explanation = result.data;
      const scorePattern = /\b(score|scored?)\s*(is|was|of)?\s*\d{2,3}/i;
      if (scorePattern.test(explanation.universalScoreExplanation)) {
        // Sanitize — strip phrases that reference specific score numbers
        explanation.universalScoreExplanation = explanation.universalScoreExplanation
          .replace(/\bscore[sd]?\s+(is\s+)?\d{2,3}\s*\/?\s*100\b/gi, '')
          .trim();
      }

      return {
        ...explanation,
        generatedAt: new Date().toISOString(),
      };

    } catch (err) {
      logger.error('[ATSAIExplainer] Failed to generate AI explanation:', err);
      return { ...fallback, generatedAt: new Date().toISOString() };
    }
  }
}

export const atsAIExplainer = new ATSAIExplainer();
