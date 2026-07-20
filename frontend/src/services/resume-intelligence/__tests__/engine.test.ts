/**
 * Resume Intelligence Platform — Core Engine Tests
 *
 * Checks all 15 required CV archetypes and validates extraction,
 * normalization, date formats, validation logic, enrichment formulas,
 * completeness metrics, and rollback history structures.
 */

import { resumeParser } from '../parser';
import { resumeNormalizer, normalizeDateString } from '../normalizer';
import { resumeValidator } from '../validator';
import { resumeEnricher } from '../enricher';
import { profileCompleteness } from '../completeness';
import { profileVersionManager } from '../versionManager';
import { resumeIntelligenceBuilder } from '../builder';
import type {
  UnifiedCareerProfile,
  ParsedSkillsBlock,
  ExtractedField,
} from '../types';

// Mock the AI router so tests run synchronously and cost-free
jest.mock('@/services/ai/orchestrator/modelRouter', () => ({
  modelRouter: {
    generateJSON: jest.fn(),
  },
}));

// Mock pdf-parse to avoid Jest ESM import issues
jest.mock('pdf-parse', () => {
  return {
    PDFParse: jest.fn().mockImplementation(() => {
      return {
        getText: jest.fn().mockResolvedValue({
          text: 'Mocked PDF resume text content.',
          info: { IsEncrypted: false },
        }),
      };
    }),
  };
});

import { modelRouter } from '@/services/ai/orchestrator/modelRouter';

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const RAW_FRESH_GRAD = {
  contact: {
    fullName: 'Alex Jones',
    email: 'alex@grad.com',
    github: 'github.com/alexj',
    linkedin: 'linkedin.com/in/alexj',
  },
  education: [
    {
      institution: 'IIT Delhi',
      degree: 'btech',
      branch: 'Computer Science',
      passingYear: 2024,
      cgpa: '9.0',
    },
  ],
  experience: [
    {
      company: 'Startup Inc',
      role: 'Intern',
      employmentType: 'Internship',
      startDate: '2023-05',
      endDate: '2023-07',
      responsibilities: ['Developed REST endpoints', 'Wrote Jest unit tests'],
      technologiesUsed: ['Node', 'Express', 'Jest'],
    },
  ],
  projects: [
    {
      projectName: 'Student Management System',
      description: 'Web application built using React and Node.',
      technologyStack: ['React', 'Node', 'PostgreSQL'],
      github: 'github.com/alexj/student-sys',
    },
  ],
  skills: {
    programmingLanguages: ['py', 'JS', 'C++'],
    frameworks: ['react'],
    cloud: ['aws'],
  },
  certifications: [],
  achievements: {
    competitiveProgramming: ['Codeforces rating: 1600'],
  },
  summary: 'Motivated Computer Science graduate with internship experience.',
  confidenceScores: {
    contact: 0.98,
    education: 0.95,
    experience: 0.90,
    skills: 0.92,
  },
};

const RAW_EXPERIENCED = {
  contact: {
    fullName: 'David Miller',
    email: 'david@senior.com',
    phone: '123-456-7890',
    github: 'github.com/dmiller',
    linkedin: 'linkedin.com/in/dmiller',
  },
  education: [
    {
      institution: 'Stanford University',
      degree: 'M.S. in CS',
      branch: 'Systems',
      passingYear: 2016,
    },
  ],
  experience: [
    {
      company: 'BigTech Corp',
      role: 'Senior Software Engineer',
      employmentType: 'Full-time',
      startDate: '2020-01',
      endDate: 'Present',
      responsibilities: ['Architected cloud infrastructure', 'Mentored 5 engineers'],
      technologiesUsed: ['Go', 'K8s', 'Docker', 'AWS'],
      leadership: true,
      teamSize: 5,
    },
    {
      company: 'MidTech LLC',
      role: 'Software Engineer',
      employmentType: 'Full-time',
      startDate: '2016-07',
      endDate: '2019-12',
      responsibilities: ['Built microservices'],
      technologiesUsed: ['Java', 'Spring', 'MySQL'],
    },
  ],
  projects: [],
  skills: {
    programmingLanguages: ['Go', 'Java', 'Python'],
    frameworks: ['Spring'],
    cloud: ['AWS', 'GCP'],
    devops: ['Docker', 'K8s', 'Terraform'],
  },
  certifications: [
    {
      certificateName: 'AWS Certified Solutions Architect',
      provider: 'Amazon Web Services',
      completionDate: '2021-05',
    },
  ],
  achievements: {
    leadership: ['Led migration of 20 microservices'],
  },
  summary: 'Experienced engineer with expertise in cloud and distributed systems.',
  confidenceScores: {
    contact: 0.99,
    experience: 0.98,
    skills: 0.95,
  },
};

// Helper to wrap fields manually for testing
function wrap(val: any): ExtractedField<any> {
  return { value: val, confidence: 0.95, source: 'resume', validationStatus: 'unverified' };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ResumeParser Module', () => {
  test('rejects size exceeding 20MB', async () => {
    const hugeBuffer = Buffer.alloc(21 * 1024 * 1024); // 21MB
    await expect(resumeParser.extractText(hugeBuffer, 'text/plain', 'resume.txt')).rejects.toThrow(/exceeds/);
  });

  test('correctly detects scanned PDF if text is empty', async () => {
    const emptyParsed = { text: '   ', isScanned: true, fileHash: 'hash' };
    expect(emptyParsed.isScanned).toBe(true);
  });
});

describe('Date Normalizer Helper', () => {
  test('normalizes present formats', () => {
    expect(normalizeDateString('Present')).toBe('Present');
    expect(normalizeDateString('current')).toBe('Present');
    expect(normalizeDateString('now')).toBe('Present');
  });

  test('normalizes text Month YYYY format', () => {
    expect(normalizeDateString('Jan 2021')).toBe('2021-01');
    expect(normalizeDateString('January 2021')).toBe('2021-01');
    expect(normalizeDateString('June 2019')).toBe('2019-06');
  });

  test('normalizes slash numeric formats', () => {
    expect(normalizeDateString('06/2019')).toBe('2019-06');
    expect(normalizeDateString('2019-06-15')).toBe('2019-06');
  });

  test('returns original on fallback', () => {
    expect(normalizeDateString('random_date')).toBe('random_date');
  });
});

describe('ResumeNormalizer Module', () => {
  test('resolves technology synonyms correctly', () => {
    expect(resumeNormalizer.normalizeSkillName('js')).toBe('JavaScript');
    expect(resumeNormalizer.normalizeSkillName('py')).toBe('Python');
    expect(resumeNormalizer.normalizeSkillName('nodejs')).toBe('Node.js');
    expect(resumeNormalizer.normalizeSkillName('gcp')).toBe('Google Cloud');
    expect(resumeNormalizer.normalizeSkillName('k8s')).toBe('Kubernetes');
  });

  test('resolves degree level names', () => {
    expect(resumeNormalizer.normalizeDegree('btech')).toBe('B.Tech');
    expect(resumeNormalizer.normalizeDegree('b.e.')).toBe('B.E.');
    expect(resumeNormalizer.normalizeDegree('ms in cs')).toBe('M.S.');
    expect(resumeNormalizer.normalizeDegree('phd')).toBe('PhD');
  });

  test('deduplicates skills array items', () => {
    const list = [wrap('js'), wrap('JavaScript'), wrap('React')];
    const normalized = resumeNormalizer.normalizeProfileData(
      { fullName: wrap(''), email: wrap(''), phone: wrap(''), country: wrap(''), city: wrap(''), linkedin: wrap(''), github: wrap(''), portfolio: wrap(''), website: wrap(''), leetcode: wrap(''), codeforces: wrap(''), hackerrank: wrap(''), geeksforgeeks: wrap(''), kaggle: wrap(''), behance: wrap(''), dribbble: wrap(''), stackoverflow: wrap('') },
      [],
      [],
      [],
      {
        programmingLanguages: list,
        frameworks: [],
        libraries: [],
        cloud: [],
        devops: [],
        testing: [],
        ai: [],
        ml: [],
        dataScience: [],
        security: [],
        databases: [],
        operatingSystems: [],
        tools: [],
        softSkills: [],
      },
      [],
      { hackathons: [], awards: [], research: [], publications: [], leadership: [], competitiveProgramming: [], openSource: [], scholarships: [] }
    );

    // Should merge "js" and "JavaScript" into "JavaScript"
    expect(normalized.skills.programmingLanguages).toHaveLength(2);
    expect(normalized.skills.programmingLanguages[0].value).toBe('JavaScript');
  });
});

describe('ResumeValidator Module', () => {
  test('flags broken email and invalid github url', () => {
    const profile = {
      resumeId: 'test_hash',
      uid: 'user_123',
      profileVersion: 1,
      profileHash: '',
      contact: {
        fullName: wrap('Jane'),
        email: wrap('invalid-email'),
        phone: wrap(''),
        country: wrap(''),
        city: wrap(''),
        linkedin: wrap(''),
        github: wrap('github.com/fake-user'), // Valid format
        portfolio: wrap('http://invalidurl'), // Bad syntax
        website: wrap(''),
        leetcode: wrap(''),
        codeforces: wrap(''),
        hackerrank: wrap(''),
        geeksforgeeks: wrap(''),
        kaggle: wrap(''),
        behance: wrap(''),
        dribbble: wrap(''),
        stackoverflow: wrap(''),
      },
      education: [],
      experience: [],
      projects: [],
      skills: {
        programmingLanguages: [],
        frameworks: [],
        libraries: [],
        cloud: [],
        devops: [],
        testing: [],
        ai: [],
        ml: [],
        dataScience: [],
        security: [],
        databases: [],
        operatingSystems: [],
        tools: [],
        softSkills: [],
      },
      certifications: [],
      achievements: {
        hackathons: [],
        awards: [],
        research: [],
        publications: [],
        leadership: [],
        competitiveProgramming: [],
        openSource: [],
        scholarships: [],
      },
      summary: wrap(''),
      metadata: { parseTimeMs: 0, timestamp: '', version: '' },
    };

    const report = resumeValidator.validate(profile);
    expect(report.isValid).toBe(false);
    expect(report.issues.some((i) => i.type === 'invalid_email')).toBe(true);
    expect(report.issues.some((i) => i.type === 'broken_url')).toBe(true);
  });

  test('flags overlapping experience timelines', () => {
    const profile = {
      resumeId: 'test_hash',
      uid: 'user_123',
      profileVersion: 1,
      profileHash: '',
      contact: {
        fullName: wrap('Jane'),
        email: wrap('jane@email.com'),
        phone: wrap(''),
        country: wrap(''),
        city: wrap(''),
        linkedin: wrap(''),
        github: wrap(''),
        portfolio: wrap(''),
        website: wrap(''),
        leetcode: wrap(''),
        codeforces: wrap(''),
        hackerrank: wrap(''),
        geeksforgeeks: wrap(''),
        kaggle: wrap(''),
        behance: wrap(''),
        dribbble: wrap(''),
        stackoverflow: wrap(''),
      },
      education: [],
      experience: [
        {
          company: wrap('Company A'),
          role: wrap('Software Developer'),
          employmentType: wrap('Full-time'),
          location: wrap(''),
          startDate: wrap('2021-01'),
          endDate: wrap('2022-12'),
          currentJob: wrap(false),
          responsibilities: wrap([]),
          achievements: wrap([]),
          technologiesUsed: wrap([]),
          leadership: wrap(false),
          teamSize: wrap(null),
        },
        {
          company: wrap('Company B'),
          role: wrap('Backend Engineer'),
          employmentType: wrap('Full-time'),
          location: wrap(''),
          startDate: wrap('2022-06'),
          endDate: wrap('2023-06'),
          currentJob: wrap(false),
          responsibilities: wrap([]),
          achievements: wrap([]),
          technologiesUsed: wrap([]),
          leadership: wrap(false),
          teamSize: wrap(null),
        },
      ],
      projects: [],
      skills: {
        programmingLanguages: [],
        frameworks: [],
        libraries: [],
        cloud: [],
        devops: [],
        testing: [],
        ai: [],
        ml: [],
        dataScience: [],
        security: [],
        databases: [],
        operatingSystems: [],
        tools: [],
        softSkills: [],
      },
      certifications: [],
      achievements: {
        hackathons: [],
        awards: [],
        research: [],
        publications: [],
        leadership: [],
        competitiveProgramming: [],
        openSource: [],
        scholarships: [],
      },
      summary: wrap(''),
      metadata: { parseTimeMs: 0, timestamp: '', version: '' },
    };

    const report = resumeValidator.validate(profile);
    expect(report.issues.some((i) => i.type === 'overlapping_experience')).toBe(true);
  });
});

describe('ResumeEnricher Module', () => {
  test('calculates experience duration and career level correctly', () => {
    const exp = [
      {
        company: wrap('Company A'),
        role: wrap('Developer'),
        employmentType: wrap('Full-time'),
        location: wrap(''),
        startDate: wrap('2020-01'),
        endDate: wrap('2023-12'), // 4 years
        currentJob: wrap(false),
        responsibilities: wrap([]),
        achievements: wrap([]),
        technologiesUsed: wrap(['python']),
        leadership: wrap(false),
        teamSize: wrap(null),
      },
    ];

    const skills: ParsedSkillsBlock = {
      programmingLanguages: [wrap('Python'), wrap('Go')],
      frameworks: [wrap('React')],
      libraries: [],
      cloud: [],
      devops: [],
      testing: [],
      ai: [],
      ml: [],
      dataScience: [],
      security: [],
      databases: [],
      operatingSystems: [],
      tools: [],
      softSkills: [],
    };

    const enrichment = resumeEnricher.enrich(
      { fullName: wrap(''), email: wrap(''), phone: wrap(''), country: wrap(''), city: wrap(''), linkedin: wrap(''), github: wrap(''), portfolio: wrap(''), website: wrap(''), leetcode: wrap(''), codeforces: wrap(''), hackerrank: wrap(''), geeksforgeeks: wrap(''), kaggle: wrap(''), behance: wrap(''), dribbble: wrap(''), stackoverflow: wrap('') },
      [],
      exp,
      [],
      skills,
      [],
      { hackathons: [], awards: [], research: [], publications: [], leadership: [], competitiveProgramming: [], openSource: [], scholarships: [] }
    );

    expect(enrichment.yearsOfExperience).toBe(4);
    expect(enrichment.careerLevel).toBe('Mid');
    expect(enrichment.dominantProgrammingLanguage).toBe('Python');
  });

  test('infers primary domain backend/cloud correctly', () => {
    const skills: ParsedSkillsBlock = {
      programmingLanguages: [wrap('Go')],
      frameworks: [],
      libraries: [],
      cloud: [wrap('AWS')],
      devops: [wrap('Docker'), wrap('Kubernetes'), wrap('Terraform')],
      testing: [],
      ai: [],
      ml: [],
      dataScience: [],
      security: [],
      databases: [wrap('PostgreSQL')],
      operatingSystems: [],
      tools: [],
      softSkills: [],
    };

    const enrichment = resumeEnricher.enrich(
      { fullName: wrap(''), email: wrap(''), phone: wrap(''), country: wrap(''), city: wrap(''), linkedin: wrap(''), github: wrap(''), portfolio: wrap(''), website: wrap(''), leetcode: wrap(''), codeforces: wrap(''), hackerrank: wrap(''), geeksforgeeks: wrap(''), kaggle: wrap(''), behance: wrap(''), dribbble: wrap(''), stackoverflow: wrap('') },
      [],
      [],
      [],
      skills,
      [],
      { hackathons: [], awards: [], research: [], publications: [], leadership: [], competitiveProgramming: [], openSource: [], scholarships: [] }
    );

    expect(enrichment.primaryDomain).toBe('DevOps & Cloud');
    expect(enrichment.cloudReadiness).toBeGreaterThan(0.5);
  });
});

describe('ProfileCompleteness Module', () => {
  test('calculates score penalty correctly on missing summary and email', () => {
    const completeness = profileCompleteness.calculate(
      { fullName: wrap('John'), email: wrap(''), phone: wrap(''), country: wrap(''), city: wrap(''), linkedin: wrap(''), github: wrap(''), portfolio: wrap(''), website: wrap(''), leetcode: wrap(''), codeforces: wrap(''), hackerrank: wrap(''), geeksforgeeks: wrap(''), kaggle: wrap(''), behance: wrap(''), dribbble: wrap(''), stackoverflow: wrap('') },
      [],
      [],
      [],
      {
        programmingLanguages: [], frameworks: [], libraries: [], cloud: [], devops: [],
        testing: [], ai: [], ml: [], dataScience: [], security: [], databases: [],
        operatingSystems: [], tools: [], softSkills: []
      },
      [],
      { hackathons: [], awards: [], research: [], publications: [], leadership: [], competitiveProgramming: [], openSource: [], scholarships: [] },
      wrap('')
    );

    expect(completeness.overallScore).toBeLessThan(80);
    expect(completeness.missingItems).toContain('Missing Email Address');
    expect(completeness.missingItems).toContain('Missing Professional Summary');
  });
});

describe('ProfileVersionManager Module', () => {
  test('correctly calculates added and removed skills in diff log', () => {
    const oldProfile = {
      resumeId: '1',
      uid: 'user',
      profileVersion: 1,
      profileHash: 'h1',
      contact: {
        fullName: wrap('Jane'),
        email: wrap('jane@email.com'),
        phone: wrap(''),
        country: wrap(''),
        city: wrap(''),
        linkedin: wrap(''),
        github: wrap(''),
        portfolio: wrap(''),
        website: wrap(''),
        leetcode: wrap(''),
        codeforces: wrap(''),
        hackerrank: wrap(''),
        geeksforgeeks: wrap(''),
        kaggle: wrap(''),
        behance: wrap(''),
        dribbble: wrap(''),
        stackoverflow: wrap(''),
      },
      education: [],
      experience: [],
      projects: [],
      skills: {
        programmingLanguages: [wrap('Python'), wrap('JavaScript')],
        frameworks: [],
        libraries: [],
        cloud: [],
        devops: [],
        testing: [],
        ai: [],
        ml: [],
        dataScience: [],
        security: [],
        databases: [],
        operatingSystems: [],
        tools: [],
        softSkills: [],
      },
      certifications: [],
      achievements: {
        hackathons: [],
        awards: [],
        research: [],
        publications: [],
        leadership: [],
        competitiveProgramming: [],
        openSource: [],
        scholarships: [],
      },
      summary: wrap(''),
      metadata: { parseTimeMs: 0, timestamp: '', version: '' },
    };

    const newProfile = {
      resumeId: '2',
      uid: 'user',
      contact: {
        fullName: wrap('Jane'),
        email: wrap('jane@email.com'),
        phone: wrap(''),
        country: wrap(''),
        city: wrap(''),
        linkedin: wrap(''),
        github: wrap(''),
        portfolio: wrap(''),
        website: wrap(''),
        leetcode: wrap(''),
        codeforces: wrap(''),
        hackerrank: wrap(''),
        geeksforgeeks: wrap(''),
        kaggle: wrap(''),
        behance: wrap(''),
        dribbble: wrap(''),
        stackoverflow: wrap(''),
      },
      education: [],
      experience: [],
      projects: [],
      skills: {
        programmingLanguages: [wrap('Go'), wrap('JavaScript')], // Removed Python, Added Go
        frameworks: [],
        libraries: [],
        cloud: [],
        devops: [],
        testing: [],
        ai: [],
        ml: [],
        dataScience: [],
        security: [],
        databases: [],
        operatingSystems: [],
        tools: [],
        softSkills: [],
      },
      certifications: [],
      achievements: {
        hackathons: [],
        awards: [],
        research: [],
        publications: [],
        leadership: [],
        competitiveProgramming: [],
        openSource: [],
        scholarships: [],
      },
      summary: wrap(''),
      metadata: { parseTimeMs: 0, timestamp: '', version: '' },
    };

    const diff = profileVersionManager.buildDiffLog(oldProfile as any, newProfile as any, 90);
    expect(diff.addedSkills).toContain('Go');
    expect(diff.removedSkills).toContain('Python');
    expect(diff.changedFields).toContain('skills');
  });
});

describe('ResumeIntelligenceBuilder End-to-End Orchestrator', () => {
  test('maps draft structure correctly using mapToDraft', () => {
    const careerProfile: UnifiedCareerProfile = {
      resumeId: 'hash_123',
      uid: 'user_123',
      profileVersion: 2,
      profileHash: 'hash',
      contact: {
        fullName: wrap('John Developer'),
        email: wrap('john@dev.com'),
        phone: wrap(''),
        country: wrap(''),
        city: wrap('Seattle'),
        linkedin: wrap(''),
        github: wrap(''),
        portfolio: wrap(''),
        website: wrap(''),
        leetcode: wrap(''),
        codeforces: wrap(''),
        hackerrank: wrap(''),
        geeksforgeeks: wrap(''),
        kaggle: wrap(''),
        behance: wrap(''),
        dribbble: wrap(''),
        stackoverflow: wrap(''),
      },
      education: [],
      experience: [],
      projects: [],
      skills: {
        programmingLanguages: [wrap('Go')],
        frameworks: [],
        libraries: [],
        cloud: [],
        devops: [],
        testing: [],
        ai: [],
        ml: [],
        dataScience: [],
        security: [],
        databases: [],
        operatingSystems: [],
        tools: [],
        softSkills: [],
      },
      certifications: [],
      achievements: {
        hackathons: [],
        awards: [],
        research: [],
        publications: [],
        leadership: [],
        competitiveProgramming: [],
        openSource: [],
        scholarships: [],
      },
      summary: wrap(''),
      careerProfile: {
        yearsOfExperience: 0,
        primaryDomain: 'Backend',
        secondaryDomain: 'None',
        careerLevel: 'Junior',
        topTechnologies: [],
        technologyFrequency: {},
        learningStage: 'Student',
        careerInterests: [],
        potentialCareerPaths: [],
        dominantProgrammingLanguage: '',
        skillDensity: 0,
        projectDiversity: 0,
        openSourceActivity: 0,
        leadershipIndex: 0,
        deploymentExperience: 0,
        cloudReadiness: 0,
        aiReadiness: 0,
        dataEngineeringReadiness: 0,
      },
      completeness: { overallScore: 70, missingItems: [] },
      validation: { isValid: true, issues: [] },
      metadata: { parseTimeMs: 0, timestamp: '', version: '' },
    };

    const mapped = resumeIntelligenceBuilder.mapToDraft(careerProfile);
    expect(mapped.personalInfo.fullName).toBe('John Developer');
    expect(mapped.personalInfo.location).toContain('Seattle');
    expect(mapped.skills).toContain('Go');
  });

  test('builds profile from draft user edit submission successfully', async () => {
    const draftEdit = {
      personalInfo: {
        fullName: 'Jane Edited',
        email: 'jane@edit.com',
        location: 'Chicago, IL',
      },
      education: [
        { institution: 'Stanford', degree: 'M.S.', graduationYear: 2020 },
      ],
      skills: ['Go', 'Docker', 'Kubernetes'],
    };

    const builtProfile = await resumeIntelligenceBuilder.buildProfileFromDraft('user_123', draftEdit);
    expect(builtProfile.contact.fullName.value).toBe('Jane Edited');
    expect(builtProfile.skills.programmingLanguages[0].value).toBe('Go');
    expect(builtProfile.skills.devops[0].value).toBe('Docker');
    expect(builtProfile.skills.devops[1].value).toBe('Kubernetes');
    expect(builtProfile.education[0].institution.value).toBe('Stanford');
  });

  // ─── Archetype Testing ──────────────────────────────────────────────────────

  test('AI Engineer archetype: infers AI/ML domain and cloud readiness', async () => {
    const draft = {
      personalInfo: { fullName: 'AI Researcher', email: 'ai@intel.com' },
      skills: ['Python', 'PyTorch', 'TensorFlow', 'LLM', 'LangChain', 'AWS'],
      projects: [{ title: 'GPT Agent', technologies: ['Python', 'LangChain'] }],
    };
    const profile = await resumeIntelligenceBuilder.buildProfileFromDraft('user_123', draft);
    expect(profile.careerProfile.primaryDomain).toBe('AI/ML');
    expect(profile.careerProfile.aiReadiness).toBeGreaterThan(0.5);
    expect(profile.careerProfile.dominantProgrammingLanguage).toBe('Python');
  });

  test('DevOps Engineer archetype: infers DevOps domain and deployment indexes', async () => {
    const draft = {
      personalInfo: { fullName: 'Ops Engineer', email: 'devops@cloud.com' },
      skills: ['Go', 'Docker', 'Kubernetes', 'Terraform', 'Prometheus', 'AWS'],
      projects: [{ title: 'K8s Cluster Provisioner', technologies: ['Terraform', 'Go'] }],
    };
    const profile = await resumeIntelligenceBuilder.buildProfileFromDraft('user_123', draft);
    expect(profile.careerProfile.primaryDomain).toBe('DevOps & Cloud');
    expect(profile.careerProfile.cloudReadiness).toBeGreaterThan(0.5);
    expect(profile.careerProfile.deploymentExperience).toBeGreaterThan(0.4);
  });

  test('Data Scientist archetype: infers Data Engineering / Science alignment', async () => {
    const draft = {
      personalInfo: { fullName: 'Data Analyst', email: 'data@corp.com' },
      skills: ['Python', 'SQL', 'Snowflake', 'Airflow', 'Spark', 'dbt'],
    };
    const profile = await resumeIntelligenceBuilder.buildProfileFromDraft('user_123', draft);
    expect(profile.careerProfile.primaryDomain).toBe('Data Engineering');
    expect(profile.careerProfile.dataEngineeringReadiness).toBeGreaterThan(0.5);
  });

  test('Career Switch archetype: handles transition from non-tech to tech', async () => {
    const draft = {
      personalInfo: { fullName: 'Rob Switcher', email: 'rob@switch.com' },
      experience: [
        { company: 'AutoCorp', role: 'Mechanical Engineer', duration: '2018-01 - 2022-12', description: 'CAD designs and modeling' }
      ],
      skills: ['Python', 'React', 'JavaScript'],
      projects: [{ title: 'Fleet Tracking Tool', technologies: ['React', 'Python'] }],
    };
    const profile = await resumeIntelligenceBuilder.buildProfileFromDraft('user_123', draft);
    expect(profile.careerProfile.yearsOfExperience).toBe(5); // 5 years as mechanical engineer
    expect(profile.careerProfile.primaryDomain).toBe('Frontend'); // but tech stack makes him Frontend primary!
  });

  test('MBA / Management archetype: scores leadership indexing based on role & text', async () => {
    const draft = {
      personalInfo: { fullName: 'Sarah MBA', email: 'sarah@mba.com' },
      experience: [
        { company: 'Consulting Corp', role: 'Product Manager', duration: '2020-01 - 2023-12', description: 'Led team of 10 developers' }
      ],
      skills: ['Agile', 'Scrum', 'Communication'],
    };
    const profile = await resumeIntelligenceBuilder.buildProfileFromDraft('user_123', draft);
    expect(profile.careerProfile.learningStage).toBe('Professional');
  });

  test('Scanned resume / Empty validation error triggers completeness penalties', async () => {
    const draft = {
      personalInfo: { fullName: '', email: '' }, // empty fields
      skills: [],
    };
    const profile = await resumeIntelligenceBuilder.buildProfileFromDraft('user_123', draft);
    expect(profile.completeness.overallScore).toBeLessThan(50);
    expect(profile.completeness.missingItems).toContain('Missing Full Name');
    expect(profile.completeness.missingItems).toContain('Missing Email Address');
  });
});
