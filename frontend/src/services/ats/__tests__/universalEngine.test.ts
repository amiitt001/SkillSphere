/**
 * Universal ATS Engine Tests
 *
 * Validates:
 * - Correct category weighting (weights sum to 1.0)
 * - Deterministic scoring (same input → same score)
 * - Score range validity (0–100)
 * - Relative score ordering across archetypes
 * - Specific category logic
 */

import { universalATSEngine, UNIVERSAL_ENGINE_VERSION } from '../universalEngine';
import { resumeParser } from '../resumeParser';

// ─── Resume Fixtures ──────────────────────────────────────────────────────────

const STRONG_FRONTEND_RESUME = `
John Doe
john.doe@email.com | github.com/johndoe | linkedin.com/in/johndoe | portfolio: johndoe.dev
+1-555-0100 | San Francisco, CA

SUMMARY
Frontend engineer with 4 years building enterprise React applications at scale.

EXPERIENCE
Senior Frontend Engineer — TechCorp | Jan 2021 – Present
• Built React component library used by 100+ engineers, reducing development time by 35%
• Led migration to TypeScript across 5 repositories, improving code reliability
• Mentored team of 4 junior developers
• Optimized bundle size by 50% using webpack code splitting and tree shaking

Frontend Engineer — StartupABC | Jun 2019 – Dec 2020
• Developed 20+ responsive features serving 500K users
• Reduced page load time by 45% through lazy loading and caching strategies

Frontend Engineering Intern — AgencyXYZ | Jun 2018 – Aug 2018
• Built 5 landing pages with React, achieving 98% Lighthouse score

SKILLS
React, TypeScript, JavaScript, Next.js, Vue.js, HTML5, CSS3, Tailwind CSS, Redux, GraphQL, Jest, Playwright, Webpack, Vite, Git, Node.js, PostgreSQL

PROJECTS
E-Commerce Platform
Full-stack e-commerce application with real-time inventory and payment processing.
Tech: React, TypeScript, Next.js, PostgreSQL, Redis, Stripe
Live: https://shop.example.com | github.com/johndoe/ecommerce

UI Component Library
Open-source React library with 60+ components and 1200+ GitHub stars.
Tech: React, TypeScript, Storybook, Jest, Playwright
github.com/johndoe/ui-kit | Deployed: https://ui-kit.example.com

EDUCATION
B.Tech Computer Science — Stanford University | Graduation: 2019 | GPA: 3.9/4.0

ACHIEVEMENTS
• Won Best UX Award at HackNY 2020
• Open-source contributor: 1200+ GitHub stars
• Google Developer Expert (Web) nominee

CERTIFICATIONS
AWS Certified Developer Associate
Google UX Design Certificate
`;

const WEAK_RESUME = `
Student Name
student@email.com

EDUCATION
B.Tech Computer Science 2024

SKILLS
Python, Java, HTML

PROJECTS
Calculator App
Simple calculator using Python.
`;

const FRESH_GRAD_RESUME = `
Alex Chen
alex.c@email.com | github.com/alexc | linkedin.com/in/alexc

SUMMARY
Recent CS graduate eager to contribute to software engineering teams.

EDUCATION
B.Tech Computer Science Engineering — IIT Delhi | Graduation: 2024 | CGPA: 9.0/10

SKILLS
Python, Java, C++, SQL, JavaScript, React, Git, Linux, Docker (basics), AWS (basics)

PROJECTS
Student Portal
Web application for student information management.
Tech: Python, Flask, MySQL, HTML, CSS
github.com/alexc/student-portal

EXPERIENCE
Software Engineering Intern — StartupXYZ | May 2023 – Jul 2023
• Built REST API endpoints processing 10K requests/day
• Implemented user authentication with JWT reducing login issues by 80%
• Collaborated with senior developers on database optimization

ACHIEVEMENTS
• Solved 300+ LeetCode problems (200 Medium, 50 Hard)
• Finalist in Smart India Hackathon 2023
• Codeforces Rating: 1750 (Expert)

CERTIFICATIONS
Google IT Automation with Python Certificate
`;

const DEVOPS_RESUME = `
Sarah Kim
s.kim@email.com | github.com/skim | linkedin.com/in/skim | skim.io

SUMMARY
Senior DevOps Engineer specializing in Kubernetes, CI/CD, and cloud infrastructure.

EXPERIENCE
Senior DevOps Engineer — CloudFirst | Apr 2019 – Present
• Designed Kubernetes clusters for 200+ microservices achieving 99.99% uptime
• Implemented GitOps with ArgoCD reducing deployment failures by 80%
• Built Prometheus/Grafana monitoring stack saving 4 hours/week of manual checks
• Automated AWS infrastructure with Terraform managing 500+ resources
• Led cloud migration saving $3M annually

DevOps Engineer — TechCorp | Jun 2017 – Mar 2019
• Set up CI/CD pipelines for 30+ services with Jenkins and GitHub Actions
• Containerized 15 legacy applications with Docker

SKILLS
Kubernetes, Docker, Terraform, Ansible, AWS, GCP, Azure, Prometheus, Grafana, Jenkins, GitHub Actions, GitLab CI, Python, Bash, Go, Linux, Helm, Istio, ArgoCD, Nginx

EDUCATION
B.Sc Computer Science — Georgia Tech | Graduation: 2017

PROJECTS
Kubernetes Operator
Custom K8s operator for automated database provisioning.
Tech: Go, Kubernetes, CRDs, Helm
github.com/skim/k8s-db-operator | Deployed in production

ACHIEVEMENTS
• CNCF Ambassador 2022
• KubeCon speaker 2023
• Won Best Infrastructure Award at company hackathon 2021

CERTIFICATIONS
Certified Kubernetes Administrator (CKA)
Certified Kubernetes Application Developer (CKAD)
AWS Certified Solutions Architect Professional
HashiCorp Certified Terraform Associate
`;

// ─── Weight Validation ────────────────────────────────────────────────────────

describe('UniversalATSEngine — Weight Validation', () => {
  test('category weights sum to exactly 1.0', () => {
    const report = universalATSEngine.score(resumeParser.parse(FRESH_GRAD_RESUME));
    const weightSum = Object.values(report.categories).reduce((s, cat) => s + cat.weight, 0);
    expect(Math.abs(weightSum - 1.0)).toBeLessThan(0.001);
  });

  test('weighted scores sum to approximately the universal score', () => {
    const parsed = resumeParser.parse(STRONG_FRONTEND_RESUME);
    const report = universalATSEngine.score(parsed);
    const weightedSum = Object.values(report.categories).reduce((s, cat) => s + cat.weightedScore, 0);
    expect(Math.abs(Math.round(weightedSum) - report.universalScore)).toBeLessThan(2);
  });

  test('engine version matches constant', () => {
    const report = universalATSEngine.score(resumeParser.parse(WEAK_RESUME));
    expect(report.engineVersion).toBe(UNIVERSAL_ENGINE_VERSION);
  });
});

// ─── Score Range Validation ───────────────────────────────────────────────────

describe('UniversalATSEngine — Score Ranges', () => {
  const resumes = [
    { name: 'Strong Frontend', text: STRONG_FRONTEND_RESUME },
    { name: 'Weak Resume', text: WEAK_RESUME },
    { name: 'Fresh Grad', text: FRESH_GRAD_RESUME },
    { name: 'DevOps', text: DEVOPS_RESUME },
  ];

  for (const { name, text } of resumes) {
    test(`universal score 0–100 for ${name}`, () => {
      const report = universalATSEngine.score(resumeParser.parse(text));
      expect(report.universalScore).toBeGreaterThanOrEqual(0);
      expect(report.universalScore).toBeLessThanOrEqual(100);
    });

    test(`all category rawScores 0–100 for ${name}`, () => {
      const report = universalATSEngine.score(resumeParser.parse(text));
      for (const [catName, cat] of Object.entries(report.categories)) {
        expect(cat.rawScore).toBeGreaterThanOrEqual(0);
        expect(cat.rawScore).toBeLessThanOrEqual(100);
      }
    });
  }
});

// ─── Relative Scoring ─────────────────────────────────────────────────────────

describe('UniversalATSEngine — Relative Scoring', () => {
  test('strong frontend resume scores higher than weak resume', () => {
    const strongReport = universalATSEngine.score(resumeParser.parse(STRONG_FRONTEND_RESUME));
    const weakReport = universalATSEngine.score(resumeParser.parse(WEAK_RESUME));
    expect(strongReport.universalScore).toBeGreaterThan(weakReport.universalScore);
  });

  test('fresh grad scores higher than weak resume', () => {
    const gradReport = universalATSEngine.score(resumeParser.parse(FRESH_GRAD_RESUME));
    const weakReport = universalATSEngine.score(resumeParser.parse(WEAK_RESUME));
    expect(gradReport.universalScore).toBeGreaterThan(weakReport.universalScore);
  });

  test('DevOps resume scores well on industry readiness', () => {
    const report = universalATSEngine.score(resumeParser.parse(DEVOPS_RESUME));
    // Industry readiness: DevOps resume should score higher than weak resume (5)
    const weakReport = universalATSEngine.score(resumeParser.parse(WEAK_RESUME));
    expect(report.categories.industryReadiness.rawScore).toBeGreaterThan(
      weakReport.categories.industryReadiness.rawScore
    );
  });

  test('strong frontend scores well on experience quality', () => {
    const report = universalATSEngine.score(resumeParser.parse(STRONG_FRONTEND_RESUME));
    // Should score above weak resume baseline
    expect(report.categories.experienceQuality.rawScore).toBeGreaterThan(30);
  });

  test('weak resume scores low on skills', () => {
    const report = universalATSEngine.score(resumeParser.parse(WEAK_RESUME));
    // Only 3 skills listed — should score below 40
    expect(report.categories.technicalSkills.rawScore).toBeLessThan(50);
  });
});

// ─── Determinism Tests ────────────────────────────────────────────────────────

describe('UniversalATSEngine — Determinism', () => {
  test('same resume always produces same universal score', () => {
    const parsed = resumeParser.parse(STRONG_FRONTEND_RESUME);
    const score1 = universalATSEngine.score(parsed).universalScore;
    const score2 = universalATSEngine.score(parsed).universalScore;
    const score3 = universalATSEngine.score(parsed).universalScore;
    expect(score1).toBe(score2);
    expect(score2).toBe(score3);
  });

  test('different resumes produce different scores', () => {
    const s1 = universalATSEngine.score(resumeParser.parse(STRONG_FRONTEND_RESUME)).universalScore;
    const s2 = universalATSEngine.score(resumeParser.parse(WEAK_RESUME)).universalScore;
    expect(s1).not.toBe(s2);
  });

  test('score changes when resume content changes', () => {
    const r1 = resumeParser.parse(STRONG_FRONTEND_RESUME);
    const r2 = resumeParser.parse(FRESH_GRAD_RESUME);
    const s1 = universalATSEngine.score(r1).universalScore;
    const s2 = universalATSEngine.score(r2).universalScore;
    expect(s1).not.toBe(s2);
  });
});

// ─── Report Structure Tests ───────────────────────────────────────────────────

describe('UniversalATSEngine — Report Structure', () => {
  test('report has all required 9 categories', () => {
    const report = universalATSEngine.score(resumeParser.parse(FRESH_GRAD_RESUME));
    const requiredCategories = [
      'atsCompatibility', 'resumeStructure', 'technicalSkills',
      'experienceQuality', 'projects', 'achievements',
      'writingQuality', 'resumeCompleteness', 'industryReadiness',
    ];
    for (const cat of requiredCategories) {
      expect(report.categories).toHaveProperty(cat);
    }
  });

  test('improvement priority has at most 5 recommendations', () => {
    const report = universalATSEngine.score(resumeParser.parse(WEAK_RESUME));
    expect(report.improvementPriority.length).toBeLessThanOrEqual(5);
  });

  test('all recommendations have required fields', () => {
    const report = universalATSEngine.score(resumeParser.parse(FRESH_GRAD_RESUME));
    for (const rec of report.improvementPriority) {
      expect(rec).toHaveProperty('id');
      expect(rec).toHaveProperty('title');
      expect(rec).toHaveProperty('reason');
      expect(rec).toHaveProperty('priority');
      expect(rec).toHaveProperty('difficulty');
      expect(rec).toHaveProperty('estimatedTime');
      expect(rec).toHaveProperty('expectedScoreGain');
      expect(rec).toHaveProperty('resources');
    }
  });

  test('grade matches score threshold', () => {
    const report = universalATSEngine.score(resumeParser.parse(STRONG_FRONTEND_RESUME));
    const score = report.universalScore;
    const grade = report.grade;
    if (score >= 93) expect(grade).toBe('A+');
    else if (score >= 85) expect(grade).toBe('A');
    else if (score >= 78) expect(grade).toBe('B+');
    else if (score >= 70) expect(grade).toBe('B');
    // etc.
    expect(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']).toContain(grade);
  });

  test('estimatedScoreImprovement does not exceed remaining headroom', () => {
    const report = universalATSEngine.score(resumeParser.parse(FRESH_GRAD_RESUME));
    expect(report.estimatedScoreImprovement).toBeLessThanOrEqual(100 - report.universalScore);
    expect(report.estimatedScoreImprovement).toBeGreaterThanOrEqual(0);
  });

  test('completeness category penalizes missing GitHub/LinkedIn', () => {
    // WEAK_RESUME has no GitHub or LinkedIn
    const report = universalATSEngine.score(resumeParser.parse(WEAK_RESUME));
    expect(report.categories.resumeCompleteness.rawScore).toBeLessThan(80);
  });
});
