export interface UnifiedSearchResult {
  category: 'jobs' | 'projects' | 'courses' | 'users';
  title: string;
  subtitle: string;
  metadata?: string;
}

const STATIC_ENTITIES: UnifiedSearchResult[] = [
  { category: 'jobs', title: 'React Frontend Developer at Razorpay', subtitle: '₹12,00,000 LPA • Bangalore', metadata: 'React, NextJS, TypeScript' },
  { category: 'jobs', title: 'Google India NodeJS Intern', subtitle: '₹80,000/month stipend', metadata: 'NodeJS, Docker, Redis' },
  { category: 'projects', title: 'Real-time Redis caching microservice', subtitle: 'Docker compose config setup guide', metadata: 'Redis, Docker' },
  { category: 'courses', title: 'Next.js Advanced rendering & compose layouts', subtitle: 'Udemy certification module', metadata: 'NextJS, React' },
  { category: 'users', title: 'Amit Sharma', subtitle: 'Student Placement candidate • Readiness Score: 88%', metadata: 'CSE, NodeJS, React' },
  { category: 'users', title: 'Siddharth Roy', subtitle: 'Recruiter at Razorpay', metadata: 'Hiring SDE-1' }
];

/**
 * Searches the static entity catalog using keyword matching.
 */
export async function executeGlobalSearch(query: string): Promise<UnifiedSearchResult[]> {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];

  // Filter based on keywords in title, subtitle, or metadata tags
  return STATIC_ENTITIES.filter(item => 
    item.title.toLowerCase().includes(normalized) ||
    item.subtitle.toLowerCase().includes(normalized) ||
    (item.metadata && item.metadata.toLowerCase().includes(normalized))
  );
}
