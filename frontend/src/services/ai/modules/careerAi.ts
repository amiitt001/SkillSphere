import crypto from 'crypto';
import { modelRouter as aiService } from '../orchestrator/modelRouter';
import { StandardAiResponse } from '../aiService';
import { getRecommendationsPrompt, getComparisonPrompt } from '../prompts/career';
import { cacheProvider } from '@/shared/infrastructure/cache/cacheProvider';
import { logger } from '@/services/logger';
import { UnifiedUserProfile } from '@/services/onboarding/profileMemory';

/**
 * All profile data required by the Career AI to produce personalized results.
 * Pass the full Unified User Profile context — no field should be omitted.
 */
export interface CareerRecommendationContext {
  /** Firebase UID — used to scope the cache key per-user. */
  userId: string;
  academicStream: string;
  skills: string[];
  certifications: string[];
  interests: string[];
  preferredRoles: string[];
  experience: UnifiedUserProfile['experience'];
  projects: UnifiedUserProfile['projects'];
  education: UnifiedUserProfile['education'];
  profileVersion?: number;
  profileHash?: string;
}

type CareerTheme = 'frontend' | 'data' | 'mechanical' | 'ai' | 'software';

function normalizeValues(values: string[] = []) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function joinValues(values: string[], fallback: string) {
  const normalized = normalizeValues(values);
  return normalized.length > 0 ? normalized.join(', ') : fallback;
}

export function computeCareerProfileHash(context: CareerRecommendationContext): string {
  if (context.profileHash) return context.profileHash;

  const fingerprint = {
    academicStream: context.academicStream,
    skills: normalizeValues(context.skills).sort(),
    certifications: normalizeValues(context.certifications).sort(),
    interests: normalizeValues(context.interests).sort(),
    preferredRoles: normalizeValues(context.preferredRoles).sort(),
    education: context.education.map((entry) => ({
      institution: entry.institution,
      degree: entry.degree,
      graduationYear: entry.graduationYear ?? null,
      stream: entry.stream ?? null,
    })),
    experience: context.experience.map((entry) => ({
      company: entry.company,
      role: entry.role,
      duration: entry.duration,
      description: entry.description ?? '',
    })),
    projects: context.projects.map((entry) => ({
      title: entry.title,
      description: entry.description,
      technologies: normalizeValues(entry.technologies).sort(),
    })),
    profileVersion: context.profileVersion ?? 0,
  };

  return crypto.createHash('sha256').update(JSON.stringify(fingerprint)).digest('hex');
}

function detectCareerTheme(context: CareerRecommendationContext): CareerTheme {
  const corpus = [
    context.academicStream,
    ...context.skills,
    ...context.certifications,
    ...context.interests,
    ...context.preferredRoles,
    ...context.projects.flatMap((project) => [project.title, project.description, ...(project.technologies || [])]),
    ...context.experience.flatMap((experience) => [experience.role, experience.company, experience.description || '']),
  ].join(' ').toLowerCase();

  if (/(autocad|solidworks|cad|catia|ansys|mechanical|manufactur|design for manufacturing)/.test(corpus)) {
    return 'mechanical';
  }

  if (/(sql|tableau|power bi|pandas|numpy|excel|analytics|data analyst|data scientist|bi)/.test(corpus)) {
    return 'data';
  }

  if (/(react|next\.js|nextjs|vue|angular|typescript|javascript|html|css|frontend|ui|ux)/.test(corpus)) {
    return 'frontend';
  }

  if (/(ml|machine learning|ai|artificial intelligence|python|tensorflow|pytorch|nlp|llm)/.test(corpus)) {
    return 'ai';
  }

  return 'software';
}

function createRecommendation(
  title: string,
  justification: string,
  roadmap: string[],
  estimatedSalary: string,
  suggestedCertifications: string[],
  keyCompanies: string[],
  currentSkills: string[],
  missingSkills: Array<{ name: string; level: number }>,
  topPrioritySkills: string[],
  aiInsight: string,
  readinessScore: number,
  estimatedTime: string
) {
  return {
    title,
    justification,
    roadmap,
    estimatedSalary,
    suggestedCertifications,
    keyCompanies,
    skillGapAnalysis: {
      readinessScore,
      estimatedTime,
      currentSkills,
      missingSkills,
      topPrioritySkills,
      aiInsight,
    },
  };
}

export function getFallbackRecommendations(context: CareerRecommendationContext) {
  const theme = detectCareerTheme(context);
  const skills = normalizeValues(context.skills);
  const roles = normalizeValues(context.preferredRoles);
  const interests = normalizeValues(context.interests);
  const projectSignals = context.projects.map((project) => project.title).filter(Boolean);
  const experienceSignals = context.experience.map((experience) => `${experience.role} at ${experience.company}`.trim()).filter(Boolean);
  const profileSignal = [
    context.academicStream,
    ...roles.slice(0, 2),
    ...interests.slice(0, 2),
    ...projectSignals.slice(0, 2),
    ...experienceSignals.slice(0, 2),
  ].filter(Boolean).join(' | ');

  const build = (
    primary: string,
    secondary: string,
    tertiary: string,
    companySet: string[],
    certSet: string[],
    currentSkillSet: string[],
    missingSkillSet: Array<{ name: string; level: number }>,
    topSkills: string[],
    insight: string,
    readinessScore: number,
    estimatedTime: string,
    salary: string,
    roadmapA: string,
    roadmapB: string,
    roadmapC: string
  ) => ({
    recommendations: [
      createRecommendation(
        primary,
        `Best aligned with ${profileSignal || 'the current profile'} and the user's demonstrated ${joinValues(currentSkillSet, 'existing skills')} experience.`,
        [roadmapA, roadmapB, roadmapC],
        salary,
        certSet,
        companySet,
        currentSkillSet,
        missingSkillSet,
        topSkills,
        insight,
        readinessScore,
        estimatedTime,
      ),
      createRecommendation(
        secondary,
        `A strong adjacent path that builds on ${joinValues(currentSkillSet.slice(0, 3), "the user's profile")} and broadens their employability.`,
        [
          `Strengthen the core tools behind ${secondary}.`,
          `Ship one portfolio project that mirrors real hiring needs.`,
          `Document the work with measurable outcomes.`,
        ],
        salary,
        certSet,
        companySet,
        currentSkillSet,
        missingSkillSet,
        topSkills,
        insight,
        Math.max(55, readinessScore - 8),
        estimatedTime,
      ),
      createRecommendation(
        tertiary,
        `A differentiated option that still matches ${context.academicStream || "the user's background"} and creates a broader long-term path.`,
        [
          `Explore the domain-specific tooling used in ${tertiary}.`,
          `Complete a focused case study or internship-ready project.`,
          `Connect the work to the user's actual background and interests.`,
        ],
        salary,
        certSet,
        companySet,
        currentSkillSet,
        missingSkillSet,
        topSkills,
        insight,
        Math.max(50, readinessScore - 12),
        estimatedTime,
      ),
    ],
  });

  switch (theme) {
    case 'frontend':
      return build(
        'Frontend Engineer',
        'UI Engineer',
        'Product Engineer',
        ['Razorpay', 'BrowserStack', 'Groww'],
        ['Meta Front-End Developer Professional Certificate', 'Google UX Design Professional Certificate'],
        skills.filter((skill) => /react|next|typescript|javascript|html|css|tailwind|ui|ux/i.test(skill)),
        [
          { name: 'Advanced component architecture', level: 35 },
          { name: 'Design systems', level: 25 },
          { name: 'Performance optimization', level: 20 },
        ],
        ['React', 'TypeScript', 'Accessibility'],
        'Frontend execution will benefit most from design-system depth and performance-focused shipping.',
        86,
        '3-5 Months',
        '₹7,00,000 - ₹16,00,000 LPA',
        'Build a production-grade dashboard in React/Next.js.',
        'Add accessibility, testing, and performance budgets.',
        'Showcase one polished user-facing project with clear metrics.',
      );
    case 'data':
      return build(
        'Data Analyst',
        'Analytics Engineer',
        'Business Intelligence Developer',
        ['Fractal Analytics', 'Mu Sigma', 'Accenture'],
        ['Google Data Analytics Professional Certificate', 'Microsoft Power BI Data Analyst Associate'],
        skills.filter((skill) => /sql|python|tableau|power bi|excel|pandas|numpy|analytics/i.test(skill)),
        [
          { name: 'Data modeling', level: 30 },
          { name: 'Dashboard storytelling', level: 25 },
          { name: 'Experiment design', level: 20 },
        ],
        ['SQL', 'Python', 'Tableau'],
        "Analytics roles fit best when the user's portfolio demonstrates measurable business insight and reporting clarity.",
        82,
        '3-6 Months',
        '₹6,50,000 - ₹15,00,000 LPA',
        'Build a SQL-first case study with a clean dashboard.',
        'Translate raw metrics into stakeholder-ready insights.',
        'Add a second project showing experimentation or forecasting.',
      );
    case 'mechanical':
      return build(
        'CAD Design Engineer',
        'Product Design Engineer',
        'Manufacturing Engineer',
        ['Tata Motors', 'Mahindra', 'Bosch'],
        ['Autodesk AutoCAD Certification', 'SolidWorks Associate Certification'],
        skills.filter((skill) => /cad|autocad|solidworks|catia|ansys|mechanical|manufacturing|design/i.test(skill)),
        [
          { name: 'DFM/DFA', level: 35 },
          { name: 'Simulation tools', level: 30 },
          { name: 'Product validation', level: 25 },
        ],
        ['AutoCAD', 'SolidWorks', 'ANSYS'],
        'Mechanical roles fit when CAD fluency is paired with practical design validation and manufacturing awareness.',
        84,
        '4-7 Months',
        '₹5,50,000 - ₹14,00,000 LPA',
        'Create a CAD portfolio with manufacturable parts.',
        'Document FEA or simulation work with design rationale.',
        'Build a project that connects engineering theory to production constraints.',
      );
    case 'ai':
      return build(
        'AI Engineer',
        'Machine Learning Engineer',
        'Data Scientist',
        ['Google', 'Flipkart', 'Wipro'],
        ['Google Cloud Professional ML Engineer', 'TensorFlow Developer Certificate'],
        skills.filter((skill) => /python|tensorflow|pytorch|sql|machine learning|ai/i.test(skill)),
        [
          { name: 'Model deployment', level: 25 },
          { name: 'Feature engineering', level: 20 },
          { name: 'MLOps', level: 15 },
        ],
        ['Python', 'ML Fundamentals', 'MLOps'],
        'AI roles should be driven by applied projects, not generic coursework alone.',
        80,
        '4-6 Months',
        '₹8,00,000 - ₹18,00,000 LPA',
        'Train and deploy one end-to-end ML project.',
        'Explain feature engineering and evaluation clearly.',
        'Add infra and monitoring so the model can ship reliably.',
      );
    default:
      return build(
        'Software Engineer',
        'Backend Engineer',
        'Full-Stack Developer',
        ['ThoughtWorks', 'Atlassian', 'Paytm'],
        ['AWS Certified Developer - Associate', 'Oracle Java Certification'],
        skills.slice(0, 4),
        [
          { name: 'System design', level: 30 },
          { name: 'Testing', level: 25 },
          { name: 'Distributed systems', level: 20 },
        ],
        ['Problem solving', 'API design', 'Testing'],
        'Software roles will reward clear evidence of shipping, testing, and product thinking.',
        78,
        '3-6 Months',
        '₹6,00,000 - ₹15,00,000 LPA',
        'Build one production-ready service with tests.',
        'Add observability and deployment notes to the project.',
        'Document tradeoffs and scale considerations in the README.',
      );
  }
}

export function getFallbackComparison(career1: string, career2: string) {
  return {
    summary: `A high-level comparison between ${career1} and ${career2}. Both paths offer strong career trajectories in the modern Indian tech ecosystem, but focus on different aspects of engineering, design, or analytics.`,
    choose_c1_if: [
      `You prefer working on the core domain challenges of ${career1}.`,
      `You have a stronger foundation in the tools and technologies specific to ${career1}.`,
    ],
    choose_c2_if: [
      `You are interested in the day-to-day responsibilities and growth opportunities of ${career2}.`,
      `You enjoy the primary tools, methodologies, and frameworks used in ${career2}.`,
    ],
    recommended_career: career1,
    confidence: 85,
    tableData: [
      {
        feature: 'Core Focus',
        career1_details: `Building and scaling architectures for ${career1}.`,
        career2_details: `Designing, engineering, and maintaining pipelines for ${career2}.`,
      },
      {
        feature: 'Primary Skills',
        career1_details: `Advanced problem solving, domain-specific algorithms, and deployment.`,
        career2_details: `System engineering, data integration, and platform scaling.`,
      },
      {
        feature: 'Key Tools',
        career1_details: `Modern libraries, frameworks, and APIs.`,
        career2_details: `Enterprise platforms, hosting solutions, and databases.`,
      },
      {
        feature: 'Market Demand',
        career1_details: `Very high in tier-1 Indian tech hubs and multinational firms.`,
        career2_details: `Growing exponentially across both startups and established product companies.`,
      },
      {
        feature: 'Remote Jobs',
        career1_details: `Widely available, especially for experienced contributors.`,
        career2_details: `Highly accessible with international remote opportunities.`,
      },
      {
        feature: 'Growth Profile',
        career1_details: `Rapid vertical growth into staff engineer or principal architect roles.`,
        career2_details: `Excellent transition paths into technical leadership or domain consulting.`,
      },
    ],
    chartData: [
      { metric: 'Salary', career1_value: 85, career2_value: 78 },
      { metric: 'Demand', career1_value: 90, career2_value: 85 },
      { metric: 'Difficulty', career1_value: 75, career2_value: 70 },
      { metric: 'Growth', career1_value: 92, career2_value: 88 },
      { metric: 'Remote Opportunities', career1_value: 80, career2_value: 75 },
      { metric: 'Learning Time', career1_value: 70, career2_value: 65 },
    ],
  };
}

/**
 * Career AI Business Domain Module
 */
export class CareerAi {
  async generateRecommendations(
    context: CareerRecommendationContext,
    generateMore?: boolean
  ): Promise<StandardAiResponse<any>> {
    const {
      userId,
      academicStream,
      skills,
      certifications,
      interests,
      preferredRoles,
      experience,
      projects,
      education,
      profileVersion,
    } = context;

    const skillsStr = skills.map((s) => s.trim()).sort().join(', ');
    const certificationsStr = certifications.map((value) => value.trim()).filter(Boolean).sort().join(', ');
    const interestsStr = interests.map((i) => i.trim()).sort().join(', ');
    const profileHash = computeCareerProfileHash(context);
    // Cache key is USER-SCOPED and profile-scoped — prevents stale profile reuse.
    const cacheKey = `recommendations:${userId}:${profileHash}${generateMore ? ':more' : ':base'}`;
    const isDevelopment = process.env.NODE_ENV !== 'production';

    try {
      const cached = await cacheProvider.get<any>(cacheKey);
      if (cached) {
        logger.info(`[CareerAi] Cache hit for user ${userId}`, {
          profileHash,
          profileVersion,
        });
        return {
          success: true,
          provider: 'cache',
          model: 'in-memory',
          latency: 0,
          data: cached,
          warnings: [],
        };
      }
    } catch (err) {
      logger.error('[CareerAi] Cache read failed', err);
    }

    // Serialize rich profile sections for the prompt
    const educationStr = education.length > 0
      ? education.map((e) => `${e.degree} from ${e.institution}${e.graduationYear ? ` (${e.graduationYear})` : ''}`).join('; ')
      : 'Not specified';

    const experienceStr = experience.length > 0
      ? experience.map((e) => `${e.role} at ${e.company} (${e.duration})${e.description ? ': ' + e.description : ''}`).join(' | ')
      : 'Fresher / No prior work experience';

    const projectsStr = projects.length > 0
      ? projects.map((p) => `${p.title} (${p.technologies.join(', ')}): ${p.description}`).join(' | ')
      : 'No projects specified';

    const rolesStr = preferredRoles.length > 0 ? preferredRoles.join(', ') : 'Open to suggestions based on profile';
    const certificationStr = certificationsStr || 'Not specified';

    let prompt = getRecommendationsPrompt({
      academicStream,
      skills: skillsStr,
      interests: interestsStr,
      preferredRoles: rolesStr,
      education: educationStr,
      experience: experienceStr,
      projects: projectsStr,
      certifications: certificationStr,
    });

    if (generateMore) {
      prompt += "\n\nCRITICAL HINT: Generate 3 ALTERNATIVE career recommendations that are completely different from the paths typically suggested. Focus on niche opportunities that specifically match this user's unique combination of skills and experience. Do not repeat any paths already suggested.";
    }

    const fallback = getFallbackRecommendations(context);

    if (isDevelopment) {
      logger.info('[CareerAi][Debug] Preparing recommendation prompt', {
        userId,
        profileVersion: profileVersion ?? 0,
        profileHash,
        skills,
        experience,
        certifications,
        interests,
        preferredRoles,
      });
      logger.info('[CareerAi][Debug] Prompt sent to AI', { prompt });
    }

    const res = await aiService.generateJSON(prompt, fallback);

    if (isDevelopment) {
      logger.info('[CareerAi][Debug] Recommendation response', { response: res.data });
    }

    if (res.success) {
      try {
        await cacheProvider.set(cacheKey, res.data);
      } catch (err) {
        logger.error('[CareerAi] Cache write failed', err);
      }
    }

    return res;
  }

  async compareCareersStream(career1: string, career2: string): Promise<ReadableStream<string>> {
    const prompt = getComparisonPrompt(career1, career2);
    const fallback = getFallbackComparison(career1, career2);
    const fallbackText = JSON.stringify(fallback);

    return await aiService.generateStream(prompt, fallbackText);
  }
}

export const careerAi = new CareerAi();
