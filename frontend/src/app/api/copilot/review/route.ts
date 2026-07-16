import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/authMiddleware';
import { aiService } from '@/services/ai/aiService';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

const DEFAULT_RESUME_REVIEW = {
  score: 70,
  suggestions: [
    'Add specific technical details to your project descriptions (e.g. mention database scaling, caching, or load tests).',
    'Include missing developer tools and DevOps systems in your skills tag list.'
  ],
  missingKeywords: ['Docker', 'System Design', 'Redis', 'Unit Testing'],
  actionItems: [
    'Add a link to your containerized microservices repository.',
    'Describe DSA algorithmic efficiency gains in LeetCode accomplishments.'
  ]
};

const DEFAULT_PORTFOLIO_REVIEW = {
  score: 65,
  suggestions: [
    'Write complete detailed README files for all featured repositories explaining how to build and host locally.',
    'Ensure all repository commit histories demonstrate consistent daily contribution streaks rather than bulk pushes.'
  ],
  missingKeywords: ['CI/CD pipeline configuration', 'License file', 'Usage instructions'],
  actionItems: [
    'Create an architecture diagram inside your main repository README.',
    'Delete unused test files and organize backend logic inside clear subfolders.'
  ]
};

export async function POST(req: NextRequest) {
  try {
    const authResult = await verifyAuth(req);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const body = await req.json();
    const { type, contentText } = body;

    if (!type || !contentText) {
      return NextResponse.json({ error: 'Missing type or contentText' }, { status: 400 });
    }

    let prompt = '';
    let fallbackData = DEFAULT_RESUME_REVIEW;

    if (type === 'resume') {
      prompt = `
You are the SkillSphere Resume Coach. Analyze this user's resume text and calculate a score (0 to 100).
Identify missing keywords, structural suggestions, and prioritized action items.
Output a JSON response that maps EXACTLY to the following schema. Do not add conversational text:
{
  "score": 75,
  "suggestions": ["suggestion 1", "suggestion 2"],
  "missingKeywords": ["keyword 1", "keyword 2"],
  "actionItems": ["action item 1", "action item 2"]
}

Resume content to review:
"${contentText}"
`;
    } else {
      fallbackData = DEFAULT_PORTFOLIO_REVIEW;
      prompt = `
You are the SkillSphere Portfolio & GitHub Coach. Analyze these project details / repository description highlights.
Calculate a portfolio appeal score (0 to 100), identify suggestions, missing keywords, and detailed action items.
Output a JSON response that maps EXACTLY to the following schema. Do not add conversational text:
{
  "score": 70,
  "suggestions": ["suggestion 1", "suggestion 2"],
  "missingKeywords": ["documentation keyword 1", "code layout improvement 2"],
  "actionItems": ["action item 1", "action item 2"]
}

Portfolio content details:
"${contentText}"
`;
    }

    const res = await aiService.generateJSON(
      prompt,
      fallbackData,
      'You are a technical document reviewer. Output strictly valid JSON matching the requested structure.'
    );

    return NextResponse.json({ success: true, review: res.data });

  } catch (error) {
    logger.error('[Copilot Review API] Error reviewing document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
