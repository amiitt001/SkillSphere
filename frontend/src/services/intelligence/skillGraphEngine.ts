/**
 * Skill Graph Engine
 * Builds a structured SkillGraph from a UnifiedProfile.
 * Pure function — no AI required, no external calls.
 */

import type {
  UnifiedProfile,
  SkillGraph,
  SkillNode,
  SkillCategory,
} from '@/types';

// ── Skill category classification maps ───────────────────────────────────────

const LANGUAGE_KEYWORDS = new Set([
  'python', 'javascript', 'typescript', 'java', 'c++', 'c', 'cpp', 'go', 'golang',
  'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'dart', 'elixir',
  'haskell', 'lua', 'perl', 'shell', 'bash', 'powershell', 'matlab', 'julia',
]);

const FRAMEWORK_KEYWORDS = new Set([
  'react', 'nextjs', 'next.js', 'vue', 'angular', 'svelte', 'nuxt', 'remix',
  'gatsby', 'express', 'fastapi', 'django', 'flask', 'spring', 'rails', 'laravel',
  'nestjs', 'gin', 'fiber', 'echo', 'actix', 'axum', 'fastify',
]);

const BACKEND_KEYWORDS = new Set([
  'nodejs', 'node.js', 'deno', 'bun', 'rest-api', 'graphql', 'grpc', 'websocket',
  'microservices', 'api', 'backend', 'server', 'middleware', 'authentication', 'oauth',
  'jwt', 'rest', 'soap', 'message-queue', 'rabbitmq', 'kafka', 'celery',
]);

const FRONTEND_KEYWORDS = new Set([
  'html', 'css', 'tailwindcss', 'tailwind', 'bootstrap', 'material-ui', 'chakra-ui',
  'sass', 'scss', 'styled-components', 'framer-motion', 'webpack', 'vite', 'parcel',
  'frontend', 'ui', 'ux', 'responsive', 'accessibility', 'a11y', 'pwa',
]);

const DATABASE_KEYWORDS = new Set([
  'mongodb', 'postgresql', 'mysql', 'sqlite', 'redis', 'firebase', 'supabase',
  'cassandra', 'dynamodb', 'elasticsearch', 'neo4j', 'oracle', 'mssql', 'prisma',
  'sequelize', 'typeorm', 'mongoose', 'database', 'sql', 'nosql',
]);

const CLOUD_KEYWORDS = new Set([
  'aws', 'gcp', 'azure', 'google-cloud', 'vercel', 'netlify', 'heroku',
  'digitalocean', 'cloudflare', 'lambda', 'serverless', 'ec2', 's3', 'cloud',
]);

const DEVOPS_KEYWORDS = new Set([
  'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins', 'github-actions',
  'ci-cd', 'devops', 'helm', 'prometheus', 'grafana', 'nginx', 'traefik', 'linux',
  'bash', 'gitlab-ci', 'deployment', 'infrastructure',
]);

const AI_ML_KEYWORDS = new Set([
  'tensorflow', 'pytorch', 'scikit-learn', 'keras', 'pandas', 'numpy', 'matplotlib',
  'seaborn', 'huggingface', 'transformers', 'langchain', 'openai', 'llm', 'nlp',
  'computer-vision', 'deep-learning', 'machine-learning', 'ai', 'ml', 'neural-network',
  'reinforcement-learning', 'data-science', 'jupyter',
]);

const DSA_KEYWORDS = new Set([
  'algorithms', 'data-structures', 'leetcode', 'competitive-programming', 'dsa',
  'dynamic-programming', 'dp', 'graphs', 'trees', 'sorting', 'searching',
  'linked-list', 'stack', 'queue', 'heap', 'hash-table', 'binary-search',
]);

const SYSTEM_DESIGN_KEYWORDS = new Set([
  'system-design', 'architecture', 'scalability', 'distributed', 'load-balancer',
  'caching', 'cdn', 'rate-limiting', 'sharding', 'replication', 'cap-theorem',
  'event-driven', 'design-patterns', 'solid', 'clean-architecture',
]);

const TESTING_KEYWORDS = new Set([
  'testing', 'unit-test', 'jest', 'pytest', 'mocha', 'cypress', 'playwright',
  'selenium', 'tdd', 'bdd', 'integration-testing', 'e2e', 'vitest',
]);

const SECURITY_KEYWORDS = new Set([
  'security', 'cybersecurity', 'owasp', 'ssl', 'tls', 'encryption', 'hashing',
  'xss', 'csrf', 'sql-injection', 'penetration-testing', 'vulnerability',
]);

// Ordered for priority matching (most specific first)
const CATEGORY_MAP: Array<{ category: SkillCategory; keywords: Set<string> }> = [
  { category: 'AI / ML', keywords: AI_ML_KEYWORDS },
  { category: 'DevOps', keywords: DEVOPS_KEYWORDS },
  { category: 'Cloud', keywords: CLOUD_KEYWORDS },
  { category: 'Security', keywords: SECURITY_KEYWORDS },
  { category: 'Testing', keywords: TESTING_KEYWORDS },
  { category: 'System Design', keywords: SYSTEM_DESIGN_KEYWORDS },
  { category: 'Data Structures', keywords: DSA_KEYWORDS },
  { category: 'Databases', keywords: DATABASE_KEYWORDS },
  { category: 'Backend', keywords: BACKEND_KEYWORDS },
  { category: 'Frontend', keywords: FRONTEND_KEYWORDS },
  { category: 'Frameworks', keywords: FRAMEWORK_KEYWORDS },
  { category: 'Programming Languages', keywords: LANGUAGE_KEYWORDS },
];

function classifySkill(skill: string): SkillCategory {
  const lower = skill.toLowerCase().replace(/[\s.]/g, '-');
  for (const { category, keywords } of CATEGORY_MAP) {
    if (keywords.has(lower) || keywords.has(lower.replace(/-/g, ''))) {
      return category;
    }
  }
  return 'Soft Skills'; // Default fallback
}

function confidenceFromSources(sources: string[]): number {
  let score = 0;
  for (const src of sources) {
    if (src.startsWith('github:stars:')) {
      const stars = parseInt(src.split(':')[2] || '0', 10);
      score += Math.min(30, stars * 2);
    } else if (src === 'github:topics') score += 25;
    else if (src === 'github:language') score += 40;
    else if (src === 'leetcode:hard') score += 50;
    else if (src === 'leetcode:medium') score += 30;
    else if (src === 'leetcode:easy') score += 15;
    else if (src === 'codeforces:rating') score += 35;
    else if (src === 'linkedin:skills') score += 20;
    else if (src === 'linkedin:role') score += 25;
  }
  return Math.min(100, score);
}

function toExperienceLevel(confidence: number): SkillNode['experienceLevel'] {
  if (confidence >= 75) return 'expert';
  if (confidence >= 50) return 'advanced';
  if (confidence >= 25) return 'intermediate';
  return 'beginner';
}

/**
 * Builds a SkillGraph from a UnifiedProfile.
 * Deterministic — no AI calls required.
 */
export function buildSkillGraph(profile: UnifiedProfile): SkillGraph {
  const nodeMap = new Map<string, SkillNode>();

  const addSkill = (name: string, sources: string[]) => {
    const key = name.toLowerCase();
    const existing = nodeMap.get(key);
    if (existing) {
      existing.source = Array.from(new Set([...existing.source, ...sources]));
      existing.confidence = Math.min(100, existing.confidence + confidenceFromSources(sources) * 0.5);
    } else {
      const confidence = confidenceFromSources(sources);
      nodeMap.set(key, {
        name,
        category: classifySkill(name),
        confidence,
        source: sources,
        lastUpdated: new Date().toISOString(),
        experienceLevel: toExperienceLevel(confidence),
      });
    }
  };

  // ── Extract from GitHub ──────────────────────────────────────────────────
  if (profile.github) {
    // Programming languages from repo distribution
    for (const lang of profile.github.topLanguages) {
      const confidence = Math.round(lang.percentage * 0.7); // max 70 from language usage
      addSkill(lang.name, [`github:language`, lang.percentage >= 30 ? `github:stars:50` : `github:language`]);
    }

    // Topics from repositories
    const topicCounts = new Map<string, number>();
    for (const repo of profile.github.repos) {
      for (const topic of repo.topics) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1 + (repo.stars || 0));
      }
    }
    for (const [topic, weight] of topicCounts.entries()) {
      const stars = Math.min(50, weight);
      addSkill(topic, ['github:topics', `github:stars:${stars}`]);
    }
  }

  // ── Extract from LeetCode ────────────────────────────────────────────────
  if (profile.leetcode) {
    const { hardSolved, mediumSolved, easySolved } = profile.leetcode;
    if (hardSolved + mediumSolved + easySolved > 0) {
      addSkill('Data Structures', [
        ...(hardSolved > 0 ? ['leetcode:hard'] : []),
        ...(mediumSolved > 0 ? ['leetcode:medium'] : []),
        ...(easySolved > 0 ? ['leetcode:easy'] : []),
      ]);
      addSkill('Algorithms', [
        ...(hardSolved > 0 ? ['leetcode:hard'] : []),
        ...(mediumSolved > 0 ? ['leetcode:medium'] : []),
      ]);
      if (hardSolved >= 10) addSkill('Dynamic Programming', ['leetcode:hard']);
      if (mediumSolved >= 30) addSkill('Binary Search', ['leetcode:medium']);
      if (mediumSolved >= 20) addSkill('Graph Algorithms', ['leetcode:medium']);
    }
  }

  // ── Extract from Codeforces ──────────────────────────────────────────────
  if (profile.codeforces) {
    const { rating } = profile.codeforces;
    addSkill('Competitive Programming', ['codeforces:rating']);
    addSkill('Algorithms', ['codeforces:rating']);
    if (rating >= 1600) addSkill('Dynamic Programming', ['codeforces:rating']);
    if (rating >= 1900) addSkill('Graph Algorithms', ['codeforces:rating']);
    if (rating >= 2100) addSkill('Number Theory', ['codeforces:rating']);
  }

  // ── Extract from LinkedIn ────────────────────────────────────────────────
  if (profile.linkedin) {
    for (const skill of profile.linkedin.skills) {
      addSkill(skill, ['linkedin:skills']);
    }
    if (profile.linkedin.currentRole) {
      // Role-based inference
      const role = profile.linkedin.currentRole.toLowerCase();
      if (role.includes('backend')) addSkill('Backend Development', ['linkedin:role']);
      if (role.includes('frontend') || role.includes('ui')) addSkill('Frontend Development', ['linkedin:role']);
      if (role.includes('full stack') || role.includes('fullstack')) {
        addSkill('Backend Development', ['linkedin:role']);
        addSkill('Frontend Development', ['linkedin:role']);
      }
      if (role.includes('devops') || role.includes('sre')) addSkill('DevOps', ['linkedin:role']);
      if (role.includes('data') || role.includes('ml') || role.includes('ai')) {
        addSkill('Machine Learning', ['linkedin:role']);
      }
    }
    // Communication from LinkedIn presence
    addSkill('Communication', ['linkedin:skills']);
    if (profile.linkedin.headline) addSkill('Professional Networking', ['linkedin:role']);
  }

  const nodes = Array.from(nodeMap.values());

  // ── Compute category scores ──────────────────────────────────────────────
  const categories: SkillCategory[] = [
    'Programming Languages', 'Frameworks', 'Backend', 'Frontend', 'Databases',
    'Cloud', 'DevOps', 'AI / ML', 'Data Structures', 'Algorithms',
    'System Design', 'Testing', 'Security', 'Soft Skills',
  ];

  const categoryScores = {} as Record<SkillCategory, number>;
  for (const cat of categories) {
    const catNodes = nodes.filter((n) => n.category === cat);
    categoryScores[cat] = catNodes.length === 0
      ? 0
      : Math.round(catNodes.reduce((sum, n) => sum + n.confidence, 0) / catNodes.length);
  }

  // Dominant category
  const dominantCategory = (Object.entries(categoryScores) as [SkillCategory, number][])
    .reduce((best, cur) => (cur[1] > best[1] ? cur : best), ['Soft Skills', 0] as [SkillCategory, number])[0];

  return {
    uid: profile.uid,
    nodes,
    categoryScores,
    totalSkills: nodes.length,
    dominantCategory,
    builtAt: new Date().toISOString(),
  };
}
