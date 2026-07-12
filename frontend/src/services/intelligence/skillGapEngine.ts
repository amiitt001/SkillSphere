/**
 * Skill Gap Engine
 * Compares a user's SkillGraph against hardcoded career archetypes.
 * Deterministic — no AI required.
 */

import type {
  SkillGraph,
  SkillGapResult,
  SkillGapItem,
  SkillCategory,
  CareerArchetype,
} from '@/types';

// ── Career Requirement Catalog ───────────────────────────────────────────────

interface CareerRequirement {
  skill: string;
  category: SkillCategory;
  requiredProficiency: number;   // 0–100
  priorityScore: number;         // 0–100 — how critical for this career
  reason: string;
}

const CAREER_CATALOG: Record<CareerArchetype, CareerRequirement[]> = {
  'Software Engineer': [
    { skill: 'Data Structures', category: 'Data Structures', requiredProficiency: 70, priorityScore: 90, reason: 'Core to SWE interviews at all major companies' },
    { skill: 'Algorithms', category: 'Algorithms', requiredProficiency: 70, priorityScore: 90, reason: 'Required for technical interviews and problem solving' },
    { skill: 'System Design', category: 'System Design', requiredProficiency: 60, priorityScore: 80, reason: 'Essential for SDE-2+ roles' },
    { skill: 'Python', category: 'Programming Languages', requiredProficiency: 65, priorityScore: 70, reason: 'Most versatile scripting and backend language' },
    { skill: 'JavaScript', category: 'Programming Languages', requiredProficiency: 60, priorityScore: 65, reason: 'Ubiquitous in web development' },
    { skill: 'Git', category: 'DevOps', requiredProficiency: 70, priorityScore: 75, reason: 'Version control is non-negotiable' },
    { skill: 'Testing', category: 'Testing', requiredProficiency: 55, priorityScore: 60, reason: 'Production code must be tested' },
    { skill: 'Database', category: 'Databases', requiredProficiency: 50, priorityScore: 60, reason: 'Data persistence is universal' },
    { skill: 'Dynamic Programming', category: 'Algorithms', requiredProficiency: 55, priorityScore: 70, reason: 'High-frequency topic in FAANG interviews' },
    { skill: 'Communication', category: 'Soft Skills', requiredProficiency: 60, priorityScore: 55, reason: 'Cross-team collaboration' },
  ],
  'Backend Engineer': [
    { skill: 'Data Structures', category: 'Data Structures', requiredProficiency: 65, priorityScore: 80, reason: 'Basis of all backend algorithm work' },
    { skill: 'System Design', category: 'System Design', requiredProficiency: 80, priorityScore: 95, reason: 'Backend engineers own system architecture decisions' },
    { skill: 'Databases', category: 'Databases', requiredProficiency: 80, priorityScore: 90, reason: 'Data modeling and query optimization are daily work' },
    { skill: 'REST API', category: 'Backend', requiredProficiency: 80, priorityScore: 90, reason: 'API design is the core deliverable' },
    { skill: 'Caching', category: 'System Design', requiredProficiency: 65, priorityScore: 75, reason: 'Redis/Memcached critical for scale' },
    { skill: 'Docker', category: 'DevOps', requiredProficiency: 65, priorityScore: 70, reason: 'Containerization is standard' },
    { skill: 'Python', category: 'Programming Languages', requiredProficiency: 75, priorityScore: 75, reason: 'Primary backend language in many stacks' },
    { skill: 'Node.js', category: 'Backend', requiredProficiency: 65, priorityScore: 70, reason: 'Dominant JavaScript backend runtime' },
    { skill: 'Microservices', category: 'Backend', requiredProficiency: 55, priorityScore: 65, reason: 'Modern backend architecture pattern' },
    { skill: 'Message Queue', category: 'Backend', requiredProficiency: 50, priorityScore: 60, reason: 'Async processing with Kafka/RabbitMQ' },
    { skill: 'Authentication', category: 'Backend', requiredProficiency: 70, priorityScore: 75, reason: 'OAuth, JWT must be well understood' },
    { skill: 'Testing', category: 'Testing', requiredProficiency: 70, priorityScore: 70, reason: 'Backend logic must have comprehensive test coverage' },
  ],
  'Frontend Engineer': [
    { skill: 'JavaScript', category: 'Programming Languages', requiredProficiency: 90, priorityScore: 95, reason: 'The language of the browser' },
    { skill: 'TypeScript', category: 'Programming Languages', requiredProficiency: 75, priorityScore: 85, reason: 'Industry standard for large codebases' },
    { skill: 'React', category: 'Frameworks', requiredProficiency: 80, priorityScore: 90, reason: 'Dominant frontend framework at most companies' },
    { skill: 'HTML', category: 'Frontend', requiredProficiency: 80, priorityScore: 80, reason: 'Semantic HTML is foundational' },
    { skill: 'CSS', category: 'Frontend', requiredProficiency: 75, priorityScore: 75, reason: 'Layout, animations, responsive design' },
    { skill: 'Accessibility', category: 'Frontend', requiredProficiency: 60, priorityScore: 65, reason: 'A11y is required in enterprise products' },
    { skill: 'Testing', category: 'Testing', requiredProficiency: 65, priorityScore: 70, reason: 'Jest, Cypress for component and E2E testing' },
    { skill: 'Performance Optimization', category: 'Frontend', requiredProficiency: 55, priorityScore: 65, reason: 'LCP/INP Core Web Vitals matter' },
    { skill: 'Webpack', category: 'Frameworks', requiredProficiency: 50, priorityScore: 55, reason: 'Build tooling knowledge' },
    { skill: 'Communication', category: 'Soft Skills', requiredProficiency: 65, priorityScore: 60, reason: 'Close collaboration with designers and PMs' },
  ],
  'Full Stack Engineer': [
    { skill: 'JavaScript', category: 'Programming Languages', requiredProficiency: 85, priorityScore: 90, reason: 'Used across both layers' },
    { skill: 'TypeScript', category: 'Programming Languages', requiredProficiency: 70, priorityScore: 80, reason: 'Standard for full stack TypeScript monorepos' },
    { skill: 'React', category: 'Frameworks', requiredProficiency: 75, priorityScore: 85, reason: 'Dominant frontend framework' },
    { skill: 'Node.js', category: 'Backend', requiredProficiency: 75, priorityScore: 85, reason: 'The JavaScript backend runtime' },
    { skill: 'Databases', category: 'Databases', requiredProficiency: 70, priorityScore: 80, reason: 'Both SQL and NoSQL required' },
    { skill: 'REST API', category: 'Backend', requiredProficiency: 75, priorityScore: 80, reason: 'Building and consuming APIs' },
    { skill: 'System Design', category: 'System Design', requiredProficiency: 55, priorityScore: 65, reason: 'Full stack engineers own the whole picture' },
    { skill: 'Docker', category: 'DevOps', requiredProficiency: 55, priorityScore: 60, reason: 'Deployment and local dev setup' },
    { skill: 'Testing', category: 'Testing', requiredProficiency: 60, priorityScore: 65, reason: 'Full stack testing requires both unit and E2E' },
    { skill: 'CSS', category: 'Frontend', requiredProficiency: 65, priorityScore: 65, reason: 'UI ownership requires styling proficiency' },
  ],
  'AI / ML Engineer': [
    { skill: 'Python', category: 'Programming Languages', requiredProficiency: 90, priorityScore: 95, reason: 'The primary language of the ML ecosystem' },
    { skill: 'Machine Learning', category: 'AI / ML', requiredProficiency: 80, priorityScore: 95, reason: 'Core domain knowledge' },
    { skill: 'TensorFlow', category: 'AI / ML', requiredProficiency: 65, priorityScore: 80, reason: 'Dominant deep learning framework' },
    { skill: 'PyTorch', category: 'AI / ML', requiredProficiency: 70, priorityScore: 85, reason: 'Preferred framework for research and production' },
    { skill: 'Data Structures', category: 'Data Structures', requiredProficiency: 65, priorityScore: 75, reason: 'Required for efficient algorithm implementation' },
    { skill: 'Algorithms', category: 'Algorithms', requiredProficiency: 70, priorityScore: 80, reason: 'ML algorithms are mathematical at their core' },
    { skill: 'Statistics', category: 'AI / ML', requiredProficiency: 70, priorityScore: 85, reason: 'Statistical foundations underpin all ML models' },
    { skill: 'Pandas', category: 'AI / ML', requiredProficiency: 75, priorityScore: 80, reason: 'Essential for data manipulation and EDA' },
    { skill: 'Cloud', category: 'Cloud', requiredProficiency: 55, priorityScore: 65, reason: 'Model deployment on GCP/AWS/Azure Sagemaker' },
    { skill: 'MLOps', category: 'DevOps', requiredProficiency: 50, priorityScore: 65, reason: 'Production ML requires CI/CD for models' },
    { skill: 'SQL', category: 'Databases', requiredProficiency: 60, priorityScore: 65, reason: 'Data extraction from databases for model training' },
  ],
  'Data Scientist': [
    { skill: 'Python', category: 'Programming Languages', requiredProficiency: 85, priorityScore: 90, reason: 'Primary language for data analysis' },
    { skill: 'Statistics', category: 'AI / ML', requiredProficiency: 85, priorityScore: 95, reason: 'Statistical inference is the core skill' },
    { skill: 'SQL', category: 'Databases', requiredProficiency: 80, priorityScore: 90, reason: 'Data extraction and transformation' },
    { skill: 'Pandas', category: 'AI / ML', requiredProficiency: 80, priorityScore: 85, reason: 'Data manipulation and analysis' },
    { skill: 'Machine Learning', category: 'AI / ML', requiredProficiency: 70, priorityScore: 80, reason: 'Predictive modeling skills' },
    { skill: 'Data Visualization', category: 'AI / ML', requiredProficiency: 70, priorityScore: 75, reason: 'Tableau, Power BI, matplotlib for insights' },
    { skill: 'Algorithms', category: 'Algorithms', requiredProficiency: 55, priorityScore: 65, reason: 'Algorithm analysis for model selection' },
    { skill: 'Communication', category: 'Soft Skills', requiredProficiency: 80, priorityScore: 80, reason: 'Presenting findings to non-technical stakeholders' },
    { skill: 'Cloud', category: 'Cloud', requiredProficiency: 50, priorityScore: 55, reason: 'BigQuery, Redshift for large datasets' },
  ],
  'DevOps Engineer': [
    { skill: 'Linux', category: 'DevOps', requiredProficiency: 85, priorityScore: 95, reason: 'All server infrastructure runs on Linux' },
    { skill: 'Docker', category: 'DevOps', requiredProficiency: 85, priorityScore: 90, reason: 'Containerization is the foundation of modern DevOps' },
    { skill: 'Kubernetes', category: 'DevOps', requiredProficiency: 80, priorityScore: 90, reason: 'Container orchestration at scale' },
    { skill: 'Cloud', category: 'Cloud', requiredProficiency: 80, priorityScore: 90, reason: 'AWS/GCP/Azure are the deployment target' },
    { skill: 'Terraform', category: 'DevOps', requiredProficiency: 70, priorityScore: 80, reason: 'Infrastructure as Code is standard' },
    { skill: 'CI/CD', category: 'DevOps', requiredProficiency: 80, priorityScore: 85, reason: 'Continuous delivery pipelines are the core output' },
    { skill: 'Monitoring', category: 'DevOps', requiredProficiency: 65, priorityScore: 75, reason: 'Prometheus, Grafana, ELK stack' },
    { skill: 'Shell Scripting', category: 'Programming Languages', requiredProficiency: 75, priorityScore: 75, reason: 'Bash automation is essential' },
    { skill: 'Networking', category: 'System Design', requiredProficiency: 65, priorityScore: 70, reason: 'DNS, load balancers, firewalls, VPCs' },
    { skill: 'Security', category: 'Security', requiredProficiency: 65, priorityScore: 70, reason: 'Secure infrastructure design' },
  ],
  'Cloud Engineer': [
    { skill: 'Cloud', category: 'Cloud', requiredProficiency: 90, priorityScore: 95, reason: 'The entire domain — AWS/GCP/Azure expertise required' },
    { skill: 'Terraform', category: 'DevOps', requiredProficiency: 75, priorityScore: 85, reason: 'Infrastructure as Code for cloud resources' },
    { skill: 'Docker', category: 'DevOps', requiredProficiency: 70, priorityScore: 80, reason: 'Containerization for cloud workloads' },
    { skill: 'Kubernetes', category: 'DevOps', requiredProficiency: 70, priorityScore: 80, reason: 'Managed Kubernetes (EKS, GKE, AKS)' },
    { skill: 'Networking', category: 'System Design', requiredProficiency: 75, priorityScore: 85, reason: 'VPC, subnets, security groups, routing' },
    { skill: 'System Design', category: 'System Design', requiredProficiency: 70, priorityScore: 80, reason: 'Cloud architecture patterns' },
    { skill: 'Security', category: 'Security', requiredProficiency: 70, priorityScore: 80, reason: 'IAM, encryption, compliance' },
    { skill: 'Monitoring', category: 'DevOps', requiredProficiency: 60, priorityScore: 65, reason: 'CloudWatch, Stackdriver, Azure Monitor' },
    { skill: 'Python', category: 'Programming Languages', requiredProficiency: 60, priorityScore: 65, reason: 'Cloud automation scripting' },
    { skill: 'Shell Scripting', category: 'Programming Languages', requiredProficiency: 65, priorityScore: 65, reason: 'Deployment scripts and automation' },
  ],
  'Mobile Developer': [
    { skill: 'React Native', category: 'Frameworks', requiredProficiency: 80, priorityScore: 90, reason: 'Most in-demand cross-platform framework' },
    { skill: 'JavaScript', category: 'Programming Languages', requiredProficiency: 80, priorityScore: 85, reason: 'React Native is JavaScript-based' },
    { skill: 'Swift', category: 'Programming Languages', requiredProficiency: 65, priorityScore: 70, reason: 'Required for native iOS development' },
    { skill: 'Kotlin', category: 'Programming Languages', requiredProficiency: 65, priorityScore: 70, reason: 'Required for native Android development' },
    { skill: 'Dart', category: 'Programming Languages', requiredProficiency: 60, priorityScore: 70, reason: 'Flutter (Google\'s mobile framework) uses Dart' },
    { skill: 'REST API', category: 'Backend', requiredProficiency: 65, priorityScore: 70, reason: 'Mobile apps consume APIs' },
    { skill: 'Performance Optimization', category: 'Frontend', requiredProficiency: 65, priorityScore: 70, reason: 'Mobile performance is critical on resource-constrained devices' },
    { skill: 'Databases', category: 'Databases', requiredProficiency: 55, priorityScore: 60, reason: 'SQLite, Realm for local storage' },
    { skill: 'Testing', category: 'Testing', requiredProficiency: 60, priorityScore: 65, reason: 'Detox, XCTest, Espresso' },
    { skill: 'UI/UX', category: 'Frontend', requiredProficiency: 60, priorityScore: 65, reason: 'Platform-specific design guidelines (HIG, Material)' },
  ],
  'Security Engineer': [
    { skill: 'Security', category: 'Security', requiredProficiency: 90, priorityScore: 95, reason: 'The core domain — vulnerability analysis and exploitation' },
    { skill: 'Networking', category: 'System Design', requiredProficiency: 80, priorityScore: 90, reason: 'TCP/IP, packet analysis with Wireshark' },
    { skill: 'Linux', category: 'DevOps', requiredProficiency: 80, priorityScore: 85, reason: 'All security tools run on Linux' },
    { skill: 'Python', category: 'Programming Languages', requiredProficiency: 75, priorityScore: 80, reason: 'Security tool scripting and automation' },
    { skill: 'Cryptography', category: 'Security', requiredProficiency: 70, priorityScore: 80, reason: 'Encryption, hashing, PKI fundamentals' },
    { skill: 'OWASP', category: 'Security', requiredProficiency: 80, priorityScore: 85, reason: 'Top 10 vulnerabilities are the baseline knowledge' },
    { skill: 'Penetration Testing', category: 'Security', requiredProficiency: 65, priorityScore: 80, reason: 'Ethical hacking and red team skills' },
    { skill: 'Cloud Security', category: 'Cloud', requiredProficiency: 60, priorityScore: 70, reason: 'IAM, security groups, compliance in cloud' },
    { skill: 'Incident Response', category: 'Security', requiredProficiency: 60, priorityScore: 70, reason: 'Handling and recovering from breaches' },
    { skill: 'Communication', category: 'Soft Skills', requiredProficiency: 65, priorityScore: 60, reason: 'Writing security reports and advisories' },
  ],
};

// ── Gap Analysis Engine ───────────────────────────────────────────────────────

function findUserSkillConfidence(graph: SkillGraph, skillName: string): number {
  const lower = skillName.toLowerCase();
  // Try exact match first
  const exact = graph.nodes.find((n) => n.name.toLowerCase() === lower);
  if (exact) return exact.confidence;
  // Try partial match (e.g. "Node.js" matches "nodejs")
  const normalized = lower.replace(/[.\s-]/g, '');
  const partial = graph.nodes.find((n) => n.name.toLowerCase().replace(/[.\s-]/g, '') === normalized);
  if (partial) return partial.confidence;
  // Try category-level match for generic skills
  // E.g. requirement "Database" → check category score
  return 0;
}

function resolveConfidence(graph: SkillGraph, req: CareerRequirement): number {
  const skillConf = findUserSkillConfidence(graph, req.skill);
  if (skillConf > 0) return skillConf;
  // Category-level fallback
  const catScore = graph.categoryScores[req.category] || 0;
  return catScore * 0.6; // Discount category score for unmatched skills
}

function toStatus(userConf: number, requiredProf: number): import('@/types').SkillStatus {
  if (userConf === 0) return 'critical_missing';
  if (userConf < requiredProf * 0.3) return 'missing';
  if (userConf < requiredProf * 0.65) return 'weak';
  if (userConf < requiredProf * 0.9) return 'adequate';
  return 'strong';
}

/**
 * Compares a user's SkillGraph against a target career's requirements.
 * Returns a fully classified SkillGapResult.
 */
export function analyzeSkillGap(
  graph: SkillGraph,
  targetCareer: CareerArchetype
): SkillGapResult {
  const requirements = CAREER_CATALOG[targetCareer] || CAREER_CATALOG['Software Engineer'];

  const items: SkillGapItem[] = requirements.map((req) => {
    const userConfidence = resolveConfidence(graph, req);
    const status = toStatus(userConfidence, req.requiredProficiency);
    const gap = Math.max(0, req.requiredProficiency - userConfidence);

    return {
      skill: req.skill,
      category: req.category,
      status,
      userConfidence: Math.round(userConfidence),
      requiredProficiency: req.requiredProficiency,
      gap: Math.round(gap),
      priorityScore: req.priorityScore,
      reason: req.reason,
    };
  });

  // Sort by gap * priority (most impactful first)
  items.sort((a, b) => (b.gap * b.priorityScore) - (a.gap * a.priorityScore));

  const strongSkills = items.filter((i) => i.status === 'strong' || i.status === 'adequate');
  const weakSkills = items.filter((i) => i.status === 'weak');
  const missingSkills = items.filter((i) => i.status === 'missing');
  const criticalMissingSkills = items.filter((i) => i.status === 'critical_missing');

  // Overall readiness: weighted by priority
  const totalWeight = requirements.reduce((s, r) => s + r.priorityScore, 0);
  const earnedWeight = items.reduce((s, item) => {
    const ratio = Math.min(1, item.userConfidence / item.requiredProficiency);
    return s + ratio * item.priorityScore;
  }, 0);
  const overallReadiness = totalWeight === 0 ? 0 : Math.round((earnedWeight / totalWeight) * 100);

  const topPriorities = [...items]
    .filter((i) => i.status !== 'strong')
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5);

  return {
    uid: graph.uid,
    targetCareer,
    overallReadiness,
    items,
    strongSkills,
    weakSkills,
    missingSkills,
    criticalMissingSkills,
    topPriorities,
    analyzedAt: new Date().toISOString(),
  };
}

/** Returns all supported career archetypes */
export const CAREER_ARCHETYPES: CareerArchetype[] = Object.keys(CAREER_CATALOG) as CareerArchetype[];
