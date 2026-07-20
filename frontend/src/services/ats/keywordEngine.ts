/**
 * ATS Keyword Engine
 *
 * Responsibilities:
 * 1. Extract meaningful keywords from text (stop-word filtered, NLP-lite)
 * 2. Score keyword coverage between resume and job description
 * 3. Identify priority keywords (appearing in title/heading or repeated)
 *
 * All functions are pure and deterministic — no AI, no I/O.
 */

import { normalize, normalizeAll, fuzzyIncludes } from './normalizer';
import type { KeywordWithWeight } from './types';

// ─── Stop Words ───────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'not',
  'no', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every',
  'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such', 'than',
  'too', 'very', 'just', 'about', 'above', 'after', 'before', 'between',
  'into', 'through', 'during', 'including', 'until', 'against', 'among',
  'throughout', 'based', 'using', 'without', 'across', 'behind', 'beyond',
  'plus', 'except', 'up', 'out', 'around', 'down', 'off', 'over', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
  'who', 'which', 'what', 'this', 'that', 'these', 'those', 'i', 'me',
  'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
  'he', 'she', 'it', 'they', 'them', 'their', 'its', 'his', 'her',
  'how', 'why', 'while', 'although', 'though', 'if', 'whether', 'also',
  'however', 'therefore', 'thus', 'hence', 'because', 'since', 'unless',
  'role', 'position', 'job', 'work', 'team', 'company', 'organization',
  'looking', 'seeking', 'candidate', 'applicant', 'opportunity', 'strong',
  'excellent', 'good', 'great', 'preferred', 'required', 'must', 'ability',
  'experience', 'knowledge', 'understanding', 'skills', 'skill', 'year',
  'years', 'month', 'months', 'new', 'current', 'well', 'able', 'highly',
  'including', 'responsible', 'responsibilities', 'working', 'related',
  'within', 'across', 'various', 'multiple', 'different', 'minimum',
  'least', 'ideally', 'ideally', 'familiarity', 'familiar', 'plus',
  'bonus', 'nice', 'have',
]);

// ─── Technical Term Patterns ──────────────────────────────────────────────────
// These patterns identify tokens that are likely technical keywords even if short

const ALWAYS_KEEP_PATTERNS = [
  /^[a-z]{1,4}[\.\+\#]?$/,    // c++, c#, go, r, sql, etc.
  /\d/,                         // contains a digit: ec2, s3, node18
  /[.\-+#]/,                    // contains separator: node.js, c#, c++
  /^[A-Z]{2,6}$/,               // Acronyms: AWS, GCP, SQL, REST, JSON
];

function isAlwaysKeep(token: string): boolean {
  // Check raw token for acronyms
  if (ALWAYS_KEEP_PATTERNS[2].test(token)) return true;
  const lower = token.toLowerCase();
  return (
    ALWAYS_KEEP_PATTERNS[0].test(lower) ||
    ALWAYS_KEEP_PATTERNS[1].test(lower) ||
    ALWAYS_KEEP_PATTERNS[3]?.test(lower) // optional
  );
}

// ─── Tokenization ─────────────────────────────────────────────────────────────

/**
 * Tokenizes raw text into candidate keyword tokens.
 * Handles: slash-separated (react/next.js), comma-separated, bullet points.
 */
function tokenize(text: string): string[] {
  return text
    .replace(/[\r\n]+/g, ' ')
    .replace(/[,;•·▪●◦►▸→]/g, ' ')
    .replace(/\(|\)/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^[^\w#.+]+|[^\w#.+]+$/g, '').trim())
    .filter((t) => t.length > 0);
}

/**
 * Extracts single and bigram keyword candidates from text.
 */
function extractCandidates(text: string): string[] {
  const tokens = tokenize(text);
  const candidates: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (!tok) continue;
    candidates.push(tok);

    // Bigrams — look one ahead
    if (i + 1 < tokens.length) {
      const bigram = `${tok} ${tokens[i + 1]}`;
      candidates.push(bigram);
    }

    // Trigrams for common three-word tech names
    if (i + 2 < tokens.length) {
      const trigram = `${tok} ${tokens[i + 1]} ${tokens[i + 2]}`;
      candidates.push(trigram);
    }
  }

  return candidates;
}

// ─── Keyword Extraction ───────────────────────────────────────────────────────

/**
 * Extracts and deduplicates meaningful keywords from text.
 * Returns normalized keywords, filtered for relevance.
 */
export function extractKeywords(text: string): string[] {
  const candidates = extractCandidates(text);
  const seen = new Set<string>();
  const keywords: string[] = [];

  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    const tokens = lower.split(/\s+/);

    // Skip if all tokens are stop words (unless a keep pattern matches)
    const allStop = tokens.every((t) => STOP_WORDS.has(t));
    const hasKeep = tokens.some((t) => isAlwaysKeep(t));

    if (allStop && !hasKeep) continue;

    // Skip very short single tokens (less than 2 chars) unless always-keep
    if (tokens.length === 1 && lower.length < 2 && !hasKeep) continue;

    const normalized = normalize(candidate);
    if (!seen.has(normalized) && normalized.length >= 2) {
      seen.add(normalized);
      keywords.push(normalized);
    }
  }

  return keywords;
}

// ─── Priority Keyword Detection ───────────────────────────────────────────────

const HEADING_PATTERNS = [
  /^#+\s*/,               // Markdown headings
  /^[A-Z][A-Z\s]{3,}:/,  // ALL CAPS HEADING:
  /\*\*(.*?)\*\*/,        // **Bold** in markdown
];

function isInHeading(keyword: string, text: string): boolean {
  const lines = text.split('\n');
  for (const line of lines) {
    const isHeading = HEADING_PATTERNS.some((p) => p.test(line.trim()));
    if (isHeading && line.toLowerCase().includes(keyword.toLowerCase())) {
      return true;
    }
  }
  return false;
}

function countOccurrences(keyword: string, text: string): number {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
  return (text.match(regex) || []).length;
}

/**
 * Extracts keywords from a job description with weights.
 * Weight rules:
 *   3 = in title/heading OR appears 3+ times
 *   2 = appears 2 times
 *   1 = appears once
 */
export function extractJobKeywords(
  jobText: string,
  roleTitle: string = ''
): KeywordWithWeight[] {
  const allKeywords = extractKeywords(jobText);
  const titleKeywords = normalizeAll(extractKeywords(roleTitle));

  const result: KeywordWithWeight[] = [];
  const seen = new Set<string>();

  for (const keyword of allKeywords) {
    if (seen.has(keyword)) continue;
    seen.add(keyword);

    const occurrences = countOccurrences(keyword, jobText);
    const inTitle = titleKeywords.includes(keyword);
    const inHeading = isInHeading(keyword, jobText);

    let weight = 1;
    if (inTitle || inHeading || occurrences >= 3) weight = 3;
    else if (occurrences >= 2) weight = 2;

    result.push({
      keyword,
      normalizedKeyword: keyword,
      weight,
      occurrences,
    });
  }

  // Sort by weight desc, then alpha
  return result.sort((a, b) => b.weight - a.weight || a.keyword.localeCompare(b.keyword));
}

// ─── Coverage Scoring ─────────────────────────────────────────────────────────

export interface KeywordCoverageResult {
  score: number;            // 0–100
  matched: string[];
  missing: string[];
  rareMatched: string[];    // Low-weight keywords also matched
  priorityMatched: string[]; // High-weight keywords matched
  priorityMissing: string[]; // High-weight keywords missing
  coveragePercent: number;
}

/**
 * Scores how well resumeKeywords cover jobKeywords.
 * Priority keywords (weight >= 3) count double.
 */
export function scoreKeywordCoverage(
  resumeKeywords: string[],
  jobKeywords: KeywordWithWeight[]
): KeywordCoverageResult {
  if (jobKeywords.length === 0) {
    return {
      score: 50,
      matched: [],
      missing: [],
      rareMatched: [],
      priorityMatched: [],
      priorityMissing: [],
      coveragePercent: 0,
    };
  }

  const normalizedResume = normalizeAll(resumeKeywords);

  const matched: string[] = [];
  const missing: string[] = [];
  const rareMatched: string[] = [];
  const priorityMatched: string[] = [];
  const priorityMissing: string[] = [];

  let earnedWeight = 0;
  let totalWeight = 0;

  for (const kw of jobKeywords) {
    const w = kw.weight;
    totalWeight += w;

    const isMatch = fuzzyIncludes(kw.keyword, normalizedResume, 0.88);
    if (isMatch) {
      matched.push(kw.keyword);
      earnedWeight += w;
      if (w <= 1) rareMatched.push(kw.keyword);
      if (w >= 3) priorityMatched.push(kw.keyword);
    } else {
      missing.push(kw.keyword);
      if (w >= 3) priorityMissing.push(kw.keyword);
    }
  }

  const coveragePercent =
    totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  // Score: weighted coverage, with a floor of 5 to avoid harsh zero scores
  const score = Math.max(5, Math.min(100, coveragePercent));

  return {
    score,
    matched,
    missing,
    rareMatched,
    priorityMatched,
    priorityMissing,
    coveragePercent,
  };
}

// ─── Resume Keyword Density ───────────────────────────────────────────────────

/**
 * Returns keyword density metrics for a resume text.
 * Used by writing quality scorer.
 */
export function analyzeKeywordDensity(text: string): {
  keywords: string[];
  repetitionRatio: number;   // 0–1 (higher = more repetition, worse)
  uniqueRatio: number;       // 0–1 (higher = more diverse vocabulary)
} {
  const tokens = tokenize(text)
    .map((t) => t.toLowerCase())
    .filter((t) => !STOP_WORDS.has(t) && t.length > 2);

  if (tokens.length === 0) {
    return { keywords: [], repetitionRatio: 0, uniqueRatio: 1 };
  }

  const freqMap = new Map<string, number>();
  for (const t of tokens) {
    freqMap.set(t, (freqMap.get(t) || 0) + 1);
  }

  const keywords = Array.from(freqMap.keys());
  const repeated = Array.from(freqMap.values()).filter((v) => v > 2).length;
  const repetitionRatio = repeated / tokens.length;
  const uniqueRatio = freqMap.size / tokens.length;

  return { keywords, repetitionRatio, uniqueRatio };
}
