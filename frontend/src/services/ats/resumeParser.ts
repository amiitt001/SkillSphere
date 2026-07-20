/**
 * ATS Resume Parser
 *
 * Converts raw resume text → StructuredResumeJSON
 *
 * Pipeline:
 * 1. Section detection (regex + keyword matching)
 * 2. Contact extraction
 * 3. Per-section structured parsing
 * 4. Skill classification
 * 5. Formatting issue detection
 *
 * All logic is deterministic — no AI, no I/O.
 */

import { normalize, normalizeAll } from './normalizer';
import type {
  StructuredResumeJSON,
  ParsedContactInfo,
  ParsedEducation,
  ParsedExperience,
  ParsedProject,
  ParsedAchievement,
  ParsedSkill,
  SkillCategory,
  DetectedSection,
  FormattingIssue,
  AchievementType,
} from './types';

// ─── Engine Version ───────────────────────────────────────────────────────────
export const RESUME_PARSER_VERSION = '2.0.0';

// ─── Modern Tech Index ────────────────────────────────────────────────────────
// Skills considered modern/current in industry (year = mainstream adoption)
export const MODERN_TECH_INDEX: Readonly<Record<string, number>> = {
  'react': 2016, 'next.js': 2018, 'typescript': 2020, 'python': 2018,
  'kubernetes': 2019, 'docker': 2017, 'terraform': 2020, 'aws': 2015,
  'gcp': 2016, 'azure': 2016, 'graphql': 2018, 'rust': 2021, 'go': 2016,
  'node.js': 2016, 'fastapi': 2020, 'postgresql': 2018, 'mongodb': 2016,
  'redis': 2017, 'kafka': 2018, 'elasticsearch': 2018, 'github actions': 2020,
  'pytorch': 2019, 'tensorflow': 2018, 'scikit-learn': 2017, 'pandas': 2017,
  'llm': 2023, 'langchain': 2023, 'openai api': 2023, 'generative ai': 2023,
  'vector database': 2023, 'pinecone': 2023, 'flutter': 2020, 'react native': 2018,
  'vue.js': 2018, 'angular': 2017, 'svelte': 2021, 'tailwind css': 2021,
  'prisma': 2021, 'supabase': 2021, 'vercel': 2021, 'netlify': 2019,
  'microservices': 2018, 'grpc': 2019, 'websockets': 2017,
  'ci/cd': 2018, 'devops': 2017, 'mlops': 2021, 'dataops': 2021,
  'airflow': 2019, 'dbt': 2021, 'snowflake': 2020, 'databricks': 2021,
  'spark': 2018, 'flink': 2020, 'selenium': 2015, 'playwright': 2021,
  'cypress': 2020, 'jest': 2018, 'vitest': 2022,
};

const CURRENT_YEAR = new Date().getFullYear();

// ─── Section Detection ────────────────────────────────────────────────────────

const SECTION_PATTERNS: Array<{ name: string; normalizedName: string; patterns: RegExp[] }> = [
  {
    name: 'Summary', normalizedName: 'summary',
    patterns: [/^(professional\s+)?summary/i, /^(career\s+)?objective/i, /^profile/i, /^about\s+me/i],
  },
  {
    name: 'Experience', normalizedName: 'experience',
    patterns: [/^(work\s+|professional\s+)?experience/i, /^employment/i, /^work\s+history/i, /^internship(s)?/i],
  },
  {
    name: 'Projects', normalizedName: 'projects',
    patterns: [/^projects?/i, /^(personal|academic|side)\s+projects?/i],
  },
  {
    name: 'Education', normalizedName: 'education',
    patterns: [/^education/i, /^academic\s+(background|history|qualifications?)/i, /^qualifications?/i],
  },
  {
    name: 'Skills', normalizedName: 'skills',
    patterns: [/^(technical\s+)?skills?/i, /^technologies/i, /^(core\s+)?competencies/i, /^tech(nical)?\s+stack/i],
  },
  {
    name: 'Achievements', normalizedName: 'achievements',
    patterns: [/^achievements?/i, /^awards?\s+and\s+honors?/i, /^honors?/i, /^accomplishments?/i],
  },
  {
    name: 'Certifications', normalizedName: 'certifications',
    patterns: [/^certifications?/i, /^licenses?\s+and\s+certifications?/i, /^credentials?/i],
  },
  {
    name: 'Links', normalizedName: 'links',
    patterns: [/^links?/i, /^(online\s+)?profiles?/i, /^portfolio/i, /^websites?/i],
  },
  {
    name: 'Languages', normalizedName: 'languages',
    patterns: [/^languages?/i, /^spoken\s+languages?/i],
  },
];

interface SectionBound {
  name: string;
  normalizedName: string;
  startLine: number;
  endLine: number;
}

function detectSections(lines: string[]): { sections: DetectedSection[]; bounds: SectionBound[] } {
  const detected: DetectedSection[] = SECTION_PATTERNS.map((s) => ({
    name: s.name,
    normalizedName: s.normalizedName,
    startLine: -1,
    present: false,
  }));

  const bounds: SectionBound[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    for (let si = 0; si < SECTION_PATTERNS.length; si++) {
      const sp = SECTION_PATTERNS[si];
      const isHeader = sp.patterns.some((p) => p.test(line));

      // Only treat as section header if line is relatively short (not a paragraph)
      if (isHeader && line.length < 60) {
        if (!detected[si].present) {
          detected[si].startLine = i;
          detected[si].present = true;
        }
        // Close previous bound for same section type
        const existing = bounds.find((b) => b.normalizedName === sp.normalizedName);
        if (!existing) {
          bounds.push({ name: sp.name, normalizedName: sp.normalizedName, startLine: i, endLine: lines.length });
        }
        // Close previous open bounds
        for (const b of bounds) {
          if (b.endLine === lines.length && b.startLine < i) {
            b.endLine = i;
          }
        }
        bounds.push({ name: sp.name, normalizedName: sp.normalizedName, startLine: i, endLine: lines.length });
        break;
      }
    }
  }

  return { sections: detected, bounds };
}

function getSectionLines(bounds: SectionBound[], name: string, allLines: string[]): string[] {
  const matching = bounds.filter((b) => b.normalizedName === name);
  if (matching.length === 0) return [];
  // Use the last occurrence (most specific)
  const last = matching[matching.length - 1];
  return allLines.slice(last.startLine + 1, last.endLine).filter((l) => l.trim());
}

// ─── Contact Extraction ───────────────────────────────────────────────────────

const EMAIL_RE = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/;
const PHONE_RE = /(\+?[\d\s\-().]{7,15}\d)/;
const GITHUB_RE = /github\.com\/([a-zA-Z0-9_-]+)/i;
const LINKEDIN_RE = /linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i;
const URL_RE = /https?:\/\/[^\s]+/g;

function extractContact(text: string, firstFewLines: string[]): ParsedContactInfo {
  const emailMatch = text.match(EMAIL_RE);
  const phoneMatch = text.match(PHONE_RE);
  const githubMatch = text.match(GITHUB_RE);
  const linkedinMatch = text.match(LINKEDIN_RE);

  const allUrls = text.match(URL_RE) || [];
  const otherLinks = allUrls.filter(
    (u) => !GITHUB_RE.test(u) && !LINKEDIN_RE.test(u)
  );

  let portfolioUrl = '';
  for (const url of otherLinks) {
    if (/portfolio|personal|site|me\.|io\b/i.test(url)) {
      portfolioUrl = url;
      break;
    }
  }

  // Guess name from first non-empty line (heuristic)
  const nameLine = firstFewLines.find(
    (l) => l.trim().length > 2 && l.trim().length < 50 && !EMAIL_RE.test(l)
  ) || '';

  // Location: look for city, state pattern
  const locationMatch = text.match(
    /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),?\s+([A-Z]{2}|[A-Z][a-z]+)\b(?:\s*[-–]\s*\d{5})?/
  );

  return {
    fullName: nameLine.trim().replace(/[^a-zA-Z\s.'-]/g, '').trim(),
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[1].trim() : '',
    location: locationMatch ? locationMatch[0] : '',
    githubUrl: githubMatch ? `github.com/${githubMatch[1]}` : '',
    linkedinUrl: linkedinMatch ? `linkedin.com/in/${linkedinMatch[1]}` : '',
    portfolioUrl,
    otherLinks: otherLinks.filter((u) => u !== portfolioUrl),
  };
}

// ─── Education Parsing ────────────────────────────────────────────────────────

const DEGREE_PATTERNS = [
  { re: /\bb\.?tech\b/i, degree: 'B.Tech' },
  { re: /\bb\.?e\b\.?/i, degree: 'B.E.' },
  { re: /\bb\.?s\.?c?\b/i, degree: 'B.Sc' },
  { re: /\bb\.?c\.?a\b/i, degree: 'BCA' },
  { re: /\bm\.?tech\b/i, degree: 'M.Tech' },
  { re: /\bm\.?s\b\.?/i, degree: 'M.S.' },
  { re: /\bm\.?b\.?a\b/i, degree: 'MBA' },
  { re: /\bm\.?c\.?a\b/i, degree: 'MCA' },
  { re: /\bph\.?d\b/i, degree: 'PhD' },
  { re: /\bbachelor/i, degree: 'Bachelor\'s' },
  { re: /\bmaster/i, degree: 'Master\'s' },
  { re: /\bdiploma\b/i, degree: 'Diploma' },
];

const YEAR_RE = /\b(20\d{2}|19\d{2})\b/g;
const CGPA_RE = /\b(\d\.\d{1,2})\s*(?:cgpa|gpa|\/10|\/4(?:\.0)?)\b/i;

function parseEducation(lines: string[]): ParsedEducation[] {
  const entries: ParsedEducation[] = [];
  let current: Partial<ParsedEducation> | null = null;

  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;

    const hasDegree = DEGREE_PATTERNS.some((d) => d.re.test(l));
    const yearMatches = [...l.matchAll(YEAR_RE)].map((m) => parseInt(m[0]));
    const cgpaMatch = l.match(CGPA_RE);

    if (hasDegree || (yearMatches.length > 0 && l.length > 15)) {
      if (current && (current.institution || current.degree)) {
        entries.push({
          institution: current.institution || '',
          degree: current.degree || '',
          branch: current.branch || '',
          graduationYear: current.graduationYear || null,
          cgpa: current.cgpa || '',
          relevantCoursework: current.relevantCoursework || [],
        });
      }
      current = {};

      // Extract degree
      for (const d of DEGREE_PATTERNS) {
        if (d.re.test(l)) { current.degree = d.degree; break; }
      }

      // Extract institution (heuristic: words after degree or on next line)
      const matchingPattern = DEGREE_PATTERNS.find((d) => d.re.test(l));
      const afterDegree = matchingPattern ? l.replace(matchingPattern.re, '').trim() : l.trim();
      if (afterDegree.length > 5) current.institution = afterDegree.slice(0, 80);

      // Graduation year = the latest year in range
      if (yearMatches.length > 0) {
        current.graduationYear = Math.max(...yearMatches);
      }

      // CGPA
      if (cgpaMatch) current.cgpa = cgpaMatch[1];

      // Branch — look for engineering branches
      const branchMatch = l.match(/(computer\s+science|electronics?|mechanical|civil|electrical|information\s+technology|it\b|cse\b|ece\b|eee\b)/i);
      if (branchMatch) current.branch = branchMatch[1];

    } else if (current) {
      // Additional line for current entry
      if (!current.institution && l.length > 5 && l.length < 100) {
        current.institution = l.slice(0, 80);
      }
      if (!current.graduationYear && yearMatches.length > 0) {
        current.graduationYear = Math.max(...yearMatches);
      }
      if (!current.cgpa && cgpaMatch) current.cgpa = cgpaMatch[1];
      if (!current.branch) {
        const b = l.match(/(computer\s+science|electronics?|mechanical|civil|electrical|information\s+technology|it\b|cse\b|ece\b)/i);
        if (b) current.branch = b[1];
      }
    }
  }

  if (current && (current.institution || current.degree)) {
    entries.push({
      institution: current.institution || '',
      degree: current.degree || '',
      branch: current.branch || '',
      graduationYear: current.graduationYear || null,
      cgpa: current.cgpa || '',
      relevantCoursework: [],
    });
  }

  return entries;
}

// ─── Experience Parsing ───────────────────────────────────────────────────────

const DATE_RANGE_RE = /((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|\d{1,2}\/\d{4})\s*[-–—to]+\s*((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}|Present|Current|Now)/i;

const LEADERSHIP_KEYWORDS = [
  'led', 'lead', 'managed', 'manage', 'headed', 'oversaw', 'coordinated',
  'supervised', 'mentored', 'directed', 'spearheaded', 'founded', 'established',
  'organized', 'trained', 'guided', 'owned', 'drove',
];

const IMPACT_KEYWORDS = [
  'improved', 'increased', 'reduced', 'decreased', 'optimized', 'achieved',
  'delivered', 'launched', 'deployed', 'scaled', 'accelerated', 'boosted',
  'enhanced', 'streamlined', 'automated', 'saved', 'generated', 'built',
];

const QUANTIFIED_RE = /(\d+[\.,]?\d*\s*(%|x|k|m|b|ms|s|hr|hours?|days?|weeks?|months?|users?|requests?|queries?|transactions?|records?|lines?|repos?|tickets?))/i;

const INTERNSHIP_KEYWORDS = ['intern', 'internship', 'trainee', 'apprentice'];

function estimateDurationMonths(dateRangeStr: string): number {
  const monthMap: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };

  const parts = dateRangeStr.split(/[-–—to]+/i).map((s) => s.trim());
  if (parts.length < 2) return 0;

  const parseDate = (s: string): Date | null => {
    if (/present|current|now/i.test(s)) return new Date();
    const yearOnly = s.match(/^(\d{4})$/);
    if (yearOnly) return new Date(parseInt(yearOnly[1]), 0);
    const monthYear = s.match(/(\w+)\s+(\d{4})/i);
    if (monthYear) {
      const m = monthMap[monthYear[1].slice(0, 3).toLowerCase()];
      if (m !== undefined) return new Date(parseInt(monthYear[2]), m);
    }
    const slashDate = s.match(/(\d{1,2})\/(\d{4})/);
    if (slashDate) return new Date(parseInt(slashDate[2]), parseInt(slashDate[1]) - 1);
    return null;
  };

  const start = parseDate(parts[0]);
  const end = parseDate(parts[1]);
  if (!start || !end) return 0;

  return Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
}

function parseExperience(lines: string[]): ParsedExperience[] {
  const entries: ParsedExperience[] = [];
  let current: Partial<ParsedExperience & { rawBullets: string[] }> | null = null;

  const flush = () => {
    if (current && (current.company || current.role)) {
      const bullets = current.rawBullets || [];
      const quantifiedBullets = bullets.filter((b) => QUANTIFIED_RE.test(b));
      const hasLeadership = bullets.some((b) =>
        LEADERSHIP_KEYWORDS.some((k) => new RegExp(`\\b${k}`, 'i').test(b))
      );
      const hasImpact = bullets.some((b) =>
        IMPACT_KEYWORDS.some((k) => new RegExp(`\\b${k}`, 'i').test(b))
      );
      const combinedText = [current.role || '', current.company || ''].join(' ').toLowerCase();
      const isInternship = INTERNSHIP_KEYWORDS.some((k) => combinedText.includes(k));

      entries.push({
        company: current.company || '',
        role: current.role || '',
        startDate: current.startDate || '',
        endDate: current.endDate || '',
        durationMonths: current.durationMonths || 0,
        isInternship,
        bullets,
        quantifiedBullets,
        hasLeadershipKeywords: hasLeadership,
        hasImpactKeywords: hasImpact,
      });
      current = null;
    }
  };

  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;

    const dateMatch = l.match(DATE_RANGE_RE);
    const isBullet = /^[-•·▪►▸*]\s/.test(l) || /^\s{2,}[a-z]/.test(line);

    if (dateMatch && !isBullet) {
      // New experience entry
      flush();
      current = { rawBullets: [] };

      const dateStr = dateMatch[0];
      const parts = dateStr.split(/[-–—to]+/i).map((s) => s.trim());
      current.startDate = parts[0] || '';
      current.endDate = parts[1] || '';
      current.durationMonths = estimateDurationMonths(dateStr);

      // Role and company are usually on the same line or the line before
      const beforeDate = l.replace(dateStr, '').trim().replace(/[|·–—]+/g, '|');
      const splitParts = beforeDate.split('|').map((s) => s.trim()).filter(Boolean);
      if (splitParts.length >= 2) {
        current.role = splitParts[0];
        current.company = splitParts[1];
      } else if (splitParts.length === 1) {
        current.role = splitParts[0];
      }

    } else if (current && !dateMatch) {
      if (isBullet) {
        const bullet = l.replace(/^[-•·▪►▸*]\s+/, '').trim();
        if (bullet.length > 5) (current.rawBullets ||= []).push(bullet);
      } else if (!current.role && l.length < 100) {
        current.role = l;
      } else if (!current.company && l.length < 80) {
        current.company = l;
      }
    }
  }

  flush();
  return entries;
}

// ─── Project Parsing ──────────────────────────────────────────────────────────

const TECH_EXTRACTION_RE = /\b(React|Vue|Angular|Node\.js|Python|Java|Go|Rust|TypeScript|JavaScript|Next\.js|Django|Flask|FastAPI|Spring|Express|Rails|Laravel|PostgreSQL|MongoDB|MySQL|Redis|Docker|Kubernetes|AWS|GCP|Azure|GraphQL|REST|gRPC|TensorFlow|PyTorch|Pandas|NumPy|Spark|Kafka|Terraform|GitHub|CI\/CD|Flutter|Swift|Kotlin|HTML|CSS|Tailwind|Bootstrap|Firebase|Supabase|Vercel|Netlify|Linux|Bash|Git|Jest|Playwright|Cypress|Selenium|Redux|RxJS|Prisma|SQLite|DynamoDB|Elasticsearch|Prometheus|Grafana|Nginx|Apache|Hadoop|Airflow|dbt|Snowflake|Databricks|LangChain|OpenAI)\b/ig;

const COMPLEXITY_SIGNALS = [
  'distributed', 'scalable', 'real-time', 'high-performance', 'microservices',
  'production', 'deployed', 'serverless', 'multi-tenant', 'concurrent', 'parallel',
  'fault-tolerant', 'high-availability', 'end-to-end', 'full-stack', 'machine learning',
  'deep learning', 'neural network', 'api integration', 'database design', 'authentication',
  'authorization', 'caching', 'queue', 'websocket', 'streaming',
];

const BUSINESS_IMPACT_SIGNALS = [
  'users', 'customers', 'revenue', 'reduced', 'improved', 'increased', 'saved',
  'automated', 'replaced', 'migrated', 'launched', 'deployed', 'production',
  'startup', 'enterprise', 'client', 'business', 'commercial', 'market',
];

function parseProjects(lines: string[]): ParsedProject[] {
  const entries: ParsedProject[] = [];
  let current: Partial<ParsedProject> & { descriptionLines: string[] } | null = null;

  const flush = () => {
    if (current?.title) {
      const fullDesc = current.descriptionLines.join(' ');
      const techMatches = [...fullDesc.matchAll(TECH_EXTRACTION_RE)].map((m) => m[0]);
      const technologies = [...new Set(techMatches.map((t) => normalize(t.toLowerCase())).filter(Boolean))];

      const complexitySignals = COMPLEXITY_SIGNALS.filter((s) =>
        fullDesc.toLowerCase().includes(s)
      );
      const businessImpactSignals = BUSINESS_IMPACT_SIGNALS.filter((s) =>
        fullDesc.toLowerCase().includes(s)
      );

      entries.push({
        title: current.title,
        description: fullDesc.trim().slice(0, 500),
        technologies,
        hasGitHubLink: /github\.com/i.test(fullDesc),
        hasDeploymentLink: /https?:\/\/(?!github)/i.test(fullDesc) || /live|deployed|demo|vercel|netlify/i.test(fullDesc),
        hasDocumentation: /readme|documentation|wiki|docs/i.test(fullDesc),
        complexitySignals,
        businessImpactSignals,
      });
      current = null;
    }
  };

  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;

    const isBullet = /^[-•·▪►▸*]\s/.test(l);
    const looksLikeTitle = !isBullet && l.length < 80 && /^[A-Z]/.test(l);

    if (looksLikeTitle && !current) {
      current = { title: l, descriptionLines: [] };
    } else if (looksLikeTitle && current && !isBullet) {
      // Could be a new project
      if ((current.descriptionLines || []).length > 0) {
        flush();
        current = { title: l, descriptionLines: [] };
      } else {
        current.title = l;
      }
    } else if (current) {
      current.descriptionLines.push(isBullet ? l.replace(/^[-•·▪►▸*]\s+/, '') : l);
    }
  }

  flush();
  return entries;
}

// ─── Skills Parsing ───────────────────────────────────────────────────────────

const SKILL_CATEGORY_MAP: Readonly<Record<string, SkillCategory>> = {
  'javascript': 'programming_language', 'python': 'programming_language',
  'java': 'programming_language', 'typescript': 'programming_language',
  'c++': 'programming_language', 'c#': 'programming_language',
  'go': 'programming_language', 'rust': 'programming_language',
  'kotlin': 'programming_language', 'swift': 'programming_language',
  'php': 'programming_language', 'ruby': 'programming_language',
  'scala': 'programming_language', 'r': 'programming_language',
  'matlab': 'programming_language', 'html': 'programming_language',
  'css': 'programming_language', 'sql': 'programming_language',

  'react': 'framework', 'next.js': 'framework', 'vue.js': 'framework',
  'angular': 'framework', 'svelte': 'framework', 'django': 'framework',
  'flask': 'framework', 'fastapi': 'framework', 'express.js': 'framework',
  'spring': 'framework', 'rails': 'framework', 'laravel': 'framework',
  'flutter': 'framework', 'react native': 'framework', '.net': 'framework',

  'tensorflow': 'library', 'pytorch': 'library', 'scikit-learn': 'library',
  'pandas': 'library', 'numpy': 'library', 'keras': 'library',
  'langchain': 'library', 'redux': 'library', 'rxjs': 'library',
  'tailwind css': 'library', 'bootstrap': 'library',

  'aws': 'cloud', 'gcp': 'cloud', 'azure': 'cloud',
  'amazon web services': 'cloud', 'google cloud platform': 'cloud',
  'microsoft azure': 'cloud', 'firebase': 'cloud', 'vercel': 'cloud',
  'netlify': 'cloud', 'heroku': 'cloud', 'digital ocean': 'cloud',

  'postgresql': 'database', 'mysql': 'database', 'mongodb': 'database',
  'redis': 'database', 'sqlite': 'database', 'dynamodb': 'database',
  'cassandra': 'database', 'elasticsearch': 'database', 'neo4j': 'database',
  'firestore': 'database', 'snowflake': 'database', 'databricks': 'database',

  'docker': 'devops', 'kubernetes': 'devops', 'terraform': 'devops',
  'ansible': 'devops', 'jenkins': 'devops', 'github actions': 'devops',
  'gitlab ci': 'devops', 'circleci': 'devops', 'nginx': 'devops',
  'linux': 'devops', 'bash': 'devops', 'git': 'tool', 'ci/cd': 'devops',

  'jest': 'testing', 'playwright': 'testing', 'cypress': 'testing',
  'selenium': 'testing', 'pytest': 'testing', 'junit': 'testing',
  'mocha': 'testing', 'chai': 'testing', 'vitest': 'testing',

  'machine learning': 'ai_ml', 'deep learning': 'ai_ml', 'nlp': 'ai_ml',
  'artificial intelligence': 'ai_ml', 'computer vision': 'ai_ml',
  'generative ai': 'ai_ml', 'large language models': 'ai_ml',
  'reinforcement learning': 'ai_ml', 'mlops': 'ai_ml',

  'apache spark': 'data', 'hadoop': 'data', 'airflow': 'data',
  'dbt': 'data', 'tableau': 'data', 'power bi': 'data', 'kafka': 'data',
  'etl': 'data', 'data warehousing': 'data', 'sql analytics': 'data',

  'oauth 2.0': 'security', 'json web tokens': 'security', 'owasp': 'security',
  'penetration testing': 'security', 'cyber security': 'security',
  'cryptography': 'security', 'ssl/tls': 'security', 'firewalls': 'security',

  'postman': 'tool', 'jira': 'tool', 'confluence': 'tool', 'figma': 'tool',
  'visual studio code': 'tool', 'graphql': 'tool', 'rest': 'tool',
  'grpc': 'tool', 'websockets': 'tool', 'swagger': 'tool',

  'communication': 'soft_skill', 'teamwork': 'soft_skill', 'leadership': 'soft_skill',
  'problem-solving': 'soft_skill', 'analytical thinking': 'soft_skill',
  'time management': 'soft_skill', 'agile': 'soft_skill', 'scrum': 'soft_skill',
};

function parseSkills(lines: string[]): ParsedSkill[] {
  const skillTokens = lines
    .join(' ')
    .split(/[,;|•·▪\n\t]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length < 50);

  const seen = new Set<string>();
  const skills: ParsedSkill[] = [];

  for (const token of skillTokens) {
    const normalized = normalize(token);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);

    const category: SkillCategory = SKILL_CATEGORY_MAP[normalized] || 'other';
    const modernityYear = MODERN_TECH_INDEX[normalized] || null;
    const isModern = modernityYear !== null && modernityYear >= CURRENT_YEAR - 6;

    skills.push({
      name: token,
      normalizedName: normalized,
      category,
      isModern,
      modernityYear,
    });
  }

  return skills;
}

// ─── Achievements Parsing ─────────────────────────────────────────────────────

const ACHIEVEMENT_TYPE_PATTERNS: Array<{ type: AchievementType; patterns: RegExp[] }> = [
  { type: 'hackathon', patterns: [/hackathon/i, /hack\s*[a-z]+/i, /hack fest/i, /code jam/i, /buildathon/i, /hackmit/i, /devpost/i] },
  { type: 'award', patterns: [/award/i, /prize/i, /won\b/i, /winner/i, /1st place/i, /honor/i, /recognition/i] },
  { type: 'research', patterns: [/research/i, /paper/i, /thesis/i, /journal/i, /conference\s+paper/i] },
  { type: 'publication', patterns: [/published/i, /publication/i, /ieee/i, /arxiv/i, /journal/i] },
  { type: 'patent', patterns: [/patent/i] },
  { type: 'competitive_programming', patterns: [/codeforces/i, /leetcode/i, /competitive programming/i, /acm\s*icpc/i, /codechef/i, /rating/i] },
  { type: 'leadership', patterns: [/president/i, /head\s+of/i, /lead\s+of/i, /founder/i, /co-?founder/i, /captain/i] },
  { type: 'open_source', patterns: [/open\s+source/i, /contributor/i, /merged\s+pr/i, /pull\s+request/i] },
  { type: 'certification', patterns: [/certif/i, /certified/i, /aws certified/i, /google certified/i] },
];

function detectAchievementType(text: string): AchievementType {
  for (const { type, patterns } of ACHIEVEMENT_TYPE_PATTERNS) {
    if (patterns.some((p) => p.test(text))) return type;
  }
  return 'other';
}

function parseAchievements(lines: string[]): ParsedAchievement[] {
  return lines
    .map((l) => l.trim().replace(/^[-•·▪►▸*]\s+/, ''))
    .filter((l) => l.length > 5)
    .map((raw) => ({ raw, type: detectAchievementType(raw) }));
}

// ─── Formatting Issue Detection ───────────────────────────────────────────────

function detectFormattingIssues(text: string, lines: string[]): FormattingIssue[] {
  const issues: FormattingIssue[] = [];

  // Table indicators (pipe-separated content)
  const pipeLines = lines.filter((l) => (l.match(/\|/g) || []).length >= 2);
  if (pipeLines.length >= 2) {
    issues.push({
      type: 'table_detected',
      description: 'Resume appears to contain tables, which may not be parsed correctly by ATS systems.',
      severity: 'critical',
    });
  }

  // Image placeholder (alt text, figure tags in extracted text)
  if (/\[image\]|\[photo\]|\[figure\]|<img/i.test(text)) {
    issues.push({
      type: 'image_placeholder',
      description: 'Images or photos detected. ATS systems cannot read images.',
      severity: 'critical',
    });
  }

  // Special / non-standard characters
  const specialCharCount = (text.match(/[^\x00-\x7F]/g) || []).length;
  if (specialCharCount > 10) {
    issues.push({
      type: 'special_characters',
      description: 'Non-ASCII characters detected, which may corrupt ATS parsing.',
      severity: 'warning',
    });
  }

  // Inconsistent date formats (mixing formats)
  const dateFormats = [
    /\b\d{1,2}\/\d{4}\b/.test(text),
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{4}\b/i.test(text),
    /\b\d{4}\b/.test(text),
  ].filter(Boolean).length;
  if (dateFormats >= 3) {
    issues.push({
      type: 'inconsistent_dates',
      description: 'Multiple date formats detected. Use a consistent format throughout.',
      severity: 'warning',
    });
  }

  // Excessive whitespace
  const blankLines = lines.filter((l) => !l.trim()).length;
  if (blankLines > lines.length * 0.4) {
    issues.push({
      type: 'excessive_whitespace',
      description: 'Excessive blank lines detected. Keep resume compact for ATS.',
      severity: 'info',
    });
  }

  return issues;
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

export class ResumeParser {
  parse(rawText: string): StructuredResumeJSON {
    const lines = rawText.split('\n');
    const { sections, bounds } = detectSections(lines);

    const firstFewLines = lines.slice(0, 8);

    const contact = extractContact(rawText, firstFewLines);
    const summary = getSectionLines(bounds, 'summary', lines).join(' ').trim();
    const educationLines = getSectionLines(bounds, 'education', lines);
    const experienceLines = getSectionLines(bounds, 'experience', lines);
    const projectLines = getSectionLines(bounds, 'projects', lines);
    const skillLines = getSectionLines(bounds, 'skills', lines);
    const achievementLines = getSectionLines(bounds, 'achievements', lines);
    const certLines = getSectionLines(bounds, 'certifications', lines);
    const languageLines = getSectionLines(bounds, 'languages', lines);

    const education = parseEducation(educationLines);
    const experience = parseExperience(experienceLines);
    const projects = parseProjects(projectLines);
    const skills = parseSkills(skillLines.length > 0 ? skillLines : [rawText]); // fallback: scan full text
    const achievements = parseAchievements(achievementLines);
    const certifications = certLines
      .map((l) => l.trim().replace(/^[-•·▪►▸*]\s+/, ''))
      .filter((l) => l.length > 2);
    const languages = languageLines
      .join(', ')
      .split(/[,;|•·]/)
      .map((l) => l.trim())
      .filter((l) => l.length > 1 && l.length < 30);

    const totalExperienceMonths = experience.reduce((sum, e) => sum + e.durationMonths, 0);
    const hasQuantifiedAchievements = experience.some((e) => e.quantifiedBullets.length > 0);
    const formattingIssues = detectFormattingIssues(rawText, lines);

    return {
      rawText,
      contact,
      summary,
      education,
      experience,
      projects,
      skills,
      achievements,
      certifications,
      languages,
      sections,
      totalExperienceMonths,
      hasQuantifiedAchievements,
      detectedFormattingIssues: formattingIssues,
      parsedAt: new Date().toISOString(),
    };
  }
}

export const resumeParser = new ResumeParser();
