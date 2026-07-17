import { createJobProvider } from './parser/jobProviders';
import { normalizeJobDescription } from './parser/jobNormalizer';
import { jobAi } from '@/services/ai/modules/jobAi';
import { logger } from '@/services/logger';
import type { JobInput, JobDescription, JobMatchReport, JobArtifacts } from '@/types/job';
import type { UnifiedUserProfile } from '@/types/profile';

export interface JobIntelligenceResult {
  jobDescription: JobDescription;
  matchReport: JobMatchReport;
  artifacts: JobArtifacts;
  processingTime: number;
}

export const jobIntelligenceEngine = {
  async analyze(
    input: JobInput,
    profile: UnifiedUserProfile
  ): Promise<JobIntelligenceResult> {
    const start = Date.now();
    logger.info(`[JobIntelligenceEngine] Starting refactored analysis — source: ${input.source}`);

    // Step 1: Extract raw text via the appropriate provider
    const provider = createJobProvider(input.source);
    const rawText = await provider.extract(input.content);

    logger.info(`[JobIntelligenceEngine] Extracted ${rawText.length} chars from provider`);

    // Step 2: Normalise into a structured JobDescription
    const sourceUrl = input.source === 'url' ? input.content : undefined;
    const jobDescription = await normalizeJobDescription(rawText, sourceUrl);

    logger.info(`[JobIntelligenceEngine] Normalized: "${jobDescription.title}" at "${jobDescription.company}"`);

    // Step 3: Score against user profile (AI call)
    const matchRes = await jobAi.analyzeJob(jobDescription, profile);
    const matchReport = matchRes.data;

    logger.info(`[JobIntelligenceEngine] Match score: ${matchReport.scores.overall} — ${matchReport.recommendation}`);

    // Step 4: Generate artifacts
    const artifactsRes = await jobAi.generateArtifacts(jobDescription, profile, matchReport);
    const artifacts = artifactsRes.data;

    const processingTime = Date.now() - start;
    logger.info(`[JobIntelligenceEngine] Complete in ${processingTime}ms`);

    return { jobDescription, matchReport, artifacts, processingTime };
  },
};
