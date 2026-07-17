import { modelRouter as aiService } from '@/services/ai/orchestrator/modelRouter';
import { JobDescription } from '@/types/job';
import { logger } from '@/services/logger';

const DEFAULT_JOB_DESCRIPTION: JobDescription = {
  title: 'Software Engineer',
  company: 'Unknown Company',
  location: 'Remote / On-site',
  jobType: 'unknown',
  experienceLevel: 'unknown',
  yearsOfExperience: '0-2 years',
  responsibilities: ['Build and maintain software systems'],
  requirements: [],
  niceToHave: [],
  requiredSkills: [],
  niceSkills: [],
  domain: 'Software Engineering',
  rawText: '',
};

export async function normalizeJobDescription(
  rawText: string,
  sourceUrl?: string
): Promise<JobDescription> {
  const prompt = `
You are a job description parser. Extract structured information from the raw job posting text below.

Raw Job Posting:
"""
${rawText.slice(0, 6000)}
"""

Return a JSON object with EXACTLY this schema:
{
  "title": "exact job title",
  "company": "company name or 'Unknown'",
  "location": "location string",
  "jobType": "full-time" | "part-time" | "internship" | "contract" | "remote" | "hybrid" | "unknown",
  "experienceLevel": "entry" | "mid" | "senior" | "lead" | "unknown",
  "yearsOfExperience": "e.g. 2-4 years",
  "responsibilities": ["list of key responsibilities as strings"],
  "requirements": [
    { "skill": "Skill Name", "required": true, "yearsNeeded": 2 }
  ],
  "niceToHave": ["nice-to-have skill or qualification"],
  "requiredSkills": ["flat list of required technical skills"],
  "niceSkills": ["flat list of nice-to-have skills"],
  "salary": "salary range or null",
  "domain": "primary domain e.g. Web Development, Data Science, DevOps"
}

Rules:
- requiredSkills must be a flat string array of technology/skill names only
- Do NOT include soft skills in requiredSkills
- Extract at least 3 responsibilities if possible
- Keep skill names concise (e.g. "React" not "React.js framework")
`;

  try {
    const res = await aiService.generateJSON<JobDescription>(
      prompt,
      DEFAULT_JOB_DESCRIPTION,
      'You are a precise job description extractor. Return only valid JSON matching the schema.'
    );

    const normalized: JobDescription = {
      ...DEFAULT_JOB_DESCRIPTION,
      ...res.data,
      rawText,
      sourceUrl,
    };

    logger.info(`[JobNormalizer] Normalized job: "${normalized.title}" at "${normalized.company}"`);
    return normalized;
  } catch (err) {
    logger.error('[JobNormalizer] Normalization failed, using defaults:', err);
    return { ...DEFAULT_JOB_DESCRIPTION, rawText, sourceUrl };
  }
}
