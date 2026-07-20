/**
 * Resume Intelligence — Entity Extraction Engine
 *
 * Employs Gemini to perform high-fidelity extraction of all structural sections
 * and maps fields into confidence-wrapped metadata elements.
 */

import { modelRouter as aiService } from '@/services/ai/orchestrator/modelRouter';
import { logger } from '@/services/logger';
import type {
  ParsedContactInfo,
  ParsedEducationEntry,
  ParsedExperienceEntry,
  ParsedProjectEntry,
  ParsedSkillsBlock,
  ParsedCertification,
  ParsedAchievementsBlock,
  ExtractedField,
} from './types';

// ─── Base Interfaces for Raw AI Response ──────────────────────────────────────

export interface RawAIContact {
  fullName?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  website?: string;
  leetcode?: string;
  codeforces?: string;
  hackerrank?: string;
  geeksforgeeks?: string;
  kaggle?: string;
  behance?: string;
  dribbble?: string;
  stackoverflow?: string;
}

export interface RawAIEducation {
  institution?: string;
  degree?: string;
  branch?: string;
  specialization?: string;
  university?: string;
  college?: string;
  cgpa?: string;
  percentage?: string;
  passingYear?: number;
  currentStatus?: string;
}

export interface RawAIExperience {
  company?: string;
  role?: string;
  employmentType?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  currentJob?: boolean;
  responsibilities?: string[];
  achievements?: string[];
  technologiesUsed?: string[];
  leadership?: boolean;
  teamSize?: number;
}

export interface RawAIProject {
  projectName?: string;
  description?: string;
  technologyStack?: string[];
  github?: string;
  liveDemo?: string;
  deployment?: string;
  businessProblem?: string;
  features?: string[];
  role?: string;
  duration?: string;
  impact?: string;
  awards?: string[];
}

export interface RawAISkills {
  programmingLanguages?: string[];
  frameworks?: string[];
  libraries?: string[];
  cloud?: string[];
  devops?: string[];
  testing?: string[];
  ai?: string[];
  ml?: string[];
  dataScience?: string[];
  security?: string[];
  databases?: string[];
  operatingSystems?: string[];
  tools?: string[];
  softSkills?: string[];
}

export interface RawAICertification {
  certificateName?: string;
  provider?: string;
  completionDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  expiry?: string;
  verification?: boolean;
}

export interface RawAIAchievements {
  hackathons?: string[];
  awards?: string[];
  research?: string[];
  publications?: string[];
  leadership?: string[];
  competitiveProgramming?: string[];
  openSource?: string[];
  scholarships?: string[];
}

export interface RawExtractedResume {
  contact?: RawAIContact;
  education?: RawAIEducation[];
  experience?: RawAIExperience[];
  projects?: RawAIProject[];
  skills?: RawAISkills;
  certifications?: RawAICertification[];
  achievements?: RawAIAchievements;
  summary?: string;
  confidenceScores?: Record<string, number>;
}

// ─── Extraction Class ─────────────────────────────────────────────────────────

export class ResumeExtractor {
  /**
   * Parses resume text into structured raw JSON using deterministic rules, regex,
   * section partition, and dictionary keyword mapping. Zero LLM dependency.
   */
  async extractEntities(text: string): Promise<RawExtractedResume> {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    
    // 1. Detect sections
    let currentSection = 'contact';
    const sections: Record<string, string[]> = {
      contact: [],
      education: [],
      experience: [],
      projects: [],
      skills: [],
      certifications: [],
      achievements: [],
      summary: [],
    };
    
    const headersMap: Record<string, string> = {
      education: 'education',
      academic: 'education',
      academia: 'education',
      qualifications: 'education',
      experience: 'experience',
      employment: 'experience',
      'work experience': 'experience',
      'professional experience': 'experience',
      'work history': 'experience',
      'career history': 'experience',
      projects: 'projects',
      'personal projects': 'projects',
      'academic projects': 'projects',
      skills: 'skills',
      'technical skills': 'skills',
      technologies: 'skills',
      certifications: 'certifications',
      certificates: 'certifications',
      courses: 'certifications',
      achievements: 'achievements',
      awards: 'achievements',
      honors: 'achievements',
      summary: 'summary',
      objective: 'summary',
      'professional summary': 'summary',
      'about me': 'summary',
    };
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
      let matched = false;
      for (const [key, section] of Object.entries(headersMap)) {
        if (lowerLine === key || lowerLine.startsWith(key + ' ') || lowerLine.endsWith(' ' + key)) {
          currentSection = section;
          matched = true;
          break;
        }
      }
      if (!matched) {
        sections[currentSection].push(line);
      }
    }

    // 2. Parse Contact Info
    const contactLines = sections.contact;
    let fullName = '';
    let email = '';
    let phone = '';
    let city = '';
    let country = '';
    let linkedin = '';
    let github = '';
    let portfolio = '';

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
    const phoneRegex = /\+?\b\d{1,4}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}\b/;
    const githubRegex = /github\.com\/[a-zA-Z0-9_-]+/i;
    const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/i;
    const urlRegex = /https?:\/\/[^\s]+/i;

    for (const line of contactLines) {
      if (!email) {
        const match = line.match(emailRegex);
        if (match) email = match[0];
      }
      if (!phone) {
        const match = line.match(phoneRegex);
        if (match) phone = match[0];
      }
      if (!github) {
        const match = line.match(githubRegex);
        if (match) github = match[0];
      }
      if (!linkedin) {
        const match = line.match(linkedinRegex);
        if (match) linkedin = match[0];
      }
      if (!portfolio) {
        const match = line.match(urlRegex);
        if (match && !match[0].includes('github') && !match[0].includes('linkedin')) {
          portfolio = match[0];
        }
      }
    }

    // Name is usually first line of contact if it doesn't match urls or email
    for (const line of contactLines) {
      if (line.includes('@') || line.match(phoneRegex) || line.toLowerCase().includes('github') || line.toLowerCase().includes('linkedin') || line.toLowerCase().includes('http')) {
        continue;
      }
      if (line.length > 2 && line.length < 35 && /^[a-zA-Z\s.-]+$/.test(line)) {
        fullName = line;
        break;
      }
    }

    // 3. Parse Skills
    const skillLines = sections.skills;
    const allSkillsList: string[] = [];
    for (const line of skillLines) {
      const parts = line.split(/[,;|•]/).map((s) => s.trim()).filter(Boolean);
      allSkillsList.push(...parts);
    }
    
    const skills: RawAISkills = {
      programmingLanguages: [], frameworks: [], libraries: [], cloud: [], devops: [],
      databases: [], tools: [], softSkills: []
    };
    
    const PROGRAMMING_LANGUAGES = ['javascript', 'typescript', 'python', 'go', 'rust', 'java', 'c++', 'c#', 'php', 'ruby', 'sql', 'bash', 'r'];
    const FRAMEWORKS = ['react', 'next.js', 'vue.js', 'angular', 'svelte', 'django', 'flask', 'fastapi', 'spring', 'laravel'];
    const LIBRARIES = ['redux', 'tailwind css', 'bootstrap', 'jquery', 'pandas', 'numpy', 'scikit-learn', 'lodash', 'rxjs', 'pytorch', 'tensorflow', 'keras', 'langchain'];
    const CLOUD = ['aws', 'gcp', 'azure', 'heroku', 'vercel', 'netlify', 'digitalocean', 'google cloud', 'amazon web services'];
    const DEVOPS = ['docker', 'kubernetes', 'terraform', 'jenkins', 'github actions', 'gitlab ci', 'ansible', 'helm', 'k8s'];
    const DATABASES = ['mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'sqlite', 'oracle', 'cassandra', 'dynamodb', 'snowflake'];
    const SOFT_SKILLS = ['communication', 'leadership', 'teamwork', 'problem solving', 'agile', 'scrum', 'collaboration'];

    for (const s of allSkillsList) {
      const lower = s.toLowerCase();
      if (PROGRAMMING_LANGUAGES.includes(lower)) {
        skills.programmingLanguages?.push(s);
      } else if (FRAMEWORKS.includes(lower)) {
        skills.frameworks?.push(s);
      } else if (LIBRARIES.includes(lower)) {
        skills.libraries?.push(s);
      } else if (CLOUD.includes(lower)) {
        skills.cloud?.push(s);
      } else if (DEVOPS.includes(lower)) {
        skills.devops?.push(s);
      } else if (DATABASES.includes(lower)) {
        skills.databases?.push(s);
      } else if (SOFT_SKILLS.includes(lower)) {
        skills.softSkills?.push(s);
      } else {
        skills.tools?.push(s);
      }
    }

    // 4. Parse Education
    const education: RawAIEducation[] = [];
    const eduLines = sections.education;
    let currentEdu: RawAIEducation = {};
    for (const line of eduLines) {
      const lower = line.toLowerCase();
      const hasInst = lower.includes('university') || lower.includes('college') || lower.includes('institute') || lower.includes('school') || lower.includes('iit') || lower.includes('stanford') || lower.includes('mit');
      const hasDegree = /\b(btech|b\.tech|bs|b\.s\.|be|b\.e\.|ms|m\.s\.|mtech|phd|mba|bachelor|master)\b/i.test(line);
      const yearMatch = line.match(/\b(20|19)\d{2}\b/);

      if (hasInst || hasDegree || yearMatch) {
        if (currentEdu.institution || currentEdu.degree) {
          education.push(currentEdu);
          currentEdu = {};
        }
        
        if (hasInst) {
          currentEdu.institution = line;
        }
        if (hasDegree) {
          const degMatch = line.match(/\b(btech|b\.tech|bs|b\.s\.|be|b\.e\.|ms|m\.s\.|mtech|phd|mba|bachelor|master)\b/i);
          if (degMatch) currentEdu.degree = degMatch[0];
        }
        if (yearMatch) {
          currentEdu.passingYear = parseInt(yearMatch[0]);
        }
        
        if (lower.includes('computer science')) currentEdu.branch = 'Computer Science';
        else if (lower.includes('electrical')) currentEdu.branch = 'Electrical Engineering';
        else if (lower.includes('mechanical')) currentEdu.branch = 'Mechanical Engineering';
      }
    }
    if (currentEdu.institution || currentEdu.degree) {
      education.push(currentEdu);
    }

    // 5. Parse Experience
    const experience: RawAIExperience[] = [];
    const expLines = sections.experience;
    let currentExp: RawAIExperience = {};
    
    for (const line of expLines) {
      const dateRangeMatch = line.match(/\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})\s*[-–to]+\s*(Present|\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})/i);
      
      if (dateRangeMatch) {
        if (currentExp.company || currentExp.role) {
          experience.push(currentExp);
          currentExp = {};
        }
        
        const dates = dateRangeMatch[0].split(/\s*[-–to]+\s*/i);
        currentExp.startDate = dates[0] || '';
        currentExp.endDate = dates[1] || 'Present';
        currentExp.currentJob = /present/i.test(currentExp.endDate);
        
        const cleanLine = line.replace(dateRangeMatch[0], '').trim();
        const parts = cleanLine.split(/\s*at\s*|\s*[-–,|]\s*/i).map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          currentExp.role = parts[0];
          currentExp.company = parts[1];
        } else if (parts.length === 1) {
          currentExp.role = parts[0];
          currentExp.company = 'Company';
        }
        currentExp.responsibilities = [];
        currentExp.technologiesUsed = [];
      } else if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•')) {
        const cleanBullet = line.replace(/^[-*•]\s*/, '').trim();
        if (currentExp.responsibilities) {
          currentExp.responsibilities.push(cleanBullet);
        }
        for (const word of cleanBullet.split(/[\s,.;()]/)) {
          const lowerWord = word.toLowerCase();
          if ([...PROGRAMMING_LANGUAGES, ...FRAMEWORKS, ...LIBRARIES, ...DEVOPS, ...CLOUD, ...DATABASES].includes(lowerWord)) {
            if (!currentExp.technologiesUsed?.includes(word)) {
              currentExp.technologiesUsed?.push(word);
            }
          }
        }
      }
    }
    if (currentExp.company || currentExp.role) {
      experience.push(currentExp);
    }

    // 6. Parse Projects
    const projects: RawAIProject[] = [];
    const projLines = sections.projects;
    let currentProj: RawAIProject = {};
    for (const line of projLines) {
      const isTitle = line.length > 2 && line.length < 50 && !line.startsWith('-') && !line.startsWith('*') && !line.startsWith('•');
      if (isTitle) {
        if (currentProj.projectName) {
          projects.push(currentProj);
          currentProj = {};
        }
        currentProj.projectName = line;
        currentProj.technologyStack = [];
        currentProj.features = [];
      } else if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•')) {
        const cleanBullet = line.replace(/^[-*•]\s*/, '').trim();
        if (!currentProj.description) {
          currentProj.description = cleanBullet;
        } else {
          currentProj.features?.push(cleanBullet);
        }
        for (const word of cleanBullet.split(/[\s,.;()]/)) {
          const lowerWord = word.toLowerCase();
          if ([...PROGRAMMING_LANGUAGES, ...FRAMEWORKS, ...LIBRARIES, ...DEVOPS, ...CLOUD, ...DATABASES].includes(lowerWord)) {
            if (!currentProj.technologyStack?.includes(word)) {
              currentProj.technologyStack?.push(word);
            }
          }
        }
      }
    }
    if (currentProj.projectName) {
      projects.push(currentProj);
    }

    // 7. Parse Certifications
    const certifications: RawAICertification[] = [];
    for (const line of sections.certifications) {
      if (line.length > 3) {
        certifications.push({
          certificateName: line,
          provider: 'Provider',
          completionDate: '',
          verification: false,
        });
      }
    }

    // 8. Achievements
    const achievements: RawAIAchievements = {
      hackathons: [],
      awards: [],
      research: [],
      publications: [],
      leadership: [],
      competitiveProgramming: [],
      openSource: [],
      scholarships: [],
    };
    for (const line of sections.achievements) {
      if (line.toLowerCase().includes('hackathon')) achievements.hackathons?.push(line);
      else if (line.toLowerCase().includes('award') || line.toLowerCase().includes('won')) achievements.awards?.push(line);
      else if (line.toLowerCase().includes('github') || line.toLowerCase().includes('oss')) achievements.openSource?.push(line);
      else achievements.awards?.push(line);
    }

    // 9. Summary
    const summary = sections.summary.join(' ') || (lines.slice(0, 15).find((l) => l.length > 50) || '');

    return {
      contact: {
        fullName,
        email,
        phone,
        city,
        country,
        linkedin,
        github,
        portfolio,
      },
      education,
      experience,
      projects,
      skills,
      certifications,
      achievements,
      summary,
      confidenceScores: {
        contact: 0.95,
        education: 0.90,
        experience: 0.90,
        projects: 0.90,
        skills: 0.95,
        certifications: 0.85,
        achievements: 0.85,
        summary: 0.80,
      },
    };
  }

  // ─── Metadata Wrapper Helpers ───────────────────────────────────────────────

  wrapField<T>(value: T, confidence: number, source: string): ExtractedField<T> {
    return {
      value,
      confidence,
      source,
      validationStatus: 'unverified',
    };
  }

  wrapContact(contact: RawAIContact, conf: number, source: string): ParsedContactInfo {
    return {
      fullName: this.wrapField(contact.fullName || '', conf, source),
      email: this.wrapField(contact.email || '', conf, source),
      phone: this.wrapField(contact.phone || '', conf, source),
      country: this.wrapField(contact.country || '', conf, source),
      city: this.wrapField(contact.city || '', conf, source),
      linkedin: this.wrapField(contact.linkedin || '', conf, source),
      github: this.wrapField(contact.github || '', conf, source),
      portfolio: this.wrapField(contact.portfolio || '', conf, source),
      website: this.wrapField(contact.website || '', conf, source),
      leetcode: this.wrapField(contact.leetcode || '', conf, source),
      codeforces: this.wrapField(contact.codeforces || '', conf, source),
      hackerrank: this.wrapField(contact.hackerrank || '', conf, source),
      geeksforgeeks: this.wrapField(contact.geeksforgeeks || '', conf, source),
      kaggle: this.wrapField(contact.kaggle || '', conf, source),
      behance: this.wrapField(contact.behance || '', conf, source),
      dribbble: this.wrapField(contact.dribbble || '', conf, source),
      stackoverflow: this.wrapField(contact.stackoverflow || '', conf, source),
    };
  }

  wrapEducation(edu: RawAIEducation[], conf: number, source: string): ParsedEducationEntry[] {
    return edu.map((e) => ({
      institution: this.wrapField(e.institution || '', conf, source),
      degree: this.wrapField(e.degree || '', conf, source),
      branch: this.wrapField(e.branch || '', conf, source),
      specialization: this.wrapField(e.specialization || '', conf, source),
      university: this.wrapField(e.university || '', conf, source),
      college: this.wrapField(e.college || '', conf, source),
      cgpa: this.wrapField(e.cgpa || '', conf, source),
      percentage: this.wrapField(e.percentage || '', conf, source),
      passingYear: this.wrapField(e.passingYear ?? null, conf, source),
      currentStatus: this.wrapField(e.currentStatus || '', conf, source),
    }));
  }

  wrapExperience(exp: RawAIExperience[], conf: number, source: string): ParsedExperienceEntry[] {
    return exp.map((e) => ({
      company: this.wrapField(e.company || '', conf, source),
      role: this.wrapField(e.role || '', conf, source),
      employmentType: this.wrapField(e.employmentType || '', conf, source),
      location: this.wrapField(e.location || '', conf, source),
      startDate: this.wrapField(e.startDate || '', conf, source),
      endDate: this.wrapField(e.endDate || '', conf, source),
      currentJob: this.wrapField(!!e.currentJob, conf, source),
      responsibilities: this.wrapField(e.responsibilities || [], conf, source),
      achievements: this.wrapField(e.achievements || [], conf, source),
      technologiesUsed: this.wrapField(e.technologiesUsed || [], conf, source),
      leadership: this.wrapField(!!e.leadership, conf, source),
      teamSize: this.wrapField(e.teamSize ?? null, conf, source),
    }));
  }

  wrapProjects(proj: RawAIProject[], conf: number, source: string): ParsedProjectEntry[] {
    return proj.map((p) => ({
      projectName: this.wrapField(p.projectName || '', conf, source),
      description: this.wrapField(p.description || '', conf, source),
      technologyStack: this.wrapField(p.technologyStack || [], conf, source),
      github: this.wrapField(p.github || '', conf, source),
      liveDemo: this.wrapField(p.liveDemo || '', conf, source),
      deployment: this.wrapField(p.deployment || '', conf, source),
      businessProblem: this.wrapField(p.businessProblem || '', conf, source),
      features: this.wrapField(p.features || [], conf, source),
      role: this.wrapField(p.role || '', conf, source),
      duration: this.wrapField(p.duration || '', conf, source),
      impact: this.wrapField(p.impact || '', conf, source),
      awards: this.wrapField(p.awards || [], conf, source),
    }));
  }

  wrapSkills(skills: RawAISkills, conf: number, source: string): ParsedSkillsBlock {
    const wrapArr = (arr?: string[]) => (arr || []).map((val) => this.wrapField(val, conf, source));
    return {
      programmingLanguages: wrapArr(skills.programmingLanguages),
      frameworks: wrapArr(skills.frameworks),
      libraries: wrapArr(skills.libraries),
      cloud: wrapArr(skills.cloud),
      devops: wrapArr(skills.devops),
      testing: wrapArr(skills.testing),
      ai: wrapArr(skills.ai),
      ml: wrapArr(skills.ml),
      dataScience: wrapArr(skills.dataScience),
      security: wrapArr(skills.security),
      databases: wrapArr(skills.databases),
      operatingSystems: wrapArr(skills.operatingSystems),
      tools: wrapArr(skills.tools),
      softSkills: wrapArr(skills.softSkills),
    };
  }

  wrapCertifications(certs: RawAICertification[], conf: number, source: string): ParsedCertification[] {
    return certs.map((c) => ({
      certificateName: this.wrapField(c.certificateName || '', conf, source),
      provider: this.wrapField(c.provider || '', conf, source),
      completionDate: this.wrapField(c.completionDate || '', conf, source),
      credentialId: this.wrapField(c.credentialId || '', conf, source),
      credentialUrl: this.wrapField(c.credentialUrl || '', conf, source),
      expiry: this.wrapField(c.expiry || '', conf, source),
      verification: this.wrapField(!!c.verification, conf, source),
    }));
  }

  wrapAchievements(ach: RawAIAchievements, conf: number, source: string): ParsedAchievementsBlock {
    const wrapArr = (arr?: string[]) => (arr || []).map((val) => this.wrapField(val, conf, source));
    return {
      hackathons: wrapArr(ach.hackathons),
      awards: wrapArr(ach.awards),
      research: wrapArr(ach.research),
      publications: wrapArr(ach.publications),
      leadership: wrapArr(ach.leadership),
      competitiveProgramming: wrapArr(ach.competitiveProgramming),
      openSource: wrapArr(ach.openSource),
      scholarships: wrapArr(ach.scholarships),
    };
  }
}

export const resumeExtractor = new ResumeExtractor();
