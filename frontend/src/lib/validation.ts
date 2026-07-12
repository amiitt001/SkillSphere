import { z } from 'zod';

// 1. Chatbot Schema
export const chatbotSchema = z.object({
  message: z.string().min(1, 'Message is required').max(500, 'Message exceeds 500 characters limit'),
  userName: z.string().optional(),
});

// 2. Compare Careers Schema
export const compareCareersSchema = z.object({
  career1: z.string().min(1, 'First career title is required').max(100),
  career2: z.string().min(1, 'Second career title is required').max(100),
});

// 3. Generate Recommendations Schema
export const generateRecommendationsSchema = z.object({
  academicStream: z.string().min(1, 'Academic stream is required').max(100),
  skills: z.string().max(1000).optional().default(''),
  interests: z.string().max(1000).optional().default(''),
  cNum1: z.coerce.number().int().min(1),
  cNum2: z.coerce.number().int().min(1),
  cAns: z.coerce.number().int().min(1),
});

// 4. Interview Prep Schema
export const interviewPrepSchema = z.object({
  career: z.string().min(1, 'Career title is required').max(100),
  companyType: z.string().max(50).optional().default('MNC'),
  experienceLevel: z.string().max(50).optional().default('fresher'),
  action: z.enum(['evaluate', 'generate']).optional().default('generate'),
  question: z.string().max(1000).optional(),
  answer: z.string().max(5000).optional(),
}).refine(
  (data) => {
    if (data.action === 'evaluate') {
      return !!data.question && !!data.answer;
    }
    return true;
  },
  {
    message: 'Question and answer are required for evaluation',
    path: ['question', 'answer'],
  }
);

// 5. Project Generator Schema
export const projectGeneratorSchema = z.object({
  career: z.string().min(1, 'Career title is required').max(100),
  skillLevel: z.string().max(50).optional().default('intermediate'),
  skills: z.string().max(1000).optional().default(''),
});

// 6. Resume Analyzer Schema
export const resumeAnalyzerSchema = z.object({
  resumeText: z.string().min(50, 'Resume text must be at least 50 characters').max(100000, 'Resume text is too long'),
  targetCareer: z.string().max(100).optional(),
});

// 7. Resume Helper Schema
export const resumeHelperSchema = z.object({
  skills: z.array(z.string().max(50)).min(1, 'Please provide at least one skill').max(50),
  jobDescription: z.string().min(10, 'Job description is too short').max(20000, 'Job description is too long'),
  cNum1: z.coerce.number().int().min(1),
  cNum2: z.coerce.number().int().min(1),
  cAns: z.coerce.number().int().min(1),
});

// 8. Skill Quiz Schema
export const skillQuizSchema = z.object({
  skills: z.array(z.string().max(50)).min(1, 'Provide at least one skill to assess').max(10),
  difficulty: z.string().max(50).optional().default('intermediate'),
  questionCount: z.coerce.number().int().min(1).max(30).optional().default(10),
});

// 9. Skill Quiz Evaluate Schema
export const skillQuizEvaluateSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      options: z.array(z.string()),
      correctAnswer: z.number().int().min(0),
      skill: z.string(),
      difficulty: z.string(),
    })
  ).min(1),
  answers: z.array(z.number().int().min(-1)).min(1),
}).refine(
  (data) => data.questions.length === data.answers.length,
  {
    message: 'Questions and answers arrays must have equal length',
    path: ['answers'],
  }
);
