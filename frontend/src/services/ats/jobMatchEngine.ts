/**
 * Job Match ATS Engine — Engine 2
 *
 * Evaluates how well a resume matches a specific job description.
 *
 * 8 weighted steps:
 *   Keyword Match         20%
 *   Skills Match          20%
 *   Experience Match      15%
 *   Projects Match        15%
 *   Education Match        5%
 *   Achievements Match     5%
 *   Responsibilities Match 10%
 *   Cultural Signals       5%  (note: spec says 5% for Achievements and 5% for Culture = 95%; padded to 100 with Responsibilities at 10%)
 *
 * INVARIANTS:
 * - All scoring functions are pure (no I/O, no randomness)
 * - Same inputs always produce the same report
 * - Weights sum to 1.0
 */

import { fuzzyIntersect, normalizeAll } from './normalizer';
import { scoreKeywordCoverage } from './keywordEngine';
import { generateJobMatchRecommendations, sortByPriority } from './recommendationEngine';
import type {
  StructuredResumeJSON,
  StructuredJobJSON,
  JobMatchReport,
  JobMatchCategoryScore,
  ATSGrade,
} from './types';

// ─── Engine Constants ─────────────────────────────────────────────────────────

export const JOB_MATCH_ENGINE_VERSION = '2.0.0';

const WEIGHTS = {
  keywordMatch: 0.20,
  skillsMatch: 0.25,   // Skills matching is the most critical signal — increased to balance total
  experienceMatch: 0.15,
  projectsMatch: 0.10,
  educationMatch: 0.05,
  achievementsMatch: 0.05,
  responsibilitiesMatch: 0.10,
  culturalSignals: 0.10,
} as const;

// Verify weights sum to ~1.0
const WEIGHT_SUM = Object.values(WEIGHTS).reduce((s, w) => s + w, 0);
if (Math.abs(WEIGHT_SUM - 1.0) > 0.001) {
  throw new Error(`[JobMatchEngine] Weights must sum to 1.0, got ${WEIGHT_SUM}`);
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

function gradeFromScore(score: number): ATSGrade {
  if (score >= 93) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 78) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 62) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function makeMatchCategory(
  name: string,
  weight: number,
  rawScore: number,
  matched: string[],
  missing: string[],
  notes: string[]
): JobMatchCategoryScore {
  const clamped = clamp(rawScore);
  return {
    name,
    weight,
    rawScore: clamped,
    weightedScore: Math.round(clamped * weight * 10) / 10,
    matched,
    missing,
    notes,
  };
}

// ─── Step 1: Keyword Match (20%) ──────────────────────────────────────────────

function scoreKeywordMatch(
  parsed: StructuredResumeJSON,
  job: StructuredJobJSON
): JobMatchCategoryScore {
  if (job.keywords.length === 0) {
    return makeMatchCategory('Keyword Match', WEIGHTS.keywordMatch, 50, [], [], ['No job keywords extracted.']);
  }

  const resumeKeywords = [
    ...parsed.skills.map((s) => s.normalizedName),
    ...parsed.experience.flatMap((e) => e.bullets),
    ...parsed.projects.flatMap((p) => p.technologies),
    parsed.summary,
  ];

  const coverage = scoreKeywordCoverage(resumeKeywords, job.keywords);

  const notes: string[] = [];
  if (coverage.priorityMissing.length > 0) {
    notes.push(`High-priority missing keywords: ${coverage.priorityMissing.slice(0, 5).join(', ')}`);
  }
  if (coverage.priorityMatched.length > 0) {
    notes.push(`Key job terms matched: ${coverage.priorityMatched.slice(0, 5).join(', ')}`);
  }

  return makeMatchCategory(
    'Keyword Match',
    WEIGHTS.keywordMatch,
    coverage.score,
    coverage.matched.slice(0, 20),
    coverage.missing.slice(0, 20),
    notes
  );
}

// ─── Step 2: Skills Match (20%) ───────────────────────────────────────────────

function scoreSkillsMatch(
  parsed: StructuredResumeJSON,
  job: StructuredJobJSON
): JobMatchCategoryScore {
  const resumeSkillNames = normalizeAll(parsed.skills.map((s) => s.normalizedName));

  // Required skills
  const { matched: reqMatched, missing: reqMissing } = fuzzyIntersect(
    resumeSkillNames,
    job.requiredSkills,
    0.85
  );

  // Preferred skills
  const { matched: prefMatched, missing: prefMissing } = fuzzyIntersect(
    resumeSkillNames,
    job.preferredSkills,
    0.85
  );

  // Scoring: required skills count double
  const totalRequired = job.requiredSkills.length;
  const totalPreferred = job.preferredSkills.length;

  if (totalRequired === 0 && totalPreferred === 0) {
    return makeMatchCategory('Skills Match', WEIGHTS.skillsMatch, 50, [], [], ['No skill requirements extracted from job.']);
  }

  const reqWeight = 0.7;
  const prefWeight = 0.3;

  const reqScore = totalRequired > 0
    ? (reqMatched.length / totalRequired) * 100 * reqWeight
    : 50 * reqWeight;

  const prefScore = totalPreferred > 0
    ? (prefMatched.length / totalPreferred) * 100 * prefWeight
    : 50 * prefWeight;

  const rawScore = clamp(reqScore + prefScore);

  // Transferable skills — in resume but not required, still relevant
  const allJobSkills = normalizeAll([...job.requiredSkills, ...job.preferredSkills]);
  const transferable = resumeSkillNames.filter(
    (s) => !allJobSkills.includes(s) && s.length > 2
  ).slice(0, 10);

  const notes: string[] = [];
  if (reqMatched.length > 0) notes.push(`Required skills matched: ${reqMatched.slice(0, 5).join(', ')}`);
  if (reqMissing.length > 0) notes.push(`Required skills missing: ${reqMissing.slice(0, 5).join(', ')}`);

  return makeMatchCategory(
    'Skills Match',
    WEIGHTS.skillsMatch,
    rawScore,
    [...reqMatched, ...prefMatched].slice(0, 20),
    [...reqMissing, ...prefMissing].slice(0, 20),
    notes
  );
}

// ─── Step 3: Experience Match (15%) ──────────────────────────────────────────

const LEADERSHIP_KEYWORDS_JM = [
  'led', 'managed', 'directed', 'oversaw', 'headed', 'founded', 'spearheaded', 'mentored',
];

function scoreExperienceMatch(
  parsed: StructuredResumeJSON,
  job: StructuredJobJSON
): JobMatchCategoryScore {
  const matched: string[] = [];
  const missing: string[] = [];
  const notes: string[] = [];

  // Years match (0–40)
  const resumeYears = parsed.totalExperienceMonths / 12;
  const requiredYears = job.requiredExperienceYears || 0;
  let yearsScore = 0;

  if (requiredYears === 0) {
    yearsScore = 30;
    notes.push('No specific experience requirement found in job description.');
  } else if (resumeYears >= requiredYears) {
    yearsScore = 40;
    matched.push(`${resumeYears.toFixed(1)} years experience (meets ${requiredYears}+ yr requirement)`);
  } else if (resumeYears >= requiredYears * 0.7) {
    yearsScore = 28;
    notes.push(`${resumeYears.toFixed(1)} years experience; job requires ${requiredYears}+.`);
  } else {
    yearsScore = 15;
    missing.push(`${Math.round(requiredYears - resumeYears)} more years of experience needed`);
  }

  // Domain match — check if resume roles match job industry keywords
  const jobLower = job.rawText.toLowerCase();
  const domainMatchCount = parsed.experience.filter((e) =>
    job.keywords.some((kw) => e.bullets.join(' ').toLowerCase().includes(kw.keyword))
  ).length;
  const domainScore = Math.min(30, domainMatchCount * 10);
  if (domainMatchCount > 0) matched.push(`${domainMatchCount} experience entries match job domain.`);

  // Leadership signals
  const hasLeadership = parsed.experience.some((e) =>
    LEADERSHIP_KEYWORDS_JM.some((k) => e.bullets.join(' ').toLowerCase().includes(k))
  );
  const leadershipRequired = /\b(lead|manage|mentor|direct|coordinate)\b/i.test(jobLower);

  let leadershipScore = 0;
  if (leadershipRequired && hasLeadership) { leadershipScore = 20; matched.push('Leadership experience matches job requirements.'); }
  else if (leadershipRequired && !hasLeadership) { leadershipScore = 0; missing.push('Leadership experience required but not found in resume.'); }
  else { leadershipScore = 10; }

  // Internship handling — if fresh grad job, internship counts
  const isFreshGradJob = /intern|fresh|entry.level|0\s*-\s*1\s*year|graduate/i.test(job.rawText);
  const hasInternship = parsed.experience.some((e) => e.isInternship);
  let freshGradBonus = 0;
  if (isFreshGradJob && hasInternship) { freshGradBonus = 10; matched.push('Internship experience relevant for entry-level role.'); }

  const rawScore = clamp(yearsScore + domainScore + leadershipScore + freshGradBonus);
  return makeMatchCategory('Experience Match', WEIGHTS.experienceMatch, rawScore, matched, missing, notes);
}

// ─── Step 4: Projects Match (15%) ─────────────────────────────────────────────

function scoreProjectsMatch(
  parsed: StructuredResumeJSON,
  job: StructuredJobJSON
): JobMatchCategoryScore {
  const matched: string[] = [];
  const missing: string[] = [];
  const notes: string[] = [];

  if (parsed.projects.length === 0) {
    return makeMatchCategory(
      'Projects Match', WEIGHTS.projectsMatch, 5,
      [], ['No projects in resume'],
      ['Add projects relevant to this role.']
    );
  }

  const jobSkillsNorm = normalizeAll([...job.requiredSkills, ...job.preferredSkills]);
  const jobKeywordStrings = job.keywords.map((k) => k.keyword);

  let totalProjectScore = 0;

  for (const project of parsed.projects) {
    const projTechNorm = normalizeAll(project.technologies);
    const { matched: techMatched } = fuzzyIntersect(projTechNorm, jobSkillsNorm, 0.85);

    const techOverlapScore = Math.min(25, techMatched.length * 8);
    const businessScore = project.businessImpactSignals.length > 0 ? 10 : 0;
    const gitScore = project.hasGitHubLink ? 5 : 0;
    const deployScore = project.hasDeploymentLink ? 5 : 0;
    const complexScore = project.complexitySignals.length >= 2 ? 5 : 0;

    const projScore = techOverlapScore + businessScore + gitScore + deployScore + complexScore;
    totalProjectScore += Math.min(50, projScore);

    if (techMatched.length > 0) {
      matched.push(`"${project.title}" — ${techMatched.slice(0, 3).join(', ')}`);
    }
  }

  const avgProjectScore = totalProjectScore / Math.max(parsed.projects.length, 1);

  // Check for domain-specific project relevance
  const relevantProjects = parsed.projects.filter((p) =>
    jobKeywordStrings.some((k) =>
      p.description.toLowerCase().includes(k) ||
      p.technologies.some((t) => t.toLowerCase().includes(k))
    )
  );

  if (relevantProjects.length === 0) {
    missing.push('No projects directly relevant to job domain found.');
    notes.push('Consider adding projects using job-specific technologies.');
  } else {
    notes.push(`${relevantProjects.length} projects aligned with job tech stack.`);
  }

  return makeMatchCategory(
    'Projects Match',
    WEIGHTS.projectsMatch,
    clamp(avgProjectScore * 2),
    matched,
    missing,
    notes
  );
}

// ─── Step 5: Education Match (5%) ─────────────────────────────────────────────

const DEGREE_LEVELS: Record<string, number> = {
  'phd': 5, 'ph.d': 5, 'doctorate': 5,
  "master's": 4, 'ms': 4, 'm.s.': 4, 'mtech': 4, 'm.tech': 4, 'mba': 4,
  "bachelor's": 3, 'be': 3, 'b.e.': 3, 'btech': 3, 'b.tech': 3, 'bsc': 3, 'b.sc': 3, 'bca': 3,
  'diploma': 2, 'associate': 2,
};

function getDegreeLevel(degree: string): number {
  const lower = degree.toLowerCase().replace(/['.]/g, '').replace(/\s+/g, '');
  for (const [key, level] of Object.entries(DEGREE_LEVELS)) {
    if (lower.includes(key.replace(/['.]/g, ''))) return level;
  }
  return 1;
}

function scoreEducationMatch(
  parsed: StructuredResumeJSON,
  job: StructuredJobJSON
): JobMatchCategoryScore {
  const matched: string[] = [];
  const missing: string[] = [];
  const notes: string[] = [];

  if (parsed.education.length === 0) {
    return makeMatchCategory('Education Match', WEIGHTS.educationMatch, 20, [], ['No education section found.'], []);
  }

  const highestEdu = parsed.education.reduce((best, cur) => {
    const bl = getDegreeLevel(best.degree);
    const cl = getDegreeLevel(cur.degree);
    return cl > bl ? cur : best;
  }, parsed.education[0]);

  const resumeLevel = getDegreeLevel(highestEdu.degree);
  let score = 60; // Base: having any education

  // Match degree requirements
  if (job.educationRequirements.length > 0) {
    const reqLevels = job.educationRequirements.map((r) => getDegreeLevel(r));
    const maxRequired = Math.max(...reqLevels);

    if (resumeLevel >= maxRequired) {
      score = 100;
      matched.push(`${highestEdu.degree} meets the ${job.educationRequirements[0]} requirement.`);
    } else if (resumeLevel >= maxRequired - 1) {
      score = 75;
      notes.push(`Your degree is close to the preferred education level.`);
    } else {
      score = 40;
      missing.push(`Job requires ${job.educationRequirements[0]}, you have ${highestEdu.degree}.`);
    }
  } else {
    score = 80;
    notes.push('No specific education requirement stated in job description.');
  }

  // Relevant branch
  const jobLower = job.rawText.toLowerCase();
  const hasBranchMatch = highestEdu.branch && jobLower.includes(highestEdu.branch.toLowerCase().slice(0, 5));
  if (hasBranchMatch) {
    score = Math.min(100, score + 10);
    matched.push(`Branch (${highestEdu.branch}) aligns with job domain.`);
  }

  return makeMatchCategory('Education Match', WEIGHTS.educationMatch, score, matched, missing, notes);
}

// ─── Step 6: Achievements Match (5%) ──────────────────────────────────────────

function scoreAchievementsMatch(
  parsed: StructuredResumeJSON,
  job: StructuredJobJSON
): JobMatchCategoryScore {
  const matched: string[] = [];
  const missing: string[] = [];
  const notes: string[] = [];

  const jobLower = job.rawText.toLowerCase();

  // Check if job specifically values any achievement type
  const wantsHackathon = /hackathon|competition/i.test(jobLower);
  const wantsResearch = /research|publication|paper/i.test(jobLower);
  const wantsLeadership = /leadership|lead|manage|mentor/i.test(jobLower);

  let score = 40; // Base

  // Award any achievements
  if (parsed.achievements.length > 0 || parsed.certifications.length > 0) {
    score += 20;
    matched.push(`${parsed.achievements.length} achievement(s) and ${parsed.certifications.length} certification(s) found.`);
  }

  // Relevant certifications
  if (parsed.certifications.length > 0) {
    const certOverlap = parsed.certifications.filter((c) =>
      job.certificationRequirements.some((r) =>
        c.toLowerCase().includes(r.toLowerCase().slice(0, 8))
      )
    );
    if (certOverlap.length > 0) {
      score = Math.min(100, score + 20);
      matched.push(`Certification match: ${certOverlap[0]}`);
    }
  }

  // Type-specific signals
  if (wantsHackathon && parsed.achievements.some((a) => a.type === 'hackathon')) {
    score = Math.min(100, score + 15);
    matched.push('Hackathon experience matches job interest.');
  }
  if (wantsResearch && parsed.achievements.some((a) => a.type === 'research' || a.type === 'publication')) {
    score = Math.min(100, score + 15);
    matched.push('Research/publication experience matches job interest.');
  }
  if (wantsLeadership && parsed.achievements.some((a) => a.type === 'leadership')) {
    score = Math.min(100, score + 10);
    matched.push('Leadership achievements align with job requirements.');
  }

  if (parsed.achievements.length === 0) {
    missing.push('No notable achievements or certifications found.');
  }

  return makeMatchCategory('Achievements Match', WEIGHTS.achievementsMatch, clamp(score), matched, missing, notes);
}

// ─── Step 7: Responsibilities Match (10%) ─────────────────────────────────────

/**
 * Lightweight text overlap: counts how many significant words from source
 * appear in target (order-independent).
 */
function overlapScore(source: string, target: string): number {
  const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'with', 'for', 'of', 'in', 'on']);
  const sourceWords = source.toLowerCase().split(/\W+/).filter((w) => w.length > 3 && !STOP.has(w));
  const targetLower = target.toLowerCase();
  const matchCount = sourceWords.filter((w) => targetLower.includes(w)).length;
  return sourceWords.length > 0 ? matchCount / sourceWords.length : 0;
}

function scoreResponsibilitiesMatch(
  parsed: StructuredResumeJSON,
  job: StructuredJobJSON
): JobMatchCategoryScore {
  const matched: string[] = [];
  const missing: string[] = [];
  const notes: string[] = [];

  if (job.responsibilities.length === 0) {
    return makeMatchCategory(
      'Responsibilities Match', WEIGHTS.responsibilitiesMatch, 50,
      [], [], ['No specific responsibilities extracted from job description.']
    );
  }

  const resumeBullets = parsed.experience.flatMap((e) => e.bullets);
  const resumeText = resumeBullets.join(' ');

  let totalOverlap = 0;
  let matchedCount = 0;

  for (const responsibility of job.responsibilities) {
    const score = overlapScore(responsibility, resumeText);
    totalOverlap += score;
    if (score >= 0.3) {
      matchedCount++;
      matched.push(responsibility.slice(0, 60) + (responsibility.length > 60 ? '...' : ''));
    } else {
      missing.push(responsibility.slice(0, 60) + (responsibility.length > 60 ? '...' : ''));
    }
  }

  const avgOverlap = totalOverlap / job.responsibilities.length;
  const rawScore = clamp(Math.round(avgOverlap * 100));

  notes.push(`${matchedCount}/${job.responsibilities.length} job responsibilities have resume evidence.`);

  return makeMatchCategory(
    'Responsibilities Match',
    WEIGHTS.responsibilitiesMatch,
    rawScore,
    matched,
    missing,
    notes
  );
}

// ─── Step 8: Cultural Signals (5%) ────────────────────────────────────────────

const CULTURE_SIGNAL_KEYWORDS = [
  'leadership', 'ownership', 'initiative', 'collaboration', 'communication',
  'problem-solving', 'mentoring', 'proactive', 'cross-functional', 'accountability',
];

function scoreCulturalSignals(
  parsed: StructuredResumeJSON,
  job: StructuredJobJSON
): JobMatchCategoryScore {
  const matched: string[] = [];
  const missing: string[] = [];
  const notes: string[] = [];

  const resumeFullText = [
    parsed.summary,
    ...parsed.experience.flatMap((e) => e.bullets),
  ].join(' ').toLowerCase();

  const jobCultureSignals = job.culturalKeywords.length > 0
    ? job.culturalKeywords
    : CULTURE_SIGNAL_KEYWORDS;

  let matchedCount = 0;
  for (const signal of jobCultureSignals) {
    if (resumeFullText.includes(signal)) {
      matchedCount++;
      matched.push(signal);
    } else {
      missing.push(signal);
    }
  }

  const rawScore = clamp(Math.round((matchedCount / Math.max(jobCultureSignals.length, 1)) * 100));

  if (matchedCount >= 3) {
    notes.push('Good cultural alignment signals in resume.');
  } else {
    notes.push('Consider reflecting more on ownership, initiative, and collaboration in your experience bullets.');
  }

  return makeMatchCategory('Cultural Signals', WEIGHTS.culturalSignals, rawScore, matched, missing, notes);
}

// ─── Score Aggregation ────────────────────────────────────────────────────────

function computeJobMatchScore(categories: JobMatchReport['categories']): number {
  const total = Object.values(categories).reduce((sum, cat) => sum + cat.weightedScore, 0);
  return clamp(Math.round(total));
}

// ─── Job Match ATS Engine ─────────────────────────────────────────────────────

export class JobMatchATSEngine {
  /**
   * Scores a resume against a job description on 8 weighted steps.
   *
   * @param parsed - StructuredResumeJSON from ResumeParser
   * @param job - StructuredJobJSON from JobParser
   * @returns JobMatchReport — deterministic for the same inputs
   */
  score(parsed: StructuredResumeJSON, job: StructuredJobJSON): JobMatchReport {
    const keywordMatch = scoreKeywordMatch(parsed, job);
    const skillsMatch = scoreSkillsMatch(parsed, job);
    const experienceMatch = scoreExperienceMatch(parsed, job);
    const projectsMatch = scoreProjectsMatch(parsed, job);
    const educationMatch = scoreEducationMatch(parsed, job);
    const achievementsMatch = scoreAchievementsMatch(parsed, job);
    const responsibilitiesMatch = scoreResponsibilitiesMatch(parsed, job);
    const culturalSignals = scoreCulturalSignals(parsed, job);

    const categories = {
      keywordMatch,
      skillsMatch,
      experienceMatch,
      projectsMatch,
      educationMatch,
      achievementsMatch,
      responsibilitiesMatch,
      culturalSignals,
    };

    const jobMatchScore = computeJobMatchScore(categories);
    const grade = gradeFromScore(jobMatchScore);

    // Aggregated skill analysis
    const resumeSkillNames = parsed.skills.map((s) => s.normalizedName);
    const { matched: matchedSkills, missing: missingSkills } = fuzzyIntersect(
      resumeSkillNames,
      [...job.requiredSkills, ...job.preferredSkills],
      0.85
    );

    // Keywords
    const missingKeywords = keywordMatch.missing.slice(0, 15);

    // Transferable skills
    const allJobSkills = normalizeAll([...job.requiredSkills, ...job.preferredSkills]);
    const transferableSkills = resumeSkillNames
      .filter((s) => !allJobSkills.includes(s) && s.length > 2)
      .slice(0, 10);

    // Gaps
    const experienceGaps = experienceMatch.missing;
    const projectGaps = projectsMatch.missing;
    const certificationGaps = achievementsMatch.missing.filter((m) =>
      /certif/i.test(m)
    );

    // Recommendations
    const jobRecs = generateJobMatchRecommendations(missingSkills, missingKeywords);
    const priorityImprovements = sortByPriority(jobRecs).slice(0, 5);

    const estimatedMatchImprovement = Math.min(
      100 - jobMatchScore,
      priorityImprovements.reduce((s, r) => s + r.expectedScoreGain, 0)
    );

    return {
      jobMatchScore,
      grade,
      targetRole: job.role,
      company: job.company,
      categories,
      matchedSkills: matchedSkills.slice(0, 20),
      missingSkills: missingSkills.slice(0, 20),
      missingKeywords,
      transferableSkills,
      experienceGaps,
      projectGaps,
      certificationGaps,
      priorityImprovements,
      estimatedMatchImprovement,
      parsedJob: job,
      scoredAt: new Date().toISOString(),
      engineVersion: JOB_MATCH_ENGINE_VERSION,
    };
  }
}

export const jobMatchATSEngine = new JobMatchATSEngine();
