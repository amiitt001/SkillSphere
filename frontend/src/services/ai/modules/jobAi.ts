/**
 * Job AI Domain Module
 * Handles all AI-powered job intelligence operations:
 *  1. analyzeJob — Match scoring + gap analysis + recommendation
 *  2. generateArtifacts — Cover letter, resume improvements, LinkedIn message,
 *                          interview roadmap, learning roadmap
 */

import { modelRouter as aiService } from '../orchestrator/modelRouter';
import { StandardAiResponse } from '../aiService';
import { logger } from '@/services/logger';
import {
  JobDescription,
  JobMatchReport,
  JobArtifacts,
  ApplicationRecommendation,
} from '@/types/job';
import { UnifiedUserProfile } from '@/types/profile';

// ─── Fallbacks ────────────────────────────────────────────────────────────────

function getFallbackMatchReport(): JobMatchReport {
  return {
    scores: { overall: 60, ats: 55, skills: 60, experience: 65, projects: 60 },
    recommendation: 'improve_first' as ApplicationRecommendation,
    recommendationReason: 'Build a few more relevant skills before applying.',
    readinessScore: 60,
    readinessEstimate: 'Ready in ~3 months',
    matchedSkills: [],
    missingSkills: [],
    matchedExperience: [],
    matchedProjects: [],
    strengths: ['Strong academic foundation'],
    gaps: ['Some required skills are missing'],
    aiInsight: 'Your profile partially matches this role. Focus on the identified skill gaps before applying.',
  };
}

function getFallbackArtifacts(job: JobDescription): JobArtifacts {
  return {
    resumeImprovements: [
      {
        section: 'Skills',
        suggestion: `Add ${job.requiredSkills.slice(0, 3).join(', ')} if you have any experience with them.`,
        impact: 'high',
      },
    ],
    coverLetter: `Dear Hiring Manager,\n\nI am excited to apply for the ${job.title} position at ${job.company}. My background aligns well with your requirements and I am eager to contribute to your team.\n\nThank you for your consideration.\n\nBest regards`,
    linkedInMessage: `Hi [Name], I came across the ${job.title} role at ${job.company} and I'm very interested. My background in [Your Field] aligns well with the requirements. Would love to connect and learn more about the opportunity!`,
    interviewRoadmap: [
      {
        topic: 'Role-specific technical skills',
        type: 'technical',
        priority: 'must-know',
        resources: ['Official documentation', 'LeetCode practice'],
        sampleQuestion: `How have you used ${job.requiredSkills[0] || 'core technologies'} in a production environment?`,
      },
    ],
    learningRoadmap: [
      {
        skill: job.requiredSkills[0] || 'Core Skill',
        duration: '4 weeks',
        resources: ['Official docs', 'YouTube tutorials'],
        milestone: `Build a small project using ${job.requiredSkills[0] || 'the skill'}`,
      },
    ],
  };
}

// ─── Profile Summarizer ───────────────────────────────────────────────────────

function summarizeProfile(profile: UnifiedUserProfile): string {
  const skills = (profile.skills || []).map((s: any) =>
    typeof s === 'string' ? s : `${s.name} (${s.experienceLevel || 'unknown'})`
  );
  const projects = (profile.projects || []).map((p: any) =>
    `${p.title}: ${p.description?.slice(0, 80) || ''} [${(p.technologies || []).join(', ')}]`
  );
  const experience = (profile.experience || []).map((e: any) =>
    `${e.role} at ${e.company} (${e.duration || 'N/A'})`
  );
  const education = (profile.education || []).map((e: any) =>
    `${e.degree} in ${e.stream} from ${e.institution}`
  );

  return [
    `Name: ${profile.personalInfo?.fullName?.value || 'Developer'}`,
    `Education: ${education.join('; ') || 'N/A'}`,
    `Skills: ${skills.join(', ') || 'N/A'}`,
    `Projects: ${projects.slice(0, 4).join(' | ') || 'N/A'}`,
    `Experience: ${experience.join('; ') || 'N/A'}`,
    `Career Goal: ${(profile as any).primaryCareerGoal || 'Not set'}`,
    `Certifications: ${(profile.certifications?.value || []).join(', ') || 'None'}`,
  ].join('\n');
}

// ─── JobAi Class ─────────────────────────────────────────────────────────────

export class JobAi {
  /**
   * Analyzes a job description against the user's Unified Profile.
   * Returns match scores, gap analysis, and application recommendation.
   */
  async analyzeJob(
    job: JobDescription,
    profile: UnifiedUserProfile
  ): Promise<StandardAiResponse<JobMatchReport>> {
    const profileSummary = summarizeProfile(profile);

    const prompt = `
You are the SkillSphere Job Intelligence Engine. Analyze the job description against the candidate's profile and produce a precise match analysis.

=== CANDIDATE PROFILE ===
${profileSummary}

=== JOB DESCRIPTION ===
Title: ${job.title}
Company: ${job.company}
Domain: ${job.domain}
Experience Required: ${job.yearsOfExperience} (${job.experienceLevel} level)
Required Skills: ${job.requiredSkills.join(', ')}
Nice-to-Have: ${job.niceSkills.join(', ')}
Responsibilities: ${job.responsibilities.slice(0, 5).join(' | ')}

=== INSTRUCTIONS ===
Calculate match scores (0-100) and return a JSON object matching EXACTLY this schema:
{
  "scores": {
    "overall": <weighted average, integer 0-100>,
    "ats": <ATS keyword match, integer 0-100>,
    "skills": <required skills covered %, integer 0-100>,
    "experience": <experience level alignment, integer 0-100>,
    "projects": <project domain relevance, integer 0-100>
  },
  "recommendation": "strong_match" | "apply_now" | "improve_first" | "reach",
  "recommendationReason": "<1-2 sentence reason>",
  "readinessScore": <integer 0-100>,
  "readinessEstimate": "<e.g. Ready now | Ready in ~2 months>",
  "matchedSkills": ["list of skills candidate has that job requires"],
  "missingSkills": [
    {
      "name": "Skill Name",
      "priority": "critical" | "high" | "medium" | "low",
      "estimatedLearningTime": "e.g. 3 weeks",
      "reason": "why this skill matters for this role"
    }
  ],
  "matchedExperience": ["relevant experience entries from profile"],
  "matchedProjects": ["relevant project names from profile"],
  "strengths": ["3-5 candidate strengths for this role"],
  "gaps": ["3-5 specific gaps to address"],
  "aiInsight": "<3 sentence personalised summary of fit and recommendation>"
}

Scoring rubric:
- strong_match: overall >= 80
- apply_now: overall 60-79
- improve_first: overall 40-59
- reach: overall < 40
`;

    return aiService.generateJSON<JobMatchReport>(
      prompt,
      getFallbackMatchReport(),
      'You are a precise job matching engine. Return only valid JSON.'
    );
  }

  /**
   * Generates all five career artifacts for the job application.
   * Should be called after analyzeJob with the match report for context.
   */
  async generateArtifacts(
    job: JobDescription,
    profile: UnifiedUserProfile,
    matchReport: JobMatchReport
  ): Promise<StandardAiResponse<JobArtifacts>> {
    const profileSummary = summarizeProfile(profile);
    const name = profile.personalInfo?.fullName?.value || 'Developer';
    const missingSkillNames = matchReport.missingSkills.map((m) => m.name).join(', ');

    const prompt = `
You are the SkillSphere Career Artifact Generator. Create five career artifacts for a candidate applying to this job.

=== CANDIDATE ===
${profileSummary}

=== JOB ===
Title: ${job.title} at ${job.company} (${job.location})
Required Skills: ${job.requiredSkills.join(', ')}
Candidate Match Score: ${matchReport.scores.overall}/100
Missing Skills: ${missingSkillNames || 'None'}
Matched Skills: ${matchReport.matchedSkills.join(', ')}

=== OUTPUT SCHEMA ===
Return a JSON object:
{
  "resumeImprovements": [
    {
      "section": "section name e.g. Skills | Experience | Projects | Summary",
      "original": "optional: current weak phrasing",
      "suggestion": "specific actionable improvement",
      "impact": "high" | "medium" | "low"
    }
  ],
  "coverLetter": "<full professional cover letter in Markdown, 3 paragraphs, ~250 words, addressed to Hiring Manager at ${job.company}>",
  "linkedInMessage": "<short LinkedIn connection message, max 300 chars, professional and personalized>",
  "interviewRoadmap": [
    {
      "topic": "topic name",
      "type": "technical" | "behavioral" | "system-design" | "domain",
      "priority": "must-know" | "important" | "good-to-know",
      "resources": ["resource 1", "resource 2"],
      "sampleQuestion": "a realistic interview question on this topic"
    }
  ],
  "learningRoadmap": [
    {
      "skill": "skill name",
      "duration": "e.g. 2 weeks",
      "resources": ["free resource 1", "free resource 2"],
      "milestone": "what to build/achieve to prove this skill"
    }
  ]
}

Rules:
- resumeImprovements: 4-6 items, job-specific, refer to actual profile data
- coverLetter: personalised with ${name}'s real skills: ${matchReport.matchedSkills.slice(0, 4).join(', ')}
- interviewRoadmap: 5-7 items covering technical, behavioral, and domain topics
- learningRoadmap: only for the missing skills (${missingSkillNames || 'none needed'}), ordered by priority
- All artifacts must reference the specific job role and company
`;

    return aiService.generateJSON<JobArtifacts>(
      prompt,
      getFallbackArtifacts(job),
      'You are a professional career coach. Return only valid JSON artifacts.'
    );
  }
}

export const jobAi = new JobAi();
