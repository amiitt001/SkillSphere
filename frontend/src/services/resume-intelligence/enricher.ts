/**
 * Resume Intelligence — Profile Enrichment Engine
 *
 * Infers years of experience, career level, domains (primary/secondary),
 * top technologies, readiness scores, and leadership/OSS activity indexes.
 */

import type {
  ParsedContactInfo,
  ParsedEducationEntry,
  ParsedExperienceEntry,
  ParsedProjectEntry,
  ParsedSkillsBlock,
  ParsedCertification,
  ParsedAchievementsBlock,
  CareerProfileEnrichment,
} from './types';

// Domain classifications based on technology terms
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  'Frontend': ['react', 'next.js', 'vue.js', 'angular', 'svelte', 'html', 'css', 'tailwind css', 'javascript', 'typescript', 'figma', 'webpack', 'vite', 'bootstrap'],
  'Backend': ['node.js', 'express.js', 'go', 'python', 'java', 'c#', '.net', 'django', 'flask', 'fastapi', 'spring', 'grpc', 'graphql', 'rest', 'microservices', 'websockets'],
  'AI/ML': ['tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'keras', 'langchain', 'openai api', 'generative ai', 'machine learning', 'deep learning', 'nlp', 'computer vision', 'vector database', 'pinecone', 'llm', 'python'],
  'DevOps & Cloud': ['aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform', 'jenkins', 'github actions', 'gitlab ci', 'ansible', 'prometheus', 'grafana', 'nginx', 'linux', 'bash', 'ci/cd', 'helm', 'argocd'],
  'Data Engineering': ['sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'snowflake', 'databricks', 'spark', 'hadoop', 'airflow', 'dbt', 'etl', 'kafka'],
  'Mobile': ['flutter', 'react native', 'swift', 'kotlin', 'ios', 'android'],
};

const PROGRAMMING_LANGUAGES = ['javascript', 'typescript', 'python', 'go', 'rust', 'java', 'c++', 'c#', 'php', 'ruby', 'scala', 'swift', 'kotlin', 'sql', 'bash', 'r'];

function parseDateObject(dateStr: string): Date | null {
  if (!dateStr || /present/i.test(dateStr)) return new Date();
  const parts = dateStr.split('-');
  const year = parseInt(parts[0]);
  const month = parts[1] ? parseInt(parts[1]) - 1 : 0;
  if (isNaN(year)) return null;
  return new Date(year, month);
}

export class ResumeEnricher {
  enrich(
    contact: ParsedContactInfo,
    education: ParsedEducationEntry[],
    experience: ParsedExperienceEntry[],
    projects: ParsedProjectEntry[],
    skills: ParsedSkillsBlock,
    certifications: ParsedCertification[],
    achievements: ParsedAchievementsBlock
  ): CareerProfileEnrichment {
    // 1. Calculate Non-Overlapping Years of Experience
    const yearsOfExperience = this.calculateYearsOfExperience(experience);

    // 2. Identify Technology Frequency & Dominant Language
    const technologyFrequency: Record<string, number> = {};
    const allSkillsList = [
      ...skills.programmingLanguages.map((s) => s.value),
      ...skills.frameworks.map((s) => s.value),
      ...skills.libraries.map((s) => s.value),
      ...skills.cloud.map((s) => s.value),
      ...skills.devops.map((s) => s.value),
      ...skills.databases.map((s) => s.value),
      ...skills.tools.map((s) => s.value),
    ].map((s) => s.trim());

    // Count skills directly listed
    for (const skill of allSkillsList) {
      const key = skill.toLowerCase();
      technologyFrequency[key] = (technologyFrequency[key] || 0) + 2; // base listed weight
    }

    // Count technologies mentioned in experience
    for (const exp of experience) {
      for (const t of exp.technologiesUsed.value) {
        const key = t.toLowerCase();
        technologyFrequency[key] = (technologyFrequency[key] || 0) + 1;
      }
    }

    // Count technologies mentioned in projects
    for (const p of projects) {
      for (const t of p.technologyStack.value) {
        const key = t.toLowerCase();
        technologyFrequency[key] = (technologyFrequency[key] || 0) + 1.5;
      }
    }

    // Find top technologies (by weight, rounded)
    const sortedTechs = Object.entries(technologyFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => allSkillsList.find((s) => s.toLowerCase() === name) || name);

    const topTechnologies = sortedTechs.slice(0, 6);

    // Find dominant language
    let dominantProgrammingLanguage = 'None';
    let maxLangWeight = 0;
    for (const lang of PROGRAMMING_LANGUAGES) {
      const w = technologyFrequency[lang] || 0;
      if (w > maxLangWeight) {
        maxLangWeight = w;
        dominantProgrammingLanguage = allSkillsList.find((s) => s.toLowerCase() === lang) || lang;
      }
    }

    // 3. Infer Primary & Secondary Domains
    const domainScores: Record<string, number> = {
      'Frontend': 0, 'Backend': 0, 'AI/ML': 0, 'DevOps & Cloud': 0, 'Data Engineering': 0, 'Mobile': 0,
    };

    for (const [tech, weight] of Object.entries(technologyFrequency)) {
      for (const [domainName, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
        if (keywords.includes(tech)) {
          domainScores[domainName] += weight;
        }
      }
    }

    const sortedDomains = Object.entries(domainScores)
      .sort((a, b) => b[1] - a[1]);

    const primaryDomain = sortedDomains[0] && sortedDomains[0][1] > 0 ? sortedDomains[0][0] : 'General Software';
    const secondaryDomain = sortedDomains[1] && sortedDomains[1][1] > 0 ? sortedDomains[1][0] : 'None';

    // 4. Career Level & Learning Stage
    let careerLevel = 'Junior';
    let learningStage = 'Student';

    if (yearsOfExperience >= 8) {
      careerLevel = 'Lead / Principal';
      learningStage = 'Manager';
    } else if (yearsOfExperience >= 5) {
      careerLevel = 'Senior';
      learningStage = 'Professional';
    } else if (yearsOfExperience >= 2) {
      careerLevel = 'Mid';
      learningStage = 'Professional';
    } else if (yearsOfExperience > 0) {
      careerLevel = 'Junior';
      learningStage = 'Entry-Level';
    } else {
      careerLevel = 'Entry-Level';
      learningStage = 'Student';
    }

    // 5. Readiness Index Scores (0.0 to 1.0)
    const computeDomainReadiness = (domain: string) => {
      const keywords = DOMAIN_KEYWORDS[domain] || [];
      const userKeywordsCount = keywords.filter((k) => technologyFrequency[k] !== undefined).length;
      return userKeywordsCount === 0 ? 0 : Math.min(1.0, userKeywordsCount / 6); // standard target is knowing 6 core tools
    };

    const cloudReadiness = computeDomainReadiness('DevOps & Cloud');
    const aiReadiness = computeDomainReadiness('AI/ML');
    const dataEngineeringReadiness = computeDomainReadiness('Data Engineering');

    // 6. Project Diversity & Skill Density
    const projectDiversity = projects.length === 0
      ? 0
      : Math.min(1.0, new Set(projects.flatMap((p) => p.technologyStack.value.map((t) => t.toLowerCase()))).size / 8);

    const skillDensity = Math.min(1.0, allSkillsList.length / 25);

    // 7. Activity & Leadership Indices (0.0 to 1.0)
    const openSourceActivity = Math.min(
      1.0,
      (projects.filter((p) => p.github.value).length * 0.3) +
        (achievements.openSource.length * 0.4) +
        (contact.github.value ? 0.3 : 0)
    );

    const leadershipIndex = Math.min(
      1.0,
      (experience.filter((e) => e.leadership.value).length * 0.4) +
        (achievements.leadership.length * 0.4) +
        (experience.some((e) => e.teamSize.value && e.teamSize.value > 0) ? 0.2 : 0)
    );

    const deploymentExperience = Math.min(
      1.0,
      (projects.filter((p) => p.deployment.value || p.liveDemo.value).length * 0.5) +
        (skills.devops.length > 0 ? 0.3 : 0) +
        (skills.cloud.length > 0 ? 0.2 : 0)
    );

    // 8. Career Interests & Paths
    const careerInterests = [primaryDomain];
    if (secondaryDomain !== 'None') careerInterests.push(secondaryDomain);

    const potentialCareerPaths: string[] = [];
    if (primaryDomain === 'Frontend') {
      potentialCareerPaths.push('Senior Frontend Engineer', 'UI Architect');
    } else if (primaryDomain === 'Backend') {
      potentialCareerPaths.push('Senior Backend Developer', 'Systems Architect');
    } else if (primaryDomain === 'AI/ML') {
      potentialCareerPaths.push('MLOps Engineer', 'AI Research Scientist');
    } else if (primaryDomain === 'DevOps & Cloud') {
      potentialCareerPaths.push('Site Reliability Engineer', 'Cloud Infrastructure Architect');
    } else if (primaryDomain === 'Data Engineering') {
      potentialCareerPaths.push('Data Architect', 'Big Data Engineer');
    } else {
      potentialCareerPaths.push('Senior Software Engineer', 'Full-Stack Developer');
    }

    return {
      yearsOfExperience,
      primaryDomain,
      secondaryDomain,
      careerLevel,
      topTechnologies,
      technologyFrequency,
      learningStage,
      careerInterests,
      potentialCareerPaths,
      dominantProgrammingLanguage,
      skillDensity,
      projectDiversity,
      openSourceActivity,
      leadershipIndex,
      deploymentExperience,
      cloudReadiness,
      aiReadiness,
      dataEngineeringReadiness,
    };
  }

  private calculateYearsOfExperience(experience: ParsedExperienceEntry[]): number {
    const intervals: Array<{ start: Date; end: Date }> = [];

    for (const exp of experience) {
      const s = parseDateObject(exp.startDate.value);
      const e = parseDateObject(exp.endDate.value);
      if (s && e && s <= e) {
        intervals.push({ start: s, end: e });
      }
    }

    if (intervals.length === 0) return 0;

    // Sort intervals by start date
    intervals.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Merge overlapping intervals to get total duration
    const merged: Array<{ start: Date; end: Date }> = [];
    let current = intervals[0];

    for (let i = 1; i < intervals.length; i++) {
      const next = intervals[i];
      if (next.start <= current.end) {
        // Overlap, extend the current interval
        if (next.end > current.end) {
          current.end = next.end;
        }
      } else {
        // Disjoint, push current and start new
        merged.push(current);
        current = next;
      }
    }
    merged.push(current);

    // Calculate total duration in months
    let totalMonths = 0;
    for (const interval of merged) {
      const diffY = interval.end.getFullYear() - interval.start.getFullYear();
      const diffM = interval.end.getMonth() - interval.start.getMonth();
      totalMonths += (diffY * 12) + diffM + 1; // inclusive of start month
    }

    return Math.round((totalMonths / 12) * 10) / 10;
  }
}

export const resumeEnricher = new ResumeEnricher();
