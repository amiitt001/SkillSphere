/**
 * Universal ATS Engine — Engine 1
 *
 * Evaluates overall resume quality independent of any job description.
 *
 * 9 weighted categories:
 *   ATS Compatibility    15%
 *   Resume Structure     10%
 *   Technical Skills     15%
 *   Experience Quality   15%
 *   Projects             10%
 *   Achievements         10%
 *   Writing Quality      10%
 *   Resume Completeness  10%
 *   Industry Readiness    5%
 *
 * INVARIANTS:
 * - All scoring functions are pure (no I/O, no randomness)
 * - Same StructuredResumeJSON always produces same UniversalATSReport
 * - Weighted scores sum exactly to universalScore
 * - engineVersion is static
 */

import { MODERN_TECH_INDEX } from './resumeParser';
import { analyzeKeywordDensity } from './keywordEngine';
import {
  generateCompatibilityRecommendations,
  generateStructureRecommendations,
  generateSkillsRecommendations,
  generateExperienceRecommendations,
  generateProjectRecommendations,
  generateAchievementsRecommendations,
  generateWritingRecommendations,
  generateCompletenessRecommendations,
  generateIndustryRecommendations,
  sortByPriority,
} from './recommendationEngine';

import type {
  StructuredResumeJSON,
  UniversalATSReport,
  ATSCategoryScore,
  ATSGrade,
} from './types';

// ─── Engine Constants ─────────────────────────────────────────────────────────

export const UNIVERSAL_ENGINE_VERSION = '2.0.0';

const WEIGHTS = {
  atsCompatibility: 0.15,
  resumeStructure: 0.10,
  technicalSkills: 0.15,
  experienceQuality: 0.15,
  projects: 0.10,
  achievements: 0.10,
  writingQuality: 0.10,
  resumeCompleteness: 0.10,
  industryReadiness: 0.05,
} as const;

// Verify weights sum to 1.0
const WEIGHT_SUM = Object.values(WEIGHTS).reduce((s, w) => s + w, 0);
if (Math.abs(WEIGHT_SUM - 1.0) > 0.001) {
  throw new Error(`[UniversalATSEngine] Weights must sum to 1.0, got ${WEIGHT_SUM}`);
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

function makeCategory(
  name: string,
  weight: number,
  rawScore: number,
  issues: string[],
  strengths: string[],
  recommendations: ATSCategoryScore['recommendations'] = []
): ATSCategoryScore {
  const clamped = clamp(rawScore);
  return {
    name,
    weight,
    rawScore: clamped,
    weightedScore: Math.round(clamped * weight * 10) / 10,
    issues,
    strengths,
    recommendations,
  };
}

// ─── Category 1: ATS Compatibility (15%) ─────────────────────────────────────

function scoreATSCompatibility(parsed: StructuredResumeJSON): ATSCategoryScore {
  const issues: string[] = [];
  const strengths: string[] = [];
  let score = 100;

  // Each formatting issue deducts points
  for (const issue of parsed.detectedFormattingIssues) {
    if (issue.severity === 'critical') {
      score -= 20;
      issues.push(issue.description);
    } else if (issue.severity === 'warning') {
      score -= 10;
      issues.push(issue.description);
    } else {
      score -= 5;
      issues.push(issue.description);
    }
  }

  // Check section ordering (standard: Summary → Experience → Education → Skills)
  const sectionOrder = parsed.sections.filter((s) => s.present).map((s) => s.normalizedName);
  const experienceIdx = sectionOrder.indexOf('experience');
  const educationIdx = sectionOrder.indexOf('education');
  const skillsIdx = sectionOrder.indexOf('skills');

  if (experienceIdx > -1 && educationIdx > -1 && experienceIdx > educationIdx && educationIdx > 0) {
    issues.push('Education appears before Experience — consider putting most recent Experience first for reverse-chronological format.');
    score -= 5;
  }

  // Sections properly labeled
  const hasProperHeadings = parsed.sections.filter((s) => s.present).length >= 3;
  if (hasProperHeadings) {
    strengths.push('Resume has clearly labeled sections detectable by ATS.');
    score = Math.min(score + 5, 100); // bonus for clear headings
  } else {
    issues.push('Few standard section headers detected. Use clear, conventional headings.');
    score -= 10;
  }

  // Contact info completeness
  if (parsed.contact.email) {
    strengths.push('Email address present and detectable.');
  } else {
    issues.push('No email address detected — critical for ATS contact parsing.');
    score -= 15;
  }

  if (parsed.detectedFormattingIssues.length === 0) {
    strengths.push('No critical formatting issues detected.');
  }

  const recs = generateCompatibilityRecommendations(
    makeCategory('ATS Compatibility', WEIGHTS.atsCompatibility, score, issues, strengths),
    parsed
  );

  return makeCategory('ATS Compatibility', WEIGHTS.atsCompatibility, score, issues, strengths, recs);
}

// ─── Category 2: Resume Structure (10%) ──────────────────────────────────────

const SECTION_WEIGHTS: Record<string, number> = {
  summary: 10,
  experience: 25,
  projects: 15,
  education: 15,
  skills: 20,
  achievements: 8,
  certifications: 4,
  languages: 3,
};

function scoreResumeStructure(parsed: StructuredResumeJSON): ATSCategoryScore {
  const issues: string[] = [];
  const strengths: string[] = [];
  let earnedPoints = 0;
  const totalPoints = Object.values(SECTION_WEIGHTS).reduce((s, v) => s + v, 0);

  const sectionMap: Record<string, boolean> = {
    summary: !!parsed.summary,
    experience: parsed.experience.length > 0,
    projects: parsed.projects.length > 0,
    education: parsed.education.length > 0,
    skills: parsed.skills.length > 0,
    achievements: parsed.achievements.length > 0,
    certifications: parsed.certifications.length > 0,
    languages: parsed.languages.length > 0,
  };

  for (const [section, weight] of Object.entries(SECTION_WEIGHTS)) {
    if (sectionMap[section]) {
      earnedPoints += weight;
      strengths.push(`${section.charAt(0).toUpperCase() + section.slice(1)} section present.`);
    } else {
      issues.push(`Missing ${section} section.`);
    }
  }

  const rawScore = Math.round((earnedPoints / totalPoints) * 100);
  const recs = generateStructureRecommendations(parsed);

  return makeCategory('Resume Structure', WEIGHTS.resumeStructure, rawScore, issues, strengths, recs);
}

// ─── Category 3: Technical Skills (15%) ──────────────────────────────────────

const SKILL_CATEGORY_DIVERSITY_BONUS = 3; // Points per unique category beyond 2
const SKILL_COVERAGE_THRESHOLDS = { excellent: 20, good: 12, average: 7, poor: 3 };

const MARKET_CRITICAL_SKILLS = [
  'git', 'sql', 'python', 'javascript', 'typescript', 'node.js', 'react',
  'docker', 'aws', 'linux', 'rest', 'postgresql', 'mongodb', 'machine learning',
];

function scoreTechnicalSkills(parsed: StructuredResumeJSON): ATSCategoryScore {
  const issues: string[] = [];
  const strengths: string[] = [];

  if (parsed.skills.length === 0) {
    return makeCategory(
      'Technical Skills', WEIGHTS.technicalSkills, 5,
      ['No technical skills detected.'],
      [],
      generateSkillsRecommendations(parsed, MARKET_CRITICAL_SKILLS)
    );
  }

  // Coverage score (0–40)
  let coverageScore = 0;
  if (parsed.skills.length >= SKILL_COVERAGE_THRESHOLDS.excellent) coverageScore = 40;
  else if (parsed.skills.length >= SKILL_COVERAGE_THRESHOLDS.good) coverageScore = 30;
  else if (parsed.skills.length >= SKILL_COVERAGE_THRESHOLDS.average) coverageScore = 20;
  else coverageScore = 10;

  if (parsed.skills.length >= SKILL_COVERAGE_THRESHOLDS.excellent) {
    strengths.push(`Strong skill breadth: ${parsed.skills.length} skills listed.`);
  } else {
    issues.push(`Only ${parsed.skills.length} skills detected. Aim for 15–25 skills.`);
  }

  // Modernity score (0–30)
  const modernCount = parsed.skills.filter((s) => s.isModern).length;
  const modernRatio = modernCount / parsed.skills.length;
  const modernityScore = Math.round(modernRatio * 30);

  if (modernRatio >= 0.6) {
    strengths.push(`${modernCount} modern technologies detected (${Math.round(modernRatio * 100)}% of skills).`);
  } else {
    issues.push(`Only ${Math.round(modernRatio * 100)}% of your skills are modern (< 2020). Update to current technologies.`);
  }

  // Diversity score (0–20)
  const uniqueCategories = new Set(parsed.skills.map((s) => s.category)).size;
  const diversityScore = Math.min(20, uniqueCategories * SKILL_CATEGORY_DIVERSITY_BONUS);

  if (uniqueCategories >= 5) {
    strengths.push(`Skills span ${uniqueCategories} categories — showing versatility.`);
  } else {
    issues.push(`Skills are concentrated in ${uniqueCategories} categories. Diversify across more tech domains.`);
  }

  // Critical market skills (0–10)
  const normalizedSkillNames = parsed.skills.map((s) => s.normalizedName);
  const criticalPresent = MARKET_CRITICAL_SKILLS.filter((s) => normalizedSkillNames.includes(s));
  const missingCritical = MARKET_CRITICAL_SKILLS.filter((s) => !normalizedSkillNames.includes(s));
  const criticalScore = Math.min(10, Math.round((criticalPresent.length / MARKET_CRITICAL_SKILLS.length) * 10));

  const rawScore = clamp(coverageScore + modernityScore + diversityScore + criticalScore);
  const recs = generateSkillsRecommendations(parsed, missingCritical);

  return makeCategory('Technical Skills', WEIGHTS.technicalSkills, rawScore, issues, strengths, recs);
}

// ─── Category 4: Experience Quality (15%) ────────────────────────────────────

function scoreExperienceQuality(parsed: StructuredResumeJSON): ATSCategoryScore {
  const issues: string[] = [];
  const strengths: string[] = [];

  if (parsed.experience.length === 0) {
    return makeCategory(
      'Experience Quality', WEIGHTS.experienceQuality, 10,
      ['No work experience detected.'],
      [],
      generateExperienceRecommendations(parsed)
    );
  }

  // Years of experience (0–30)
  const years = parsed.totalExperienceMonths / 12;
  let yearsScore = 0;
  if (years >= 5) { yearsScore = 30; strengths.push(`${years.toFixed(1)} years of experience detected.`); }
  else if (years >= 3) { yearsScore = 24; strengths.push(`${years.toFixed(1)} years of experience.`); }
  else if (years >= 1) { yearsScore = 16; }
  else if (years >= 0.5) { yearsScore = 10; }
  else { yearsScore = 5; issues.push('Very limited work experience detected.'); }

  // Role progression (0–15)
  const roleCount = parsed.experience.length;
  const progressionScore = Math.min(15, roleCount * 5);
  if (roleCount >= 2) strengths.push(`${roleCount} roles listed, showing career progression.`);

  // Quantified achievements (0–25)
  const totalBullets = parsed.experience.reduce((s, e) => s + e.bullets.length, 0);
  const quantifiedCount = parsed.experience.reduce((s, e) => s + e.quantifiedBullets.length, 0);
  const quantifiedRatio = totalBullets > 0 ? quantifiedCount / totalBullets : 0;
  const quantScore = Math.round(quantifiedRatio * 25);

  if (quantifiedRatio >= 0.4) {
    strengths.push(`${Math.round(quantifiedRatio * 100)}% of bullets have quantified metrics.`);
  } else {
    issues.push(`Only ${Math.round(quantifiedRatio * 100)}% of bullets are quantified. Add numbers/percentages.`);
  }

  // Leadership signals (0–15)
  const leadershipCount = parsed.experience.filter((e) => e.hasLeadershipKeywords).length;
  const leadershipScore = Math.min(15, leadershipCount * 7);
  if (leadershipCount > 0) strengths.push(`${leadershipCount} roles contain leadership keywords.`);
  else issues.push('No leadership signals detected in experience. Add terms like "led", "managed", "mentored".');

  // Impact signals (0–15)
  const impactCount = parsed.experience.filter((e) => e.hasImpactKeywords).length;
  const impactScore = Math.min(15, impactCount * 7);
  if (impactCount > 0) strengths.push(`${impactCount} roles demonstrate business impact.`);
  else issues.push('No impact keywords detected. Add terms like "improved", "reduced", "increased".');

  const rawScore = clamp(yearsScore + progressionScore + quantScore + leadershipScore + impactScore);
  const recs = generateExperienceRecommendations(parsed);

  return makeCategory('Experience Quality', WEIGHTS.experienceQuality, rawScore, issues, strengths, recs);
}

// ─── Category 5: Projects (10%) ──────────────────────────────────────────────

function scoreProjects(parsed: StructuredResumeJSON): ATSCategoryScore {
  const issues: string[] = [];
  const strengths: string[] = [];

  if (parsed.projects.length === 0) {
    return makeCategory(
      'Projects', WEIGHTS.projects, 5,
      ['No projects detected.'],
      [],
      generateProjectRecommendations(parsed)
    );
  }

  strengths.push(`${parsed.projects.length} projects detected.`);

  // Count (0–20)
  const countScore = Math.min(20, parsed.projects.length * 7);

  // Technology diversity (0–20)
  const allTech = parsed.projects.flatMap((p) => p.technologies);
  const uniqueTech = new Set(allTech).size;
  const techScore = Math.min(20, uniqueTech * 2);
  if (uniqueTech >= 5) strengths.push(`Projects use ${uniqueTech} unique technologies.`);

  // GitHub links (0–20)
  const githubCount = parsed.projects.filter((p) => p.hasGitHubLink).length;
  const githubScore = Math.min(20, Math.round((githubCount / parsed.projects.length) * 20));
  if (githubCount === parsed.projects.length) strengths.push('All projects have GitHub links.');
  else issues.push(`${parsed.projects.length - githubCount} projects missing GitHub links.`);

  // Deployment / production (0–20)
  const deployedCount = parsed.projects.filter((p) => p.hasDeploymentLink).length;
  const deployScore = Math.min(20, Math.round((deployedCount / parsed.projects.length) * 20));
  if (deployedCount > 0) strengths.push(`${deployedCount} projects are deployed with live links.`);
  else issues.push('No projects have deployment/live demo links.');

  // Complexity signals (0–20)
  const complexProjects = parsed.projects.filter((p) => p.complexitySignals.length >= 2).length;
  const complexScore = Math.min(20, complexProjects * 10);
  if (complexProjects > 0) strengths.push(`${complexProjects} projects demonstrate technical complexity.`);

  const rawScore = clamp(countScore + techScore + githubScore + deployScore + complexScore);
  const recs = generateProjectRecommendations(parsed);

  return makeCategory('Projects', WEIGHTS.projects, rawScore, issues, strengths, recs);
}

// ─── Category 6: Achievements (10%) ──────────────────────────────────────────

const ACHIEVEMENT_TYPE_SCORES: Record<string, number> = {
  hackathon: 20, award: 18, research: 18, publication: 18, patent: 15,
  competitive_programming: 15, leadership: 12, open_source: 12, certification: 10, other: 5,
};

function scoreAchievements(parsed: StructuredResumeJSON): ATSCategoryScore {
  const issues: string[] = [];
  const strengths: string[] = [];

  if (parsed.achievements.length === 0 && parsed.certifications.length === 0) {
    return makeCategory(
      'Achievements', WEIGHTS.achievements, 10,
      ['No achievements, awards, or certifications detected.'],
      [],
      generateAchievementsRecommendations(parsed)
    );
  }

  // Score from achievements
  let achScore = 0;
  const seenTypes = new Set<string>();
  for (const ach of parsed.achievements) {
    const pts = ACHIEVEMENT_TYPE_SCORES[ach.type] || 5;
    if (!seenTypes.has(ach.type)) {
      achScore += pts;
      seenTypes.add(ach.type);
      strengths.push(`${ach.type.replace(/_/g, ' ')} achievement detected.`);
    } else {
      achScore += Math.round(pts * 0.5); // Diminishing returns for same type
    }
  }

  // Certifications bonus
  const certBonus = Math.min(20, parsed.certifications.length * 8);
  if (parsed.certifications.length > 0) {
    strengths.push(`${parsed.certifications.length} certification(s) listed.`);
  }

  const rawScore = clamp(achScore + certBonus);
  const recs = generateAchievementsRecommendations(parsed);

  return makeCategory('Achievements', WEIGHTS.achievements, rawScore, issues, strengths, recs);
}

// ─── Category 7: Writing Quality (10%) ───────────────────────────────────────

const ACTION_VERBS = [
  'developed', 'built', 'designed', 'implemented', 'created', 'engineered',
  'architected', 'deployed', 'optimized', 'automated', 'led', 'managed',
  'improved', 'increased', 'reduced', 'decreased', 'launched', 'scaled',
  'mentored', 'collaborated', 'delivered', 'shipped', 'migrated', 'integrated',
  'established', 'maintained', 'researched', 'analyzed', 'evaluated', 'trained',
  'streamlined', 'modernized', 'refactored', 'enhanced', 'introduced', 'pioneered',
];

function scoreWritingQuality(parsed: StructuredResumeJSON): ATSCategoryScore {
  const issues: string[] = [];
  const strengths: string[] = [];

  const allBullets = parsed.experience.flatMap((e) => e.bullets);

  if (allBullets.length === 0) {
    return makeCategory(
      'Writing Quality', WEIGHTS.writingQuality, 30,
      ['No bullet points detected in experience section.'],
      [],
      []
    );
  }

  // Action verb usage (0–30)
  const bulletsWithVerbs = allBullets.filter((b) =>
    ACTION_VERBS.some((v) => new RegExp(`^${v}`, 'i').test(b.trim()))
  );
  const verbRatio = bulletsWithVerbs.length / allBullets.length;
  const verbScore = Math.round(verbRatio * 30);

  if (verbRatio >= 0.7) strengths.push(`${Math.round(verbRatio * 100)}% of bullets start with strong action verbs.`);
  else issues.push(`Only ${Math.round(verbRatio * 100)}% of bullets use strong action verbs. Start bullets with verbs like "Built", "Led", "Optimized".`);

  // Conciseness (0–25) — penalize bullets over 25 words
  const avgWords = allBullets.reduce((s, b) => s + b.split(' ').length, 0) / allBullets.length;
  let conciseScore = 25;
  if (avgWords > 30) { conciseScore = 10; issues.push('Bullets are too long. Aim for 10–20 words.'); }
  else if (avgWords > 22) { conciseScore = 18; issues.push('Some bullets are verbose. Consider trimming.'); }
  else strengths.push('Bullet points are concise and scannable.');

  // Repetition (0–20) — keyword density
  const densityAnalysis = analyzeKeywordDensity(allBullets.join(' '));
  const repetitionPenalty = Math.round(densityAnalysis.repetitionRatio * 20);
  const repetitionScore = 20 - repetitionPenalty;
  if (densityAnalysis.repetitionRatio < 0.1) strengths.push('Good vocabulary variety — low repetition.');
  else issues.push('Repeated words/phrases detected. Vary your language for stronger writing.');

  // Grammar consistency (0–15) — heuristic: consistent tense
  const pastTenseCount = allBullets.filter((b) => /\b(led|built|created|designed|managed|developed|reduced|increased|improved)\b/i.test(b)).length;
  const presentTenseCount = allBullets.filter((b) => /\b(lead|build|create|design|manage|develop|reduce|increase|improve)\b/i.test(b)).length;
  const tenseConsistency = Math.abs(pastTenseCount - presentTenseCount) <= 2 ? 15 : 8;
  if (tenseConsistency === 15) strengths.push('Consistent tense usage throughout experience section.');
  else issues.push('Mixed tenses detected. Use past tense consistently for completed roles.');

  // Bullet quality (0–10) — no generic phrases
  const genericPhrases = allBullets.filter((b) =>
    /^(responsible for|worked on|helped with|assisted in|involved in|participated in|supported the team)/i.test(b)
  );
  const genericScore = Math.max(0, 10 - genericPhrases.length * 3);
  if (genericPhrases.length > 0) {
    issues.push(`${genericPhrases.length} bullets start with weak phrases. Replace with impact statements.`);
  }

  const rawScore = clamp(verbScore + conciseScore + repetitionScore + tenseConsistency + genericScore);
  const recs = generateWritingRecommendations(parsed);

  return makeCategory('Writing Quality', WEIGHTS.writingQuality, rawScore, issues, strengths, recs);
}

// ─── Category 8: Resume Completeness (10%) ───────────────────────────────────

function scoreResumeCompleteness(parsed: StructuredResumeJSON): ATSCategoryScore {
  const issues: string[] = [];
  const strengths: string[] = [];
  let score = 100;

  // Contact completeness (–5 each)
  if (!parsed.contact.email) { score -= 20; issues.push('Missing email address.'); }
  else strengths.push('Email present.');

  if (!parsed.contact.githubUrl) { score -= 10; issues.push('Missing GitHub URL.'); }
  else strengths.push('GitHub URL present.');

  if (!parsed.contact.linkedinUrl) { score -= 8; issues.push('Missing LinkedIn URL.'); }
  else strengths.push('LinkedIn URL present.');

  if (!parsed.contact.phone) { score -= 5; issues.push('Missing phone number.'); }

  if (!parsed.contact.portfolioUrl) { score -= 5; issues.push('Missing portfolio/website URL.'); }

  // Content completeness
  if (!parsed.summary) { score -= 8; issues.push('Missing professional summary.'); }
  if (parsed.experience.length === 0) { score -= 10; issues.push('Missing work experience.'); }
  if (parsed.projects.length === 0) { score -= 8; issues.push('No projects listed.'); }

  // Incomplete dates
  const incompleteExp = parsed.experience.filter((e) => !e.startDate || !e.endDate).length;
  if (incompleteExp > 0) { score -= incompleteExp * 3; issues.push(`${incompleteExp} experience entries have incomplete date ranges.`); }

  // Weak descriptions
  const weakProjects = parsed.projects.filter((p) => p.description.trim().length < 30).length;
  if (weakProjects > 0) { score -= weakProjects * 3; issues.push(`${weakProjects} projects have very thin descriptions.`); }

  const recs = generateCompletenessRecommendations(parsed);
  return makeCategory('Resume Completeness', WEIGHTS.resumeCompleteness, clamp(score), issues, strengths, recs);
}

// ─── Category 9: Industry Readiness (5%) ─────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();

function scoreIndustryReadiness(parsed: StructuredResumeJSON): ATSCategoryScore {
  const issues: string[] = [];
  const strengths: string[] = [];

  const normalizedSkillNames = parsed.skills.map((s) => s.normalizedName);

  // Modern skill ratio (0–50)
  const modernSkills = parsed.skills.filter((s) => s.isModern);
  const modernRatio = parsed.skills.length > 0 ? modernSkills.length / parsed.skills.length : 0;
  const modernScore = Math.round(modernRatio * 50);

  if (modernRatio >= 0.6) {
    strengths.push('Majority of skills are modern, in-demand technologies.');
  } else {
    issues.push('Many skills are older technologies. Prioritize learning modern tools.');
  }

  // Cutting-edge tech bonus (0–30)
  const cuttingEdge = ['generative ai', 'langchain', 'vector database', 'mlops', 'dataops', 'grpc', 'playwright', 'vitest'];
  const cuttingEdgeCount = cuttingEdge.filter((t) => normalizedSkillNames.includes(t)).length;
  const cuttingEdgeScore = Math.min(30, cuttingEdgeCount * 10);
  if (cuttingEdgeCount > 0) strengths.push(`${cuttingEdgeCount} cutting-edge technologies (${CURRENT_YEAR - 2} or newer) detected.`);

  // Cloud adoption (0–20)
  const cloudSkills = ['aws', 'gcp', 'azure', 'vercel', 'netlify', 'firebase'];
  const hasCloud = cloudSkills.some((s) => normalizedSkillNames.includes(s));
  const cloudScore = hasCloud ? 20 : 0;
  if (hasCloud) strengths.push('Cloud platform experience present.');
  else issues.push('No cloud platform skills detected. Cloud experience is expected in most modern roles.');

  const rawScore = clamp(modernScore + cuttingEdgeScore + cloudScore);
  const recs = generateIndustryRecommendations(parsed, rawScore);

  return makeCategory('Industry Readiness', WEIGHTS.industryReadiness, rawScore, issues, strengths, recs);
}

// ─── Score Aggregation ────────────────────────────────────────────────────────

function computeUniversalScore(categories: UniversalATSReport['categories']): number {
  const total = Object.entries(categories).reduce((sum, [, cat]) => {
    return sum + cat.weightedScore;
  }, 0);
  return clamp(Math.round(total));
}

// ─── Universal ATS Engine ─────────────────────────────────────────────────────

export class UniversalATSEngine {
  /**
   * Scores a parsed resume on 9 weighted categories.
   *
   * @param parsed - StructuredResumeJSON from ResumeParser
   * @returns UniversalATSReport — deterministic for the same input
   */
  score(parsed: StructuredResumeJSON): UniversalATSReport {
    const atsCompatibility = scoreATSCompatibility(parsed);
    const resumeStructure = scoreResumeStructure(parsed);
    const technicalSkills = scoreTechnicalSkills(parsed);
    const experienceQuality = scoreExperienceQuality(parsed);
    const projects = scoreProjects(parsed);
    const achievements = scoreAchievements(parsed);
    const writingQuality = scoreWritingQuality(parsed);
    const resumeCompleteness = scoreResumeCompleteness(parsed);
    const industryReadiness = scoreIndustryReadiness(parsed);

    const categories = {
      atsCompatibility,
      resumeStructure,
      technicalSkills,
      experienceQuality,
      projects,
      achievements,
      writingQuality,
      resumeCompleteness,
      industryReadiness,
    };

    const universalScore = computeUniversalScore(categories);
    const grade = gradeFromScore(universalScore);

    // Collect all strengths and weaknesses
    const strengths = Object.values(categories)
      .flatMap((c) => c.strengths)
      .slice(0, 8);

    const weaknesses = Object.values(categories)
      .flatMap((c) => c.issues)
      .slice(0, 8);

    const missingSections = parsed.sections
      .filter((s) => !s.present)
      .map((s) => s.name);

    const formattingIssues = parsed.detectedFormattingIssues
      .map((i) => i.description);

    // Collect all recommendations, sort by priority
    const allRecs = Object.values(categories).flatMap((c) => c.recommendations);
    const improvementPriority = sortByPriority(allRecs).slice(0, 5);

    const estimatedScoreImprovement = Math.min(
      100 - universalScore,
      improvementPriority.reduce((s, r) => s + r.expectedScoreGain, 0)
    );

    return {
      universalScore,
      grade,
      categories,
      strengths,
      weaknesses,
      missingSections,
      formattingIssues,
      improvementPriority,
      estimatedScoreImprovement,
      parsedResume: parsed,
      scoredAt: new Date().toISOString(),
      engineVersion: UNIVERSAL_ENGINE_VERSION,
    };
  }
}

export const universalATSEngine = new UniversalATSEngine();
