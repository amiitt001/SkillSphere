export interface IPromptBuilder {
  buildPrompt(contextText: string, userInput: string): string;
  getSystemInstruction(intent: string): string;
}

export class PromptBuilder implements IPromptBuilder {
  buildPrompt(contextText: string, userInput: string): string {
    return `
Relevant User Profile Context:
"""
${contextText}
"""

User Directive / Query: "${userInput}"
    `.trim();
  }

  getSystemInstruction(intent: string): string {
    switch (intent) {
      case 'career_recommendations':
        return 'You are an AI Career Coach. Help the user discover tailored career paths based on their skills, projects, and educational background.';
      case 'resume_analysis':
        return 'You are an ATS Resume Reviewer. Analyze the user resume, rate completeness, flag weaknesses, and recommend actionable bullet points and skills.';
      case 'interview_prep':
        return 'You are a technical interviewer. Conduct mock interviews and evaluate answers based on target career role and required skill sets.';
      default:
        return 'You are a professional AI Career Coach and recruiter assistant built on top of the SkillSphere career workspace.';
    }
  }
}

export const promptBuilder: IPromptBuilder = new PromptBuilder();
export default promptBuilder;
