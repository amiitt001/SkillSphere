jest.mock('../orchestrator/modelRouter', () => ({
  modelRouter: {
    generateJSON: jest.fn(),
    generateStream: jest.fn(),
    generateText: jest.fn(),
  },
}));

jest.mock('@/shared/infrastructure/cache/cacheProvider', () => ({
  cacheProvider: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    deleteByPrefix: jest.fn(),
    clear: jest.fn(),
  },
}));

import { computeCareerProfileHash, getFallbackRecommendations } from './careerAi';
import { getRecommendationsPrompt } from '../prompts/career';
import type { CareerRecommendationContext } from './careerAi';

function createFrontendProfile(): CareerRecommendationContext {
  return {
    userId: 'user-frontend',
    academicStream: 'Computer Science',
    skills: ['React', 'TypeScript', 'HTML', 'CSS', 'Tailwind'],
    certifications: ['Meta Front-End Developer Professional Certificate'],
    interests: ['frontend engineering', 'product design'],
    preferredRoles: ['Frontend Engineer'],
    experience: [
      {
        company: 'Nova Labs',
        role: 'Frontend Developer Intern',
        duration: 'Jun 2025 - Aug 2025',
        description: 'Built reusable UI components and improved page load performance.',
      },
    ],
    projects: [
      {
        title: 'Campus Events Dashboard',
        description: 'Responsive student dashboard with live events and filters.',
        technologies: ['React', 'TypeScript', 'Tailwind'],
      },
    ],
    education: [
      {
        institution: 'State Engineering College',
        degree: 'B.Tech Computer Science',
        stream: 'Engineering / Tech',
        graduationYear: 2026,
      },
    ],
    profileVersion: 4,
  };
}

function createDataProfile(): CareerRecommendationContext {
  return {
    userId: 'user-data',
    academicStream: 'Statistics',
    skills: ['SQL', 'Python', 'Tableau', 'Excel', 'Pandas'],
    certifications: ['Google Data Analytics Professional Certificate'],
    interests: ['analytics', 'business intelligence'],
    preferredRoles: ['Data Analyst'],
    experience: [
      {
        company: 'InsightWorks',
        role: 'Data Analyst Intern',
        duration: 'Jan 2025 - Apr 2025',
        description: 'Built KPI dashboards and cleaned CRM datasets for monthly reporting.',
      },
    ],
    projects: [
      {
        title: 'Retail Sales Dashboard',
        description: 'Interactive BI dashboard showing sales trends and cohort retention.',
        technologies: ['SQL', 'Tableau', 'Python'],
      },
    ],
    education: [
      {
        institution: 'City University',
        degree: 'B.Sc Statistics',
        stream: 'Science',
        graduationYear: 2026,
      },
    ],
    profileVersion: 7,
  };
}

function createMechanicalProfile(): CareerRecommendationContext {
  return {
    userId: 'user-mechanical',
    academicStream: 'Mechanical Engineering',
    skills: ['AutoCAD', 'SolidWorks', 'ANSYS', 'CAD', 'Manufacturing'],
    certifications: ['Autodesk AutoCAD Certification'],
    interests: ['product design', 'manufacturing'],
    preferredRoles: ['Mechanical Design Engineer'],
    experience: [
      {
        company: 'Machina Tech',
        role: 'Design Intern',
        duration: 'May 2025 - Jul 2025',
        description: 'Drafted CAD assemblies and supported prototype validation.',
      },
    ],
    projects: [
      {
        title: 'Lightweight Chassis Prototype',
        description: 'Optimized a frame for manufacturability and durability.',
        technologies: ['SolidWorks', 'ANSYS'],
      },
    ],
    education: [
      {
        institution: 'Institute of Technology',
        degree: 'B.Tech Mechanical Engineering',
        stream: 'Engineering / Tech',
        graduationYear: 2026,
      },
    ],
    profileVersion: 2,
  };
}

describe('career recommendation personalization', () => {
  it('builds different profile hashes for distinct profiles', () => {
    const frontendHash = computeCareerProfileHash(createFrontendProfile());
    const dataHash = computeCareerProfileHash(createDataProfile());
    const mechanicalHash = computeCareerProfileHash(createMechanicalProfile());

    expect(frontendHash).not.toBe(dataHash);
    expect(frontendHash).not.toBe(mechanicalHash);
    expect(dataHash).not.toBe(mechanicalHash);
  });

  it('includes the actual parsed profile in the recommendation prompt', () => {
    const prompt = getRecommendationsPrompt({
      academicStream: 'Computer Science',
      skills: 'React, TypeScript, HTML, CSS',
      certifications: 'Meta Front-End Developer Professional Certificate',
      interests: 'frontend engineering, product design',
      preferredRoles: 'Frontend Engineer',
      education: 'B.Tech Computer Science from State Engineering College (2026)',
      experience: 'Frontend Developer Intern at Nova Labs (Jun 2025 - Aug 2025): Built reusable UI components and improved page load performance.',
      projects: 'Campus Events Dashboard (React, TypeScript, Tailwind): Responsive student dashboard with live events and filters.',
    });

    expect(prompt).toContain('Technical Skills: React, TypeScript, HTML, CSS');
    expect(prompt).toContain('Certifications: Meta Front-End Developer Professional Certificate');
    expect(prompt).toContain('Career Interests / Preferred Industries: frontend engineering, product design');
    expect(prompt).toContain('Target Roles: Frontend Engineer');
    expect(prompt).toContain('Education: B.Tech Computer Science from State Engineering College (2026)');
    expect(prompt).toContain('Work Experience: Frontend Developer Intern at Nova Labs');
    expect(prompt).toContain('Projects Built: Campus Events Dashboard');
  });

  it('returns meaningfully different fallback recommendations for different profiles', () => {
    const frontendRecs = getFallbackRecommendations(createFrontendProfile()).recommendations;
    const dataRecs = getFallbackRecommendations(createDataProfile()).recommendations;
    const mechanicalRecs = getFallbackRecommendations(createMechanicalProfile()).recommendations;

    expect(frontendRecs.map((rec) => rec.title)).toEqual([
      'Frontend Engineer',
      'UI Engineer',
      'Product Engineer',
    ]);

    expect(dataRecs.map((rec) => rec.title)).toEqual([
      'Data Analyst',
      'Analytics Engineer',
      'Business Intelligence Developer',
    ]);

    expect(mechanicalRecs.map((rec) => rec.title)).toEqual([
      'CAD Design Engineer',
      'Product Design Engineer',
      'Manufacturing Engineer',
    ]);

    expect(frontendRecs[0].skillGapAnalysis.currentSkills).toEqual(expect.arrayContaining(['React', 'TypeScript']));
    expect(dataRecs[0].skillGapAnalysis.currentSkills).toEqual(expect.arrayContaining(['SQL', 'Python']));
    expect(mechanicalRecs[0].skillGapAnalysis.currentSkills).toEqual(expect.arrayContaining(['AutoCAD', 'SolidWorks']));

    expect(frontendRecs[0].justification).toContain('frontend');
    expect(dataRecs[0].justification).toContain('Data');
    expect(mechanicalRecs[0].justification).toContain('Mechanical');
  });
});
