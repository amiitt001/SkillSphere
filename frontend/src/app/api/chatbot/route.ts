import { NextRequest, NextResponse } from 'next/server';

// Rate limiting map (simple in-memory solution)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(request: NextRequest): string {
  // Use IP address for rate limiting
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  return ip;
}

function checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count < maxRequests) {
    record.count++;
    return true;
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitKey = getRateLimitKey(req);
    if (!checkRateLimit(rateLimitKey, 10, 60000)) {
      return NextResponse.json(
        { response: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { message, userId, userName } = await req.json();

    // Input validation
    if (!message || typeof message !== 'string') {
      return NextResponse.json({
        response: "Please send a valid message.",
      });
    }

    // Sanitize input - limit length
    const sanitizedMessage = message.trim().substring(0, 500);
    if (!sanitizedMessage) {
      return NextResponse.json({
        response: "Please send a non-empty message.",
      });
    }

    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable is not set');
      return NextResponse.json({
        response: "I'm currently unavailable. The API key is not configured on the server.",
      });
    }

    const userPrompt = `You are SkillSphere AI, a friendly and knowledgeable career guidance assistant. You help users with career path recommendations, skill development, resume tips, and educational guidance.

User: ${userName || 'User'}
Question: ${sanitizedMessage}

Provide a helpful, concise response (2-3 paragraphs max). Be conversational and supportive.`;

    console.log('Calling Gemini API...');

    // Call Gemini API - Using gemini-2.5-flash which is the latest and fastest model
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: userPrompt,
                },
              ],
            },
          ],
        }),
      }
    );

    const responseData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', geminiResponse.status, responseData);
      return NextResponse.json({
        response: "I'm having difficulty processing your request. Please try again in a moment.",
      });
    }

    const botResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text || 
      "I apologize, I couldn't generate a response. Please try again.";

    return NextResponse.json({
      response: botResponse,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { 
        response: "I'm experiencing technical difficulties. Please try again in a moment."
      }
    );
  }
}
