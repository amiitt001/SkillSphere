/**
 * ATS Intelligence Platform — Public Facade
 *
 * Usage:
 *   import { runUniversalATS, runJobMatchATS, runATSExplain } from '@/services/ats';
 *
 * These functions orchestrate the pipeline from raw text to scored report.
 */

export { resumeParser } from './resumeParser';
export { jobParser } from './jobParser';
export { universalATSEngine } from './universalEngine';
export { jobMatchATSEngine } from './jobMatchEngine';
export { atsAIExplainer } from './aiExplainer';

export type {
  StructuredResumeJSON,
  StructuredJobJSON,
  UniversalATSReport,
  JobMatchReport,
  CombinedATSReport,
  ATSAIExplanation,
  ATSRecommendation,
  UniversalATSRequest,
  JobMatchATSRequest,
  ATSExplainRequest,
} from './types';

import { resumeParser } from './resumeParser';
import { jobParser } from './jobParser';
import { universalATSEngine } from './universalEngine';
import { jobMatchATSEngine } from './jobMatchEngine';
import { atsAIExplainer } from './aiExplainer';
import type {
  UniversalATSReport,
  JobMatchReport,
  CombinedATSReport,
  UniversalATSRequest,
  JobMatchATSRequest,
  ATSExplainRequest,
} from './types';

/**
 * Pipeline: resumeText → parsed → Universal ATS Report
 * Target: < 500ms
 */
export function runUniversalATS(request: UniversalATSRequest): UniversalATSReport {
  const parsed = resumeParser.parse(request.resumeText);
  return universalATSEngine.score(parsed);
}

/**
 * Pipeline: resumeText + jobDescription → Universal + Job Match Reports
 * Target: < 800ms
 */
export function runJobMatchATS(request: JobMatchATSRequest): {
  universalReport: UniversalATSReport;
  jobMatchReport: JobMatchReport;
} {
  const parsed = resumeParser.parse(request.resumeText);
  const job = jobParser.parse(request.jobDescription, request.targetRole, request.industry);

  const universalReport = universalATSEngine.score(parsed);
  const jobMatchReport = jobMatchATSEngine.score(parsed, job);

  return { universalReport, jobMatchReport };
}

/**
 * AI Layer: receives pre-computed reports → produces text explanation
 * Target: < 3s
 * This is the ONLY async function. All scoring above is synchronous.
 */
export async function runATSExplain(request: ATSExplainRequest): Promise<CombinedATSReport> {
  const aiExplanation = await atsAIExplainer.explain(
    request.universalReport,
    request.jobMatchReport,
    request.resumeText,
    request.jobDescription
  );

  return {
    universalReport: request.universalReport,
    jobMatchReport: request.jobMatchReport || null,
    aiExplanation,
    generatedAt: new Date().toISOString(),
  };
}
