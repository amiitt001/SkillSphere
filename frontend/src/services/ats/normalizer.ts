/**
 * ATS Normalizer
 *
 * Provides:
 * 1. Canonical synonym resolution (~200 mappings)
 * 2. Jaro-Winkler fuzzy matching (pure, deterministic)
 * 3. Term normalization pipeline
 *
 * RULES:
 * - All functions are pure (no I/O, no randomness)
 * - All maps are static constants — never generated at runtime
 */

// ─── Synonym Map ──────────────────────────────────────────────────────────────
// Maps any known alias → canonical lowercase form
// Sorted alphabetically by alias for maintainability

export const SYNONYM_MAP: Readonly<Record<string, string>> = {
  // JavaScript ecosystem
  'js': 'javascript',
  'es6': 'javascript',
  'es2015': 'javascript',
  'es2020': 'javascript',
  'ecmascript': 'javascript',
  'node': 'node.js',
  'nodejs': 'node.js',
  'node js': 'node.js',
  'expressjs': 'express.js',
  'express js': 'express.js',
  'reactjs': 'react',
  'react js': 'react',
  'react.js': 'react',
  'nextjs': 'next.js',
  'next js': 'next.js',
  'vuejs': 'vue.js',
  'vue js': 'vue.js',
  'angularjs': 'angular',

  // TypeScript
  'ts': 'typescript',

  // Python
  'py': 'python',
  'python3': 'python',
  'python 3': 'python',

  // AI / ML
  'ai': 'artificial intelligence',
  'ml': 'machine learning',
  'dl': 'deep learning',
  'nlp': 'natural language processing',
  'cv': 'computer vision',
  'genai': 'generative ai',
  'gen ai': 'generative ai',
  'llm': 'large language models',
  'llms': 'large language models',
  'rl': 'reinforcement learning',
  'sklearn': 'scikit-learn',
  'sci-kit learn': 'scikit-learn',

  // Cloud
  'aws': 'amazon web services',
  'gcp': 'google cloud platform',
  'azure': 'microsoft azure',
  'ec2': 'aws ec2',
  'aws ec2': 'amazon ec2',
  's3': 'aws s3',
  'lambda': 'aws lambda',
  'gke': 'google kubernetes engine',
  'aks': 'azure kubernetes service',
  'eks': 'amazon elastic kubernetes service',

  // Containers & DevOps
  'k8s': 'kubernetes',
  'containerization': 'docker',
  'containers': 'docker',
  'container orchestration': 'kubernetes',
  'ci': 'continuous integration',
  'cd': 'continuous deployment',
  'ci/cd': 'cicd',
  'cicd': 'continuous integration continuous deployment',
  'gh actions': 'github actions',
  'jenkins pipeline': 'jenkins',
  'iac': 'infrastructure as code',
  'terraform iac': 'terraform',

  // Databases
  'mongo': 'mongodb',
  'mongo db': 'mongodb',
  'postgres': 'postgresql',
  'pg': 'postgresql',
  'mysql db': 'mysql',
  'redis cache': 'redis',
  'dynamo': 'dynamodb',
  'dynamodb': 'amazon dynamodb',
  'firebase db': 'firestore',
  'firestore db': 'firestore',
  'elastic': 'elasticsearch',
  'es': 'elasticsearch',
  'neo4j graph': 'neo4j',
  'cassandra db': 'apache cassandra',

  // Version Control
  'git hub': 'github',
  'git lab': 'gitlab',
  'bit bucket': 'bitbucket',
  'svn': 'subversion',

  // Testing
  'jest testing': 'jest',
  'pytest': 'pytest',
  'unit testing': 'unit tests',
  'integration testing': 'integration tests',
  'tdd': 'test driven development',
  'bdd': 'behavior driven development',

  // Architecture / Patterns
  'microservices architecture': 'microservices',
  'micro services': 'microservices',
  'rest api': 'rest',
  'restful': 'rest',
  'restful api': 'rest',
  'graphql api': 'graphql',
  'grpc': 'grpc',
  'message queue': 'message queuing',
  'mq': 'message queuing',
  'pub sub': 'publish subscribe',
  'event driven': 'event-driven architecture',

  // Data & Analytics
  'pandas lib': 'pandas',
  'numpy lib': 'numpy',
  'spark': 'apache spark',
  'hadoop cluster': 'hadoop',
  'etl pipeline': 'etl',
  'data pipeline': 'etl',
  'bi': 'business intelligence',
  'tableau viz': 'tableau',
  'power bi': 'microsoft power bi',

  // Security
  'oauth': 'oauth 2.0',
  'oauth2': 'oauth 2.0',
  'jwt': 'json web tokens',
  'owasp top 10': 'owasp',
  'penetration testing': 'pentest',
  'pen testing': 'pentest',
  'cybersecurity': 'cyber security',

  // Mobile
  'react native app': 'react native',
  'flutter app': 'flutter',
  'ios dev': 'ios development',
  'android dev': 'android development',
  'swift ui': 'swiftui',

  // Languages
  'c plus plus': 'c++',
  'cplusplus': 'c++',
  'cpp': 'c++',
  'csharp': 'c#',
  'dotnet': '.net',
  '.net core': '.net',
  'golang': 'go',
  'rust lang': 'rust',
  'kotlin android': 'kotlin',
  'scala spark': 'scala',
  'r lang': 'r',
  'r language': 'r',
  'matlab programming': 'matlab',

  // Tools
  'vs code': 'visual studio code',
  'vscode': 'visual studio code',
  'postman api': 'postman',
  'figma design': 'figma',
  'jira board': 'jira',
  'confluence wiki': 'confluence',
  'linux os': 'linux',
  'unix': 'linux',
  'bash scripting': 'bash',
  'shell scripting': 'bash',
  'vim editor': 'vim',

  // Soft Skills
  'comm skills': 'communication',
  'team work': 'teamwork',
  'problem solving': 'problem-solving',
  'critical thinking': 'analytical thinking',
  'time management': 'time management',
};

// ─── Normalization ────────────────────────────────────────────────────────────

/**
 * Normalizes a single term: lowercases, trims, resolves synonyms.
 * Pure function — always returns the same output for the same input.
 */
export function normalize(term: string): string {
  const cleaned = term.toLowerCase().trim().replace(/\s+/g, ' ');
  return SYNONYM_MAP[cleaned] ?? cleaned;
}

/**
 * Normalizes an array of terms, deduplicating after normalization.
 */
export function normalizeAll(terms: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const term of terms) {
    const n = normalize(term);
    if (n && !seen.has(n)) {
      seen.add(n);
      result.push(n);
    }
  }
  return result;
}

// ─── Jaro-Winkler Fuzzy Matching ─────────────────────────────────────────────

/**
 * Computes Jaro similarity between two strings.
 * Returns 0–1 (1 = identical).
 * Pure, deterministic, no library required.
 */
function jaro(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;

  const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array<boolean>(len1).fill(false);
  const s2Matches = new Array<boolean>(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, len2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (
    (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3
  );
}

/**
 * Computes Jaro-Winkler similarity, giving bonus weight to common prefixes.
 * Returns 0–1 (1 = identical).
 */
export function jaroWinkler(s1: string, s2: string): number {
  const jaroSim = jaro(s1, s2);
  if (jaroSim < 0.7) return jaroSim;

  let prefixLength = 0;
  const maxPrefix = Math.min(4, Math.min(s1.length, s2.length));
  for (let i = 0; i < maxPrefix; i++) {
    if (s1[i] === s2[i]) prefixLength++;
    else break;
  }

  return jaroSim + prefixLength * 0.1 * (1 - jaroSim);
}

/**
 * Returns true if `term` is "similar enough" to any item in `list`.
 * Both sides are normalized before comparison.
 *
 * @param threshold - Minimum Jaro-Winkler similarity (default 0.85)
 */
export function fuzzyIncludes(
  term: string,
  list: string[],
  threshold = 0.85
): boolean {
  const normalizedTerm = normalize(term);
  for (const item of list) {
    const normalizedItem = normalize(item);
    if (normalizedTerm === normalizedItem) return true;
    if (jaroWinkler(normalizedTerm, normalizedItem) >= threshold) return true;
  }
  return false;
}

/**
 * Returns all items from `list` that fuzzy-match `term`.
 */
export function fuzzyFind(
  term: string,
  list: string[],
  threshold = 0.85
): string[] {
  const normalizedTerm = normalize(term);
  return list.filter((item) => {
    const normalizedItem = normalize(item);
    return (
      normalizedTerm === normalizedItem ||
      jaroWinkler(normalizedTerm, normalizedItem) >= threshold
    );
  });
}

/**
 * Computes intersection of two skill lists using fuzzy matching.
 * Returns { matched, missing }.
 */
export function fuzzyIntersect(
  sourceTerms: string[],
  targetTerms: string[],
  threshold = 0.85
): { matched: string[]; missing: string[] } {
  const normalizedSource = normalizeAll(sourceTerms);
  const matched: string[] = [];
  const missing: string[] = [];

  for (const target of targetTerms) {
    if (fuzzyIncludes(target, normalizedSource, threshold)) {
      matched.push(target);
    } else {
      missing.push(target);
    }
  }

  return { matched, missing };
}
