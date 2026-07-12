import { aiService, StandardAiResponse } from '../aiService';
import { getRecommendationsPrompt, getComparisonPrompt } from '../prompts/career';
import { cacheStore } from '@/lib/cache';
import { logger } from '@/services/logger';

export function getFallbackRecommendations(academicStream: string, skills: string, interests: string) {
  const skillsList = skills ? skills.split(',').map((s) => s.trim()) : [];

  return {
    recommendations: [
      {
        title: 'AI/Machine Learning Engineer (Ethical AI Focus)',
        justification: `Directly aligns with your background in ${academicStream || 'Technology'} and interest in ethical development.`,
        roadmap: [
          'Master core ML frameworks (TensorFlow, PyTorch)',
          'Implement bias detection and fair ML algorithms',
          'Build MLOps pipelines and deploy to AWS/GCP',
        ],
        estimatedSalary: '₹8,0,000 - ₹15,00,000 LPA',
        suggestedCertifications: [
          'Google Cloud Professional ML Engineer',
          'TensorFlow Developer Certificate',
        ],
        keyCompanies: ['TCS', 'ThoughtWorks', 'Wipro'],
        skillGapAnalysis: {
          readinessScore: 80,
          estimatedTime: '4-6 Months',
          currentSkills: skillsList.filter((s) => ['Python', 'SQL', 'JavaScript', 'C++'].includes(s)) || ['Python'],
          missingSkills: [
            { name: 'TensorFlow', level: 20 },
            { name: 'PyTorch', level: 10 },
            { name: 'MLOps', level: 0 },
            { name: 'Statistics', level: 40 },
          ],
          topPrioritySkills: ['TensorFlow', 'PyTorch', 'MLOps'],
          aiInsight: 'Your coding foundation is solid. Focus on core ML libraries and MLOps deployment practices.',
        },
      },
      {
        title: 'Full Stack Developer (Open Source Contributor)',
        justification: `Leverages your key programming skills to contribute to scaled web applications.`,
        roadmap: [
          'Deep dive into React, Node.js, and TypeScript',
          'Contribute to key open source web frameworks',
          'Learn system design principles and database indexing',
        ],
        estimatedSalary: '₹6,0,000 - ₹12,0,000 LPA',
        suggestedCertifications: [
          'AWS Certified Developer',
          'Meta Front-End Developer Professional Certificate',
        ],
        keyCompanies: ['ThoughtWorks', 'Razorpay', 'BrowserStack'],
        skillGapAnalysis: {
          readinessScore: 85,
          estimatedTime: '3-5 Months',
          currentSkills: skillsList.filter((s) => ['JavaScript', 'HTML', 'CSS', 'Python'].includes(s)) || ['JavaScript'],
          missingSkills: [
            { name: 'React', level: 40 },
            { name: 'Node.js', level: 30 },
            { name: 'TypeScript', level: 20 },
          ],
          topPrioritySkills: ['React', 'Node.js', 'TypeScript'],
          aiInsight: 'Expanding into React and server-side JavaScript will quickly unlock high-paying roles.',
        },
      },
      {
        title: 'Data Scientist (Ethical Data & Bias Analysis)',
        justification: `Combines database management, statistical analysis, and ethical insights.`,
        roadmap: [
          'Advance your SQL analytics and pipeline queries',
          'Study algorithmic fairness and model explanation techniques',
          'Build predictive dashboards in Tableau or Power BI',
        ],
        estimatedSalary: '₹7,0,000 - ₹14,0,000 LPA',
        suggestedCertifications: [
          'Google Data Analytics Professional Certificate',
          'SAS Certified Data Scientist',
        ],
        keyCompanies: ['TCS', 'Accenture', 'Fractal Analytics'],
        skillGapAnalysis: {
          readinessScore: 75,
          estimatedTime: '3-6 Months',
          currentSkills: skillsList.filter((s) => ['SQL', 'Python', 'R'].includes(s)) || ['SQL'],
          missingSkills: [
            { name: 'R/Python Libraries', level: 30 },
            { name: 'Tableau', level: 10 },
            { name: 'Data Warehousing', level: 20 },
          ],
          topPrioritySkills: ['Tableau', 'Data Warehousing', 'R/Python Libraries'],
          aiInsight: 'Leverage your SQL foundation. Focus on learning business intelligence tools and basic statistical models.',
        },
      },
    ],
  };
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
    academicStream: string,
    skills: string[],
    interests: string[]
  ): Promise<StandardAiResponse<any>> {
    const skillsStr = skills.map((s) => s.trim()).sort().join(',');
    const interestsStr = interests.map((i) => i.trim()).sort().join(',');
    const cacheKey = `recommendations:${academicStream}:${skillsStr}:${interestsStr}`;

    try {
      const cached = await cacheStore.get<any>(cacheKey);
      if (cached) {
        logger.info(`[CareerAi] Cache hit for key: ${cacheKey}`);
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

    const prompt = getRecommendationsPrompt(academicStream, skillsStr, interestsStr);
    const fallback = getFallbackRecommendations(academicStream, skillsStr, interestsStr);

    const res = await aiService.generateJSON(prompt, fallback);

    if (res.success && res.provider !== 'mock') {
      try {
        await cacheStore.set(cacheKey, res.data, 3600); // 1 hour TTL
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
