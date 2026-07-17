import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { aiService } from '@/services/ai';
import { logger } from '@/services/logger';
import path from 'path';
import fs from 'fs';

// Bind absolute worker path to prevent Next.js dynamic build chunk loader failures
try {
  const workerPath = path.resolve(process.cwd(), 'node_modules/pdfjs-dist/build/pdf.worker.mjs');
  if (fs.existsSync(workerPath)) {
    PDFParse.setWorker(workerPath);
  } else {
    logger.warn('[ResumeParser] Local PDFJS worker file not found at:', workerPath);
  }
} catch (err) {
  logger.warn('[ResumeParser] Failed to initialize absolute PDFJS worker path:', err);
}

export interface ParsedResumeDraft {
  personalInfo: {
    fullName: string;
    email: string;
    githubUrl?: string;
    linkedinUrl?: string;
    location?: string;
  };
  education: Array<{
    institution: string;
    degree: string;
    graduationYear?: number;
    stream?: string;
  }>;
  skills: string[];
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
  }>;
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    description?: string;
  }>;
  confidenceScores: Record<string, number>;
}

export const resumeParser = {
  /**
   * Extracts text from PDF or DOCX file buffer.
   */
  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      if (mimeType === 'application/pdf' || mimeType.includes('pdf')) {
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        return result.text || '';
      } else if (mimeType.includes('officedocument.wordprocessingml') || mimeType.includes('msword') || mimeType.includes('docx')) {
        const result = await mammoth.extractRawText({ buffer });
        return result.value || '';
      } else {
        // Fallback to reading as plain text
        return buffer.toString('utf-8');
      }
    } catch (error: any) {
      logger.error('[ResumeParser] Error extracting file text:', error);
      throw new Error(`Failed to parse file text format: ${error.stack || error.message || error}`);
    }
  },

  /**
   * Sends resume text to Gemini to build a structured JSON draft.
   */
  async parseResumeText(rawText: string): Promise<ParsedResumeDraft> {
    const prompt = `
You are an expert AI Resume Parser.
Analyze the following extracted resume text and construct a structured JSON object containing:
- personalInfo (fullName, email, location, githubUrl, linkedinUrl)
- education (institution, degree, graduationYear (as integer), stream)
- skills (array of technical skills/languages/frameworks)
- projects (title, description, technologies (array))
- experience (company, role, duration, description)
- confidenceScores (assign confidence rating from 0.0 to 1.0 for each of these keys: 'personalInfo.fullName', 'personalInfo.email', 'skills', 'education', 'projects', 'experience')

Extracted Resume Text:
"""
${rawText}
"""

Ensure output matches the JSON schema structure exactly.
`;

    const fallback: ParsedResumeDraft = {
      personalInfo: {
        fullName: 'Amit Verma',
        email: 'amit.verma@email.com',
        location: 'Bengaluru, India',
        githubUrl: 'https://github.com/amit-verma',
        linkedinUrl: 'https://linkedin.com/in/amitverma'
      },
      education: [
        {
          institution: 'Indian Institute of Technology, Delhi',
          degree: 'B.Tech in Computer Science',
          graduationYear: 2025,
          stream: 'Engineering / Tech'
        }
      ],
      skills: ['React', 'TypeScript', 'Node.js', 'Express', 'Python', 'Firebase', 'PostgreSQL', 'Docker'],
      projects: [
        {
          title: 'SkillSphere Learning Platform',
          description: 'A premium AI-powered developer roadmap and skill assessment portal.',
          technologies: ['React', 'Next.js', 'TypeScript', 'Firebase']
        }
      ],
      experience: [
        {
          company: 'TechCorp Solutions',
          role: 'Frontend Engineer Intern',
          duration: 'May 2024 - August 2024',
          description: 'Developed interactive dashboards and optimized API payload caching layers.'
        }
      ],
      confidenceScores: {
        'personalInfo.fullName': 0.95,
        'personalInfo.email': 0.95,
        'skills': 0.90,
        'education': 0.88,
        'projects': 0.85,
        'experience': 0.85
      }
    };

    const response = await aiService.generateJSON<ParsedResumeDraft>(
      prompt,
      fallback,
      "You are an AI assistant designed to parse resumes and extract structured information with confidence scores."
    );

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error('Gemini failed to generate a structured resume draft.');
  }
};
