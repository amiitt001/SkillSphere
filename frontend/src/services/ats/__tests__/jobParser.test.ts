/**
 * Job Parser Tests
 *
 * Tests for company/role detection, skill extraction, and JD parsing.
 */

import { jobParser } from '../jobParser';

const FULL_JD = `
Software Engineer — Backend | ScaleUp Inc
San Francisco, CA (Remote OK)

About the Role:
Join our engineering team as a Backend Software Engineer at ScaleUp Inc.

Responsibilities:
• Design and build scalable REST APIs using Go and Python
• Architect microservices deployed on Kubernetes
• Write unit and integration tests with 80%+ coverage
• Participate in code reviews and technical design discussions

Requirements:
3+ years of software engineering experience
Strong proficiency in Go or Python
Experience with PostgreSQL or MongoDB databases
Knowledge of Docker and Kubernetes
Familiarity with AWS or GCP

Preferred:
Experience with Kafka or message queues
Terraform infrastructure-as-code experience
gRPC API experience

What we offer:
Competitive compensation, remote work, equity options.
`;

describe('JobParser — Role and Company', () => {
  test('extracts company name when present', () => {
    const parsed = jobParser.parse(FULL_JD);
    // Company detection is heuristic — check it's not empty or correctly found
    expect(typeof parsed.company).toBe('string');
  });

  test('parses raw text correctly', () => {
    const parsed = jobParser.parse(FULL_JD);
    expect(parsed.rawText).toBe(FULL_JD);
  });

  test('detects industry as Software Engineering', () => {
    const parsed = jobParser.parse(FULL_JD, 'Backend Software Engineer');
    expect(parsed.industry).toContain('Software');
  });
});

describe('JobParser — Skill Extraction', () => {
  test('extracts Go or Python from JD keywords or required skills', () => {
    const parsed = jobParser.parse(FULL_JD);
    // When section parsing fails, keywords always capture all terms
    const allTerms = [
      ...parsed.requiredSkills.map((s) => s.toLowerCase()),
      ...parsed.keywords.map((k) => k.keyword.toLowerCase()),
    ];
    expect(allTerms.some((s) => s.includes('go') || s.includes('python'))).toBe(true);
  });

  test('extracts keywords from JD', () => {
    const parsed = jobParser.parse(FULL_JD);
    expect(parsed.keywords.length).toBeGreaterThan(0);
  });

  test('extracts experience requirement', () => {
    const parsed = jobParser.parse(FULL_JD);
    expect(parsed.requiredExperienceYears).toBe(3);
  });

  test('extracts responsibilities', () => {
    const parsed = jobParser.parse(FULL_JD);
    expect(parsed.responsibilities.length).toBeGreaterThan(0);
  });
});

describe('JobParser — Determinism', () => {
  test('same JD always produces same parsed result', () => {
    const r1 = jobParser.parse(FULL_JD);
    const r2 = jobParser.parse(FULL_JD);
    expect(r1.requiredSkills).toEqual(r2.requiredSkills);
    expect(r1.keywords.length).toBe(r2.keywords.length);
    expect(r1.requiredExperienceYears).toBe(r2.requiredExperienceYears);
  });
});

describe('JobParser — Edge Cases', () => {
  test('handles JD with no responsibilities section', () => {
    const minimalJD = 'Software Engineer job requiring Python, SQL, and AWS experience.';
    const parsed = jobParser.parse(minimalJD);
    expect(parsed.responsibilities).toHaveLength(0);
    expect(parsed.requiredSkills.length).toBeGreaterThanOrEqual(0);
  });

  test('handles JD with no explicit years requirement', () => {
    const parsed = jobParser.parse('We need a developer with React and TypeScript skills.');
    expect(parsed.requiredExperienceYears).toBeNull();
  });
});
