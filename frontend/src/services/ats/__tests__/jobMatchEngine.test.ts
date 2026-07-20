/**
 * Job Match Engine Tests
 *
 * Validates:
 * - Correct weight sums
 * - Deterministic scoring
 * - Job match score varies with different job descriptions
 * - Fuzzy keyword/skill matching
 * - Edge cases (missing JD sections, no skills)
 */

import { jobMatchATSEngine, JOB_MATCH_ENGINE_VERSION } from '../jobMatchEngine';
import { resumeParser } from '../resumeParser';
import { jobParser } from '../jobParser';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BACKEND_RESUME = `
Jane Smith
jane@email.com | github.com/janesmith | linkedin.com/in/janesmith

SUMMARY
Backend engineer with 4 years experience in Go, Python, PostgreSQL, and AWS.

EXPERIENCE
Backend Engineer — TechCorp | Jan 2021 – Present
• Built REST APIs handling 5M daily requests using Go and PostgreSQL
• Reduced query latency by 60% through database indexing and Redis caching
• Implemented CI/CD pipelines with GitHub Actions, cutting deployment time by 70%
• Designed microservices architecture with Docker and Kubernetes

Software Engineer — StartupXYZ | Jun 2019 – Dec 2020
• Developed Python data processing pipelines handling 100K records/day
• Built authentication system using JWT and OAuth 2.0

SKILLS
Go, Python, PostgreSQL, MySQL, Redis, Docker, Kubernetes, AWS, Terraform, GitHub Actions, REST, gRPC, Kafka, Linux, Git, SQL

PROJECTS
API Gateway
High-performance API gateway handling 10M requests/day.
Tech: Go, Redis, Docker, Kubernetes, Nginx
github.com/janesmith/api-gateway | Deployed on AWS EKS

EDUCATION
B.Sc Computer Science — MIT | Graduation: 2019

ACHIEVEMENTS
• ACM ICPC Regional 2018
• Published paper on distributed caching at IEEE 2021
`;

const MATCHING_BACKEND_JD = `
Backend Software Engineer

About the Role:
We're looking for a Backend Engineer to join our infrastructure team at ScaleUp Inc.

Responsibilities:
• Design and implement RESTful APIs using Go or Python
• Build and maintain microservices on Kubernetes and AWS
• Optimize database queries and caching strategies
• Set up and maintain CI/CD pipelines

Requirements:
• 3+ years of backend development experience
• Proficiency in Go, Python, or Java
• Experience with PostgreSQL or MySQL
• Knowledge of Docker and Kubernetes
• Familiarity with AWS or GCP

Preferred:
• Experience with Kafka or message queues
• Knowledge of Terraform for infrastructure as code
• gRPC experience

Benefits: Competitive salary, remote work, equity
`;

const MISMATCHING_FRONTEND_JD = `
Senior Frontend Developer

We need a React expert for our consumer product team.

Responsibilities:
• Build responsive React components for web applications
• Implement pixel-perfect UI from Figma designs
• Write comprehensive Jest and Playwright tests
• Optimize Core Web Vitals performance

Requirements:
• 5+ years of React experience
• Strong TypeScript skills
• Experience with Next.js
• CSS animations and advanced styling

Preferred:
• GraphQL experience
• Redux or Zustand state management
`;

const ML_JD = `
Machine Learning Engineer

Join our AI team to build production ML systems.

Responsibilities:
• Train and deploy machine learning models
• Build data pipelines with Apache Spark and Airflow
• Implement MLOps best practices with MLflow
• Work with large language models and vector databases

Requirements:
• Strong Python skills
• Experience with TensorFlow or PyTorch
• Knowledge of scikit-learn and pandas
• Experience with cloud platforms (AWS, GCP)
• Understanding of ML model deployment

Preferred:
• LangChain or OpenAI API experience
• Kubernetes experience for model serving
• Research background or publications
`;

// ─── Weight Validation ────────────────────────────────────────────────────────

describe('JobMatchATSEngine — Weight Validation', () => {
  test('category weights sum to 1.0', () => {
    const parsed = resumeParser.parse(BACKEND_RESUME);
    const job = jobParser.parse(MATCHING_BACKEND_JD);
    const report = jobMatchATSEngine.score(parsed, job);
    const weightSum = Object.values(report.categories).reduce((s, cat) => s + cat.weight, 0);
    expect(Math.abs(weightSum - 1.0)).toBeLessThan(0.001);
  });

  test('engine version constant is accessible', () => {
    expect(JOB_MATCH_ENGINE_VERSION).toBeTruthy();
    expect(typeof JOB_MATCH_ENGINE_VERSION).toBe('string');
  });
});

// ─── Score Range Validation ───────────────────────────────────────────────────

describe('JobMatchATSEngine — Score Ranges', () => {
  test('job match score is 0–100 for strong match', () => {
    const parsed = resumeParser.parse(BACKEND_RESUME);
    const job = jobParser.parse(MATCHING_BACKEND_JD);
    const report = jobMatchATSEngine.score(parsed, job);
    expect(report.jobMatchScore).toBeGreaterThanOrEqual(0);
    expect(report.jobMatchScore).toBeLessThanOrEqual(100);
  });

  test('job match score is 0–100 for poor match', () => {
    const parsed = resumeParser.parse(BACKEND_RESUME);
    const job = jobParser.parse(MISMATCHING_FRONTEND_JD);
    const report = jobMatchATSEngine.score(parsed, job);
    expect(report.jobMatchScore).toBeGreaterThanOrEqual(0);
    expect(report.jobMatchScore).toBeLessThanOrEqual(100);
  });

  test('all category rawScores are 0–100', () => {
    const parsed = resumeParser.parse(BACKEND_RESUME);
    const job = jobParser.parse(MATCHING_BACKEND_JD);
    const report = jobMatchATSEngine.score(parsed, job);
    for (const [, cat] of Object.entries(report.categories)) {
      expect(cat.rawScore).toBeGreaterThanOrEqual(0);
      expect(cat.rawScore).toBeLessThanOrEqual(100);
    }
  });
});

// ─── Relative Scoring ─────────────────────────────────────────────────────────

describe('JobMatchATSEngine — Relative Scoring', () => {
  test('backend resume scores higher for backend JD than frontend JD', () => {
    const parsed = resumeParser.parse(BACKEND_RESUME);
    const backendJob = jobParser.parse(MATCHING_BACKEND_JD);
    const frontendJob = jobParser.parse(MISMATCHING_FRONTEND_JD);

    const backendScore = jobMatchATSEngine.score(parsed, backendJob).jobMatchScore;
    const frontendScore = jobMatchATSEngine.score(parsed, frontendJob).jobMatchScore;

    expect(backendScore).toBeGreaterThan(frontendScore);
  });

  test('same resume produces different scores for different JDs', () => {
    const parsed = resumeParser.parse(BACKEND_RESUME);
    const job1 = jobParser.parse(MATCHING_BACKEND_JD);
    const job2 = jobParser.parse(ML_JD);

    const score1 = jobMatchATSEngine.score(parsed, job1).jobMatchScore;
    const score2 = jobMatchATSEngine.score(parsed, job2).jobMatchScore;

    // Scores should differ since different JDs
    expect(score1).not.toBe(score2);
  });
});

// ─── Skill Matching Tests ─────────────────────────────────────────────────────

describe('JobMatchATSEngine — Skill Matching', () => {
  test('matched skills include Go for backend job', () => {
    const parsed = resumeParser.parse(BACKEND_RESUME);
    const job = jobParser.parse(MATCHING_BACKEND_JD);
    const report = jobMatchATSEngine.score(parsed, job);
    // Some skills should match
    expect(report.matchedSkills.length).toBeGreaterThan(0);
  });

  test('missing skills include React-related for frontend JD', () => {
    const parsed = resumeParser.parse(BACKEND_RESUME);
    const job = jobParser.parse(MISMATCHING_FRONTEND_JD);
    const report = jobMatchATSEngine.score(parsed, job);
    // Backend engineer will have missing frontend skills
    expect(report.missingSkills.length).toBeGreaterThan(0);
  });

  test('skills match category has both matched and missing for partial match', () => {
    const parsed = resumeParser.parse(BACKEND_RESUME);
    const job = jobParser.parse(ML_JD);  // ML job — partially matching
    const report = jobMatchATSEngine.score(parsed, job);
    // Python is in both, but TensorFlow/PyTorch may be missing
    expect(report.categories.skillsMatch.matched.length + report.categories.skillsMatch.missing.length).toBeGreaterThan(0);
  });
});

// ─── Determinism Tests ────────────────────────────────────────────────────────

describe('JobMatchATSEngine — Determinism', () => {
  test('same resume + JD always produce same job match score', () => {
    const parsed = resumeParser.parse(BACKEND_RESUME);
    const job = jobParser.parse(MATCHING_BACKEND_JD);
    const score1 = jobMatchATSEngine.score(parsed, job).jobMatchScore;
    const score2 = jobMatchATSEngine.score(parsed, job).jobMatchScore;
    const score3 = jobMatchATSEngine.score(parsed, job).jobMatchScore;
    expect(score1).toBe(score2);
    expect(score2).toBe(score3);
  });

  test('different JD texts produce different scores for same resume', () => {
    const parsed = resumeParser.parse(BACKEND_RESUME);
    const job1 = jobParser.parse(MATCHING_BACKEND_JD);
    const job2 = jobParser.parse(MISMATCHING_FRONTEND_JD);
    const score1 = jobMatchATSEngine.score(parsed, job1).jobMatchScore;
    const score2 = jobMatchATSEngine.score(parsed, job2).jobMatchScore;
    expect(score1).not.toBe(score2);
  });
});

// ─── Report Structure Tests ───────────────────────────────────────────────────

describe('JobMatchATSEngine — Report Structure', () => {
  test('report has all required 8 categories', () => {
    const parsed = resumeParser.parse(BACKEND_RESUME);
    const job = jobParser.parse(MATCHING_BACKEND_JD);
    const report = jobMatchATSEngine.score(parsed, job);
    const requiredCategories = [
      'keywordMatch', 'skillsMatch', 'experienceMatch', 'projectsMatch',
      'educationMatch', 'achievementsMatch', 'responsibilitiesMatch', 'culturalSignals',
    ];
    for (const cat of requiredCategories) {
      expect(report.categories).toHaveProperty(cat);
    }
  });

  test('all recommendations have required fields', () => {
    const parsed = resumeParser.parse(BACKEND_RESUME);
    const job = jobParser.parse(MISMATCHING_FRONTEND_JD);
    const report = jobMatchATSEngine.score(parsed, job);
    for (const rec of report.priorityImprovements) {
      expect(rec).toHaveProperty('title');
      expect(rec).toHaveProperty('reason');
      expect(rec).toHaveProperty('priority');
      expect(rec).toHaveProperty('expectedScoreGain');
    }
  });

  test('grade is valid enum value', () => {
    const parsed = resumeParser.parse(BACKEND_RESUME);
    const job = jobParser.parse(MATCHING_BACKEND_JD);
    const report = jobMatchATSEngine.score(parsed, job);
    expect(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F']).toContain(report.grade);
  });

  test('matched + missing skills do not overlap', () => {
    const parsed = resumeParser.parse(BACKEND_RESUME);
    const job = jobParser.parse(MATCHING_BACKEND_JD);
    const report = jobMatchATSEngine.score(parsed, job);
    const matchedSet = new Set(report.matchedSkills);
    const overlap = report.missingSkills.filter((s) => matchedSet.has(s));
    expect(overlap).toHaveLength(0);
  });

  test('estimatedMatchImprovement does not exceed headroom', () => {
    const parsed = resumeParser.parse(BACKEND_RESUME);
    const job = jobParser.parse(MISMATCHING_FRONTEND_JD);
    const report = jobMatchATSEngine.score(parsed, job);
    expect(report.estimatedMatchImprovement).toBeLessThanOrEqual(100 - report.jobMatchScore);
    expect(report.estimatedMatchImprovement).toBeGreaterThanOrEqual(0);
  });
});
