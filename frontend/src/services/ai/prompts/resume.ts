/**
 * Resume Prompts Library
 */

export const getResumeHelperPrompt = (skills: string[], jobDescription: string) => `
Act as an expert career coach. Based on the user's list of skills and the provided job description, generate 3 to 5 powerful, action-oriented bullet points for their resume.
Each bullet point should directly connect one or more of the user's skills to a requirement or responsibility in the job description.
The response should be formatted as simple markdown text with each bullet point starting with a '*'.

**User's Skills:**
- ${skills.join('\n- ')}

**Job Description:**
---
${jobDescription}
---
`.trim();

export const getResumeAnalyzerPrompt = (resumeText: string, targetCareer?: string) => `
You are an ATS (Applicant Tracking System) resume analyst and career coach.
Analyze the following resume${targetCareer ? ` for a "${targetCareer}" position` : ''}.

Your ENTIRE response must be a single valid JSON object with this exact structure:
{
  "atsScore": 72,
  "bullets": [
    {
      "original": "The original bullet point from the resume",
      "rating": "weak",
      "suggestion": "Why it's weak and how to improve it",
      "rewritten": "A better version of the bullet point"
    }
  ],
  "missingSkills": ["skill1", "skill2"],
  "suggestedProjects": ["Project idea 1 with brief description", "Project idea 2"],
  "professionalSummary": "A rewritten professional summary",
  "overallFeedback": "2-3 sentence overall assessment"
}

Rules:
- atsScore: 0-100 based on ATS-friendliness (keywords, formatting, action verbs)
- bullets: Analyze the top 5-8 most important bullet points. Rating can be "weak", "average", or "strong"
- missingSkills: 3-5 skills that would strengthen the resume${targetCareer ? ` for ${targetCareer}` : ''}
- suggestedProjects: 2-3 specific project ideas to add
- professionalSummary: A compelling 2-3 sentence professional summary
- Do NOT include markdown or text outside JSON

Resume:
${resumeText}
`.trim();
