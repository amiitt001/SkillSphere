/**
 * ATS Job Description Parser
 *
 * Converts raw job description text → StructuredJobJSON
 *
 * Extracts: company, role, industry, skills, responsibilities,
 *           experience requirements, keywords with weights.
 *
 * All logic is deterministic — no AI, no I/O.
 */

import { normalize, normalizeAll } from './normalizer';
import { extractJobKeywords } from './keywordEngine';
import type { StructuredJobJSON } from './types';

// ─── Industry Detection ───────────────────────────────────────────────────────

const INDUSTRY_SIGNALS: Array<{ industry: string; keywords: RegExp[] }> = [
  { industry: 'Software Engineering', keywords: [/software engineer/i, /frontend/i, /backend/i, /full.?stack/i, /web developer/i] },
  { industry: 'Data Science & Analytics', keywords: [/data scientist/i, /data analyst/i, /business intelligence/i, /analytics/i] },
  { industry: 'Machine Learning & AI', keywords: [/machine learning/i, /ai engineer/i, /ml engineer/i, /deep learning/i, /nlp engineer/i] },
  { industry: 'DevOps & Cloud', keywords: [/devops/i, /site reliability/i, /sre\b/i, /cloud engineer/i, /platform engineer/i] },
  { industry: 'Cybersecurity', keywords: [/security engineer/i, /penetration test/i, /soc analyst/i, /cybersecurity/i] },
  { industry: 'Mobile Development', keywords: [/mobile developer/i, /ios developer/i, /android developer/i, /flutter developer/i] },
  { industry: 'Finance & Fintech', keywords: [/fintech/i, /financial engineer/i, /quantitative/i, /trading/i] },
  { industry: 'Healthcare & Biotech', keywords: [/healthcare/i, /bioinformatics/i, /medical/i, /clinical/i] },
  { industry: 'Mechanical Engineering', keywords: [/mechanical engineer/i, /cad/i, /solidworks/i, /autocad/i] },
  { industry: 'Civil Engineering', keywords: [/civil engineer/i, /structural/i, /geotechnical/i, /construction/i] },
  { industry: 'Management & Business', keywords: [/product manager/i, /mba/i, /business analyst/i, /operations manager/i] },
];

function detectIndustry(text: string, role: string): string {
  const combined = `${role} ${text}`.toLowerCase();
  for (const { industry, keywords } of INDUSTRY_SIGNALS) {
    if (keywords.some((k) => k.test(combined))) return industry;
  }
  return 'General';
}

// ─── Role & Company Extraction ────────────────────────────────────────────────

const COMPANY_PATTERNS = [
  /company\s*:\s*(.+)/i,
  /about\s+(?:us|our company|the company)\s*[:\n]\s*(.+)/i,
  /at\s+([A-Z][a-zA-Z0-9\s&,.-]{2,40})\s*,/,
  /join\s+([A-Z][a-zA-Z0-9\s&,.-]{2,40})\s+as/i,
];

const ROLE_PATTERNS = [
  /(?:position|role|title|job title)\s*:\s*(.+)/i,
  /we're hiring\s+(?:a\s+|an\s+)?(.+?)(?:\.|,|\n)/i,
  /seeking\s+(?:a\s+|an\s+)?(.+?)(?:\.|,|\n)/i,
  /^(Senior|Junior|Lead|Principal|Staff)?\s*([A-Z][a-z]+\s+){1,3}(?:Engineer|Developer|Analyst|Scientist|Designer|Manager|Architect)/m,
];

function extractCompany(text: string): string {
  for (const pattern of COMPANY_PATTERNS) {
    const m = text.match(pattern);
    if (m) return m[1].trim().slice(0, 60);
  }
  return '';
}

function extractRole(text: string): string {
  for (const pattern of ROLE_PATTERNS) {
    const m = text.match(pattern);
    if (m) {
      const candidate = (m[1] || m[0]).trim();
      if (candidate.length > 3 && candidate.length < 80) return candidate;
    }
  }
  // Fallback: first line that looks like a job title
  const firstLine = text.split('\n').find((l) => {
    const t = l.trim();
    return t.length > 5 && t.length < 80 && /engineer|developer|analyst|scientist|designer|manager/i.test(t);
  });
  return firstLine?.trim() || '';
}

// ─── Responsibilities Extraction ──────────────────────────────────────────────

const RESPONSIBILITY_SECTION_PATTERNS = [
  /responsibilities?/i,
  /you('ll| will) be/i,
  /what you('ll| will) do/i,
  /key duties/i,
  /role description/i,
  /your role/i,
];

const BULLET_LINE_RE = /^[-•·▪►▸*✓→]\s+/;

function extractResponsibilities(text: string): string[] {
  const lines = text.split('\n');
  let inSection = false;
  const responsibilities: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const isHeader = RESPONSIBILITY_SECTION_PATTERNS.some((p) => p.test(line));
    if (isHeader && line.length < 60) {
      inSection = true;
      continue;
    }

    // Stop if we hit another major section
    if (inSection && /^(qualifications?|requirements?|skills?|education|benefits?|about|what we offer)/i.test(line) && line.length < 60) {
      inSection = false;
    }

    if (inSection && (BULLET_LINE_RE.test(lines[i]) || (lines[i].startsWith('  ') && line.length > 10))) {
      const clean = line.replace(BULLET_LINE_RE, '').trim();
      if (clean.length > 10) responsibilities.push(clean);
    }
  }

  return responsibilities;
}

// ─── Skills & Requirements Extraction ────────────────────────────────────────

const REQUIRED_SECTION_PATTERNS = [
  /requirements?/i,
  /required skills?/i,
  /must have/i,
  /mandatory/i,
  /minimum qualifications?/i,
  /basic qualifications?/i,
];

const PREFERRED_SECTION_PATTERNS = [
  /preferred/i,
  /nice to have/i,
  /bonus/i,
  /plus/i,
  /desired/i,
  /optional/i,
];

const EXPERIENCE_YEARS_RE = /(\d+)\+?\s*(?:to\s*\d+\s*)?years?\s*(?:of\s+)?(?:experience|exp)?/i;

function extractSkillsFromSection(lines: string[]): string[] {
  const raw = lines
    .join(' ')
    .split(/[,;|•·\n\t]+/)
    .map((s) => s.trim().replace(BULLET_LINE_RE, ''))
    .filter((s) => s.length > 1 && s.length < 60);

  return normalizeAll(raw);
}

function extractExperienceYears(text: string): number | null {
  const matches = text.match(EXPERIENCE_YEARS_RE);
  if (matches) return parseInt(matches[1]);
  return null;
}

// ─── Soft Skill & Cultural Keyword Extraction ─────────────────────────────────

const SOFT_SKILL_KEYWORDS = [
  'communication', 'collaboration', 'teamwork', 'leadership', 'problem-solving',
  'analytical', 'critical thinking', 'adaptability', 'time management',
  'creativity', 'initiative', 'ownership', 'accountability', 'mentoring',
  'attention to detail', 'organizational skills', 'presentation skills',
];

const CULTURAL_KEYWORDS = [
  'ownership', 'accountability', 'proactive', 'self-motivated', 'entrepreneurial',
  'startup mindset', 'growth mindset', 'fast-paced', 'collaborative', 'inclusive',
  'diverse', 'mission-driven', 'data-driven', 'customer-obsessed', 'agile',
  'move fast', 'scrappy', 'open-minded',
];

function extractSoftSkills(text: string): string[] {
  const lower = text.toLowerCase();
  return SOFT_SKILL_KEYWORDS.filter((k) => lower.includes(k));
}

function extractCulturalKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return CULTURAL_KEYWORDS.filter((k) => lower.includes(k));
}

// ─── Certification & Education Requirements ───────────────────────────────────

const CERT_PATTERN = /\b(AWS Certified|Google Cloud|Azure|PMP|CPA|CFA|CISSP|CCNA|CompTIA|Oracle|Salesforce)\s+[\w\s]+(?:Certification|Certificate|Certified)?\b/gi;
const EDU_PATTERN = /\b(Bachelor'?s?|Master'?s?|PhD|B\.Tech|M\.Tech|MBA|B\.E\.|M\.S\.|B\.Sc|M\.Sc)\b.*?(?:in\s+[\w\s]+)?/gi;

function extractCertifications(text: string): string[] {
  return [...new Set((text.match(CERT_PATTERN) || []).map((s) => s.trim()))];
}

function extractEducationRequirements(text: string): string[] {
  return [...new Set((text.match(EDU_PATTERN) || []).map((s) => s.trim().slice(0, 80)))];
}

// ─── Section Splitter ─────────────────────────────────────────────────────────

function splitIntoSections(text: string): Map<string, string[]> {
  const lines = text.split('\n');
  const sections = new Map<string, string[]>();
  let currentSection = 'intro';
  let buffer: string[] = [];

  const SECTION_HEADERS = [
    ...REQUIRED_SECTION_PATTERNS,
    ...PREFERRED_SECTION_PATTERNS,
    ...RESPONSIBILITY_SECTION_PATTERNS,
    /about\s+(the\s+)?(?:role|position|company|us)/i,
    /qualifications?/i,
    /what we offer/i,
    /benefits?/i,
    /education/i,
  ];

  for (const line of lines) {
    const l = line.trim();
    if (!l) {
      buffer.push(line);
      continue;
    }

    const isHeader = SECTION_HEADERS.some((p) => p.test(l)) && l.length < 60;
    if (isHeader) {
      if (buffer.length > 0) {
        sections.set(currentSection, buffer);
      }
      currentSection = l.toLowerCase().replace(/[^a-z0-9]/g, '_');
      buffer = [];
    } else {
      buffer.push(line);
    }
  }

  if (buffer.length > 0) sections.set(currentSection, buffer);
  return sections;
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

export class JobParser {
  parse(rawText: string, targetRole?: string, industry?: string): StructuredJobJSON {
    const company = extractCompany(rawText);
    const role = targetRole || extractRole(rawText);
    const detectedIndustry = industry || detectIndustry(rawText, role);
    const responsibilities = extractResponsibilities(rawText);

    const sections = splitIntoSections(rawText);
    const requiredLines: string[] = [];
    const preferredLines: string[] = [];

    sections.forEach((lines, key) => {
      const isRequired = REQUIRED_SECTION_PATTERNS.some((p) => p.test(key));
      const isPreferred = PREFERRED_SECTION_PATTERNS.some((p) => p.test(key));
      if (isRequired) requiredLines.push(...lines);
      else if (isPreferred) preferredLines.push(...lines);
    });

    // Fallback: if no section matched, scan full text for skill hints
    const allSkillSource = requiredLines.length === 0 ? rawText.split('\n') : requiredLines;

    const requiredSkills = extractSkillsFromSection(allSkillSource);
    const preferredSkills = extractSkillsFromSection(preferredLines.length > 0 ? preferredLines : []);

    const requiredExperienceYears = extractExperienceYears(
      requiredLines.join(' ') || rawText
    );
    const preferredExperienceYears = extractExperienceYears(preferredLines.join(' '));

    const certificationRequirements = extractCertifications(rawText);
    const educationRequirements = extractEducationRequirements(rawText);
    const softSkillKeywords = extractSoftSkills(rawText);
    const culturalKeywords = extractCulturalKeywords(rawText);

    const keywords = extractJobKeywords(rawText, role);

    // Tools: look for specific tool mentions not already in skills
    const toolPattern = /\b(Jira|Confluence|Slack|GitHub|GitLab|Bitbucket|Postman|Figma|Notion|Asana|Trello|Linear|VSCode|IntelliJ|Xcode|Android Studio)\b/g;
    const tools = [...new Set((rawText.match(toolPattern) || []).map((t) => t.toLowerCase()))];

    return {
      rawText,
      company,
      role,
      industry: detectedIndustry,
      requiredSkills,
      preferredSkills,
      responsibilities,
      requiredExperienceYears,
      preferredExperienceYears,
      educationRequirements,
      certificationRequirements,
      tools,
      keywords,
      softSkillKeywords,
      culturalKeywords,
      parsedAt: new Date().toISOString(),
    };
  }
}

export const jobParser = new JobParser();
