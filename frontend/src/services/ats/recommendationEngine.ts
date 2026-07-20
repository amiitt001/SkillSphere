/**
 * ATS Recommendation Engine
 *
 * Generates prioritized, actionable ATSRecommendation objects from
 * scored categories. All recommendations are evidence-based and
 * reference real resources.
 *
 * Rules:
 * - No randomness — same input always produces same recommendations
 * - Each recommendation includes: reason, priority, difficulty, time, gain, resources
 * - Sorted by expectedScoreGain descending
 */

import type {
  ATSRecommendation,
  ATSCategoryScore,
  StructuredResumeJSON,
  StructuredJobJSON,
} from './types';

// ─── Resource Library ─────────────────────────────────────────────────────────

const RESOURCE_LIBRARY: Record<string, ATSRecommendation['resources']> = {
  docker: [
    { type: 'course', title: 'Docker Official Getting Started', platform: 'Docker', url: 'https://docs.docker.com/get-started/' },
    { type: 'project', title: 'Dockerize an existing Node.js/Python application with multi-stage builds' },
  ],
  kubernetes: [
    { type: 'course', title: 'Kubernetes for Beginners', platform: 'KodeKloud', url: 'https://kodekloud.com/courses/kubernetes-for-the-absolute-beginners/' },
    { type: 'certification', title: 'Certified Kubernetes Application Developer (CKAD)', platform: 'CNCF', url: 'https://www.cncf.io/certification/ckad/' },
  ],
  aws: [
    { type: 'certification', title: 'AWS Cloud Practitioner', platform: 'AWS', url: 'https://aws.amazon.com/certification/certified-cloud-practitioner/' },
    { type: 'course', title: 'AWS Fundamentals Specialization', platform: 'Coursera', url: 'https://www.coursera.org/specializations/aws-fundamentals' },
  ],
  typescript: [
    { type: 'course', title: 'TypeScript Official Handbook', platform: 'TypeScript', url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
    { type: 'project', title: 'Convert an existing JavaScript project to strict TypeScript' },
  ],
  python: [
    { type: 'course', title: 'Python for Everybody', platform: 'Coursera', url: 'https://www.coursera.org/specializations/python' },
    { type: 'project', title: 'Build a REST API with FastAPI and PostgreSQL' },
  ],
  machine_learning: [
    { type: 'course', title: 'Machine Learning Specialization', platform: 'Coursera / Andrew Ng', url: 'https://www.coursera.org/specializations/machine-learning-introduction' },
    { type: 'certification', title: 'Google Professional Machine Learning Engineer', platform: 'Google Cloud', url: 'https://cloud.google.com/certification/machine-learning-engineer' },
  ],
  sql: [
    { type: 'course', title: 'SQL for Data Science', platform: 'Coursera', url: 'https://www.coursera.org/learn/sql-for-data-science' },
    { type: 'project', title: 'Design and implement a normalized relational database for a SaaS product' },
  ],
  system_design: [
    { type: 'article', title: 'System Design Primer', platform: 'GitHub', url: 'https://github.com/donnemartin/system-design-primer' },
    { type: 'course', title: 'Grokking System Design', platform: 'Educative', url: 'https://www.educative.io/courses/grokking-the-system-design-interview' },
  ],
  cicd: [
    { type: 'course', title: 'GitHub Actions – Official Learning Path', platform: 'GitHub', url: 'https://docs.github.com/en/actions/learn-github-actions' },
    { type: 'project', title: 'Set up a CI/CD pipeline with GitHub Actions for an open-source project' },
  ],
  quantify_bullets: [
    { type: 'article', title: 'How to Quantify Resume Bullets (with examples)', platform: 'The Muse', url: 'https://www.themuse.com/advice/how-to-quantify-your-resume-bullets' },
  ],
  action_verbs: [
    { type: 'article', title: '185 Powerful Resume Action Verbs', platform: 'Harvard OCS', url: 'https://hwpi.harvard.edu/files/ocs/files/hes-resume-action-verbs.pdf' },
  ],
  github_profile: [
    { type: 'article', title: 'How to Build a Stand-Out GitHub Profile', platform: 'GitHub', url: 'https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile' },
    { type: 'project', title: 'Create a GitHub Profile README with stats, pinned repos, and tech stack badges' },
  ],
  linkedin: [
    { type: 'article', title: 'LinkedIn Profile Optimization Guide', platform: 'LinkedIn', url: 'https://www.linkedin.com/help/linkedin/answer/a554351' },
  ],
  portfolio: [
    { type: 'project', title: 'Build a personal portfolio site using Next.js/React and deploy to Vercel' },
  ],
  open_source: [
    { type: 'article', title: 'First Contributions – Beginner-friendly OSS guide', platform: 'GitHub', url: 'https://github.com/firstcontributions/first-contributions' },
    { type: 'project', title: 'Find and contribute to a project on Good First Issues (goodfirstissue.dev)' },
  ],
  terraform: [
    { type: 'certification', title: 'HashiCorp Certified: Terraform Associate', platform: 'HashiCorp', url: 'https://www.hashicorp.com/certification/terraform-associate' },
    { type: 'course', title: 'Terraform: Getting Started', platform: 'Pluralsight', url: 'https://www.pluralsight.com/courses/terraform-getting-started-2021' },
  ],
  testing: [
    { type: 'course', title: 'JavaScript Testing Introduction', platform: 'Academind', url: 'https://academind.com/tutorials/javascript-testing-introduction' },
    { type: 'project', title: 'Achieve 80%+ test coverage on an existing project using Jest/Pytest' },
  ],
  leadership: [
    { type: 'project', title: 'Lead or co-lead a technical project at a hackathon or open-source initiative' },
    { type: 'article', title: 'Engineering Leadership Principles', platform: 'StaffEng', url: 'https://staffeng.com/' },
  ],
};

function getResources(key: string): ATSRecommendation['resources'] {
  return RESOURCE_LIBRARY[key] || [];
}

// ─── Counter for Deterministic IDs ───────────────────────────────────────────

function makeId(prefix: string, index: number): string {
  return `${prefix}-${index.toString().padStart(3, '0')}`;
}

// ─── Category-Specific Recommendation Generators ─────────────────────────────

export function generateCompatibilityRecommendations(
  score: ATSCategoryScore,
  parsed: StructuredResumeJSON
): ATSRecommendation[] {
  const recs: ATSRecommendation[] = [];
  let idx = 0;

  for (const issue of parsed.detectedFormattingIssues) {
    if (issue.type === 'table_detected') {
      recs.push({
        id: makeId('compat', idx++),
        category: 'ATS Compatibility',
        title: 'Remove tables from resume',
        reason: issue.description,
        priority: 'critical',
        difficulty: 'easy',
        estimatedTime: '1–2 hours',
        expectedScoreGain: 8,
        resources: [{ type: 'article', title: 'ATS-Friendly Resume Formatting Guide', platform: 'Jobscan', url: 'https://www.jobscan.co/resume-formatting' }],
      });
    }
    if (issue.type === 'image_placeholder') {
      recs.push({
        id: makeId('compat', idx++),
        category: 'ATS Compatibility',
        title: 'Remove images and photos from resume',
        reason: 'ATS systems cannot read image content. All information must be text-based.',
        priority: 'critical',
        difficulty: 'easy',
        estimatedTime: '30 minutes',
        expectedScoreGain: 6,
        resources: [],
      });
    }
    if (issue.type === 'special_characters') {
      recs.push({
        id: makeId('compat', idx++),
        category: 'ATS Compatibility',
        title: 'Replace special characters with standard ASCII',
        reason: issue.description,
        priority: 'high',
        difficulty: 'easy',
        estimatedTime: '1 hour',
        expectedScoreGain: 4,
        resources: [],
      });
    }
  }

  return recs;
}

export function generateStructureRecommendations(
  parsed: StructuredResumeJSON
): ATSRecommendation[] {
  const recs: ATSRecommendation[] = [];
  let idx = 0;

  const missingSections = [
    { section: 'summary', test: !parsed.summary, title: 'Add a Professional Summary', gain: 4 },
    { section: 'experience', test: parsed.experience.length === 0, title: 'Add Work Experience section', gain: 8 },
    { section: 'skills', test: parsed.skills.length === 0, title: 'Add a dedicated Skills section', gain: 6 },
    { section: 'projects', test: parsed.projects.length === 0, title: 'Add Projects section', gain: 5 },
    { section: 'education', test: parsed.education.length === 0, title: 'Add Education section', gain: 4 },
    { section: 'achievements', test: parsed.achievements.length === 0, title: 'Add Achievements/Awards section', gain: 3 },
  ];

  for (const { section, test, title, gain } of missingSections) {
    if (test) {
      recs.push({
        id: makeId('struct', idx++),
        category: 'Resume Structure',
        title,
        reason: `The ${section} section is missing or could not be detected. ATS systems and recruiters expect standard sections.`,
        priority: gain >= 6 ? 'high' : 'medium',
        difficulty: 'easy',
        estimatedTime: '1–3 hours',
        expectedScoreGain: gain,
        resources: [],
      });
    }
  }

  return recs;
}

export function generateSkillsRecommendations(
  parsed: StructuredResumeJSON,
  missingSkills: string[]
): ATSRecommendation[] {
  const recs: ATSRecommendation[] = [];
  let idx = 0;

  if (parsed.skills.length < 10) {
    recs.push({
      id: makeId('skills', idx++),
      category: 'Technical Skills',
      title: 'Expand your skills section',
      reason: `Only ${parsed.skills.length} skills detected. Competitive resumes typically list 15–25 relevant technical skills.`,
      priority: 'high',
      difficulty: 'easy',
      estimatedTime: '30 minutes',
      expectedScoreGain: 6,
      resources: [],
    });
  }

  const nonModernSkills = parsed.skills.filter((s) => !s.isModern && s.category !== 'soft_skill').length;
  const modernRatio = parsed.skills.length > 0
    ? parsed.skills.filter((s) => s.isModern).length / parsed.skills.length
    : 0;

  if (modernRatio < 0.5 && parsed.skills.length > 5) {
    recs.push({
      id: makeId('skills', idx++),
      category: 'Technical Skills',
      title: 'Upgrade to modern technologies',
      reason: `${nonModernSkills} of your listed skills are older technologies. Adding modern tools increases your competitiveness.`,
      priority: 'high',
      difficulty: 'hard',
      estimatedTime: '2–4 months',
      expectedScoreGain: 7,
      resources: getResources('typescript'),
    });
  }

  // Recommend missing market-critical skills
  const criticalMissing = ['docker', 'git', 'sql', 'typescript', 'python'].filter((s) =>
    missingSkills.map((m) => m.toLowerCase()).includes(s)
  );

  for (const skill of criticalMissing.slice(0, 2)) {
    recs.push({
      id: makeId('skills', idx++),
      category: 'Technical Skills',
      title: `Learn ${skill.charAt(0).toUpperCase() + skill.slice(1)}`,
      reason: `${skill} is expected in most technical roles and is missing from your resume.`,
      priority: 'high',
      difficulty: 'medium',
      estimatedTime: '2–4 weeks',
      expectedScoreGain: 5,
      resources: getResources(skill),
    });
  }

  return recs;
}

export function generateExperienceRecommendations(
  parsed: StructuredResumeJSON
): ATSRecommendation[] {
  const recs: ATSRecommendation[] = [];
  let idx = 0;

  const nonQuantified = parsed.experience.filter((e) => e.quantifiedBullets.length === 0);
  if (nonQuantified.length > 0 && parsed.experience.length > 0) {
    recs.push({
      id: makeId('exp', idx++),
      category: 'Experience Quality',
      title: 'Add quantifiable metrics to experience bullets',
      reason: `${nonQuantified.length} of your experience entries lack measurable outcomes. Numbers (%, ×, time saved) dramatically improve ATS and recruiter scores.`,
      priority: 'critical',
      difficulty: 'medium',
      estimatedTime: '2–3 hours',
      expectedScoreGain: 9,
      resources: getResources('quantify_bullets'),
    });
  }

  const weakBullets = parsed.experience.flatMap((e) => e.bullets).filter((b) =>
    /^(responsible for|worked on|helped with|assisted in|involved in)/i.test(b)
  );
  if (weakBullets.length >= 3) {
    recs.push({
      id: makeId('exp', idx++),
      category: 'Experience Quality',
      title: 'Replace passive phrases with strong action verbs',
      reason: `${weakBullets.length} bullets start with weak phrases like "responsible for" or "helped with". ATS systems score action-verb-led bullets higher.`,
      priority: 'high',
      difficulty: 'easy',
      estimatedTime: '1–2 hours',
      expectedScoreGain: 6,
      resources: getResources('action_verbs'),
    });
  }

  return recs;
}

export function generateProjectRecommendations(
  parsed: StructuredResumeJSON
): ATSRecommendation[] {
  const recs: ATSRecommendation[] = [];
  let idx = 0;

  if (parsed.projects.length === 0) {
    recs.push({
      id: makeId('proj', idx++),
      category: 'Projects',
      title: 'Add at least 2–3 substantial projects',
      reason: 'No projects detected. Projects are critical for demonstrating applied skills, especially for early-career candidates.',
      priority: 'critical',
      difficulty: 'hard',
      estimatedTime: '2–6 weeks',
      expectedScoreGain: 10,
      resources: [{ type: 'project', title: 'Build a full-stack SaaS application with authentication, database, and deployment' }],
    });
  } else {
    const noGitHub = parsed.projects.filter((p) => !p.hasGitHubLink).length;
    if (noGitHub > 0) {
      recs.push({
        id: makeId('proj', idx++),
        category: 'Projects',
        title: 'Add GitHub links to all projects',
        reason: `${noGitHub} projects lack GitHub links. Recruiters expect to see code for technical claims.`,
        priority: 'high',
        difficulty: 'easy',
        estimatedTime: '1–2 hours',
        expectedScoreGain: 5,
        resources: getResources('github_profile'),
      });
    }

    const noDeployment = parsed.projects.filter((p) => !p.hasDeploymentLink).length;
    if (noDeployment > 1) {
      recs.push({
        id: makeId('proj', idx++),
        category: 'Projects',
        title: 'Deploy projects and add live URLs',
        reason: `${noDeployment} projects have no live deployment link. Deployed projects show production readiness.`,
        priority: 'medium',
        difficulty: 'medium',
        estimatedTime: '1–3 hours per project',
        expectedScoreGain: 4,
        resources: [{ type: 'article', title: 'Deploy for Free with Vercel', platform: 'Vercel', url: 'https://vercel.com/docs/deployments/overview' }],
      });
    }
  }

  return recs;
}

export function generateAchievementsRecommendations(
  parsed: StructuredResumeJSON
): ATSRecommendation[] {
  const recs: ATSRecommendation[] = [];
  let idx = 0;

  if (parsed.achievements.length === 0) {
    recs.push({
      id: makeId('ach', idx++),
      category: 'Achievements',
      title: 'Add hackathon, competition, or award experience',
      reason: 'No achievements detected. Competitive credentials significantly differentiate candidates in ATS ranking.',
      priority: 'medium',
      difficulty: 'hard',
      estimatedTime: '1–3 months',
      expectedScoreGain: 6,
      resources: [
        { type: 'article', title: 'Find Hackathons Near You', platform: 'Devpost', url: 'https://devpost.com/hackathons' },
        { type: 'article', title: 'MLH Hackathons', platform: 'MLH', url: 'https://mlh.io/seasons/2025/events' },
      ],
    });
  }

  const hasOSS = parsed.achievements.some((a) => a.type === 'open_source');
  if (!hasOSS) {
    recs.push({
      id: makeId('ach', idx++),
      category: 'Achievements',
      title: 'Contribute to open-source projects',
      reason: 'Open-source contributions signal collaborative coding skills and are highly valued by engineering teams.',
      priority: 'medium',
      difficulty: 'medium',
      estimatedTime: '2–4 weeks',
      expectedScoreGain: 4,
      resources: getResources('open_source'),
    });
  }

  return recs;
}

export function generateWritingRecommendations(
  parsed: StructuredResumeJSON
): ATSRecommendation[] {
  const recs: ATSRecommendation[] = [];
  let idx = 0;

  const allBullets = parsed.experience.flatMap((e) => e.bullets);
  const longBullets = allBullets.filter((b) => b.split(' ').length > 25);
  if (longBullets.length >= 3) {
    recs.push({
      id: makeId('write', idx++),
      category: 'Writing Quality',
      title: 'Shorten verbose bullet points',
      reason: `${longBullets.length} bullets are over 25 words. Concise bullets (10–20 words) are easier to scan and ATS-friendly.`,
      priority: 'medium',
      difficulty: 'easy',
      estimatedTime: '1–2 hours',
      expectedScoreGain: 4,
      resources: getResources('action_verbs'),
    });
  }

  return recs;
}

export function generateCompletenessRecommendations(
  parsed: StructuredResumeJSON
): ATSRecommendation[] {
  const recs: ATSRecommendation[] = [];
  let idx = 0;

  if (!parsed.contact.githubUrl) {
    recs.push({
      id: makeId('complete', idx++),
      category: 'Resume Completeness',
      title: 'Add GitHub profile URL',
      reason: 'GitHub URL is missing. This is expected for all technical roles and missing it reduces trust.',
      priority: 'high',
      difficulty: 'easy',
      estimatedTime: '15 minutes',
      expectedScoreGain: 5,
      resources: getResources('github_profile'),
    });
  }

  if (!parsed.contact.linkedinUrl) {
    recs.push({
      id: makeId('complete', idx++),
      category: 'Resume Completeness',
      title: 'Add LinkedIn profile URL',
      reason: 'LinkedIn URL missing. Recruiters cross-reference LinkedIn for 90%+ of technical hires.',
      priority: 'high',
      difficulty: 'easy',
      estimatedTime: '30 minutes',
      expectedScoreGain: 4,
      resources: getResources('linkedin'),
    });
  }

  if (!parsed.contact.portfolioUrl && parsed.projects.length > 0) {
    recs.push({
      id: makeId('complete', idx++),
      category: 'Resume Completeness',
      title: 'Add a portfolio website',
      reason: 'You have projects but no portfolio URL. A live portfolio dramatically increases recruiter response rates.',
      priority: 'medium',
      difficulty: 'medium',
      estimatedTime: '1–2 weeks',
      expectedScoreGain: 4,
      resources: getResources('portfolio'),
    });
  }

  return recs;
}

export function generateIndustryRecommendations(
  parsed: StructuredResumeJSON,
  modernityScore: number
): ATSRecommendation[] {
  const recs: ATSRecommendation[] = [];
  let idx = 0;

  if (modernityScore < 60) {
    recs.push({
      id: makeId('industry', idx++),
      category: 'Industry Readiness',
      title: 'Update to current industry technologies',
      reason: 'Your tech stack has older tools. Adding modern technologies (cloud, containers, CI/CD) signals market awareness.',
      priority: 'high',
      difficulty: 'hard',
      estimatedTime: '2–6 months',
      expectedScoreGain: 5,
      resources: [...getResources('docker'), ...getResources('aws')],
    });
  }

  return recs;
}

// ─── Job-Match Specific Recommendations ──────────────────────────────────────

export function generateJobMatchRecommendations(
  missingSkills: string[],
  missingKeywords: string[]
): ATSRecommendation[] {
  const recs: ATSRecommendation[] = [];
  let idx = 0;

  if (missingKeywords.length > 5) {
    recs.push({
      id: makeId('jm-kw', idx++),
      category: 'Keyword Match',
      title: `Add ${missingKeywords.slice(0, 5).join(', ')} to your resume`,
      reason: `${missingKeywords.length} keywords from the job description are missing. ATS systems rank resumes by keyword density.`,
      priority: 'critical',
      difficulty: 'easy',
      estimatedTime: '30 minutes',
      expectedScoreGain: 10,
      resources: [],
    });
  }

  for (const skill of missingSkills.slice(0, 3)) {
    const resourceKey = skill.toLowerCase().replace(/[^a-z0-9]/g, '_');
    recs.push({
      id: makeId('jm-skill', idx++),
      category: 'Skills Match',
      title: `Add ${skill} to resume or acquire it`,
      reason: `"${skill}" is required/preferred in this job but not found in your resume.`,
      priority: 'high',
      difficulty: 'medium',
      estimatedTime: '1–4 weeks',
      expectedScoreGain: 5,
      resources: getResources(resourceKey),
    });
  }

  return recs;
}

// ─── Top Priority Sorter ──────────────────────────────────────────────────────

export function sortByPriority(recs: ATSRecommendation[]): ATSRecommendation[] {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...recs].sort((a, b) => {
    // Sort by score gain desc, then priority asc, then title asc
    if (b.expectedScoreGain !== a.expectedScoreGain) return b.expectedScoreGain - a.expectedScoreGain;
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.title.localeCompare(b.title);
  });
}
