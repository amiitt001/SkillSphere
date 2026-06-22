import { type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Handles the GET request to generate career recommendations in a Next.js App Router environment.
 * This is the definitive, final version, using the correct model per Google's error logs.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const academicStream = searchParams.get('academicStream') || '';
    const skills = searchParams.get('skills') || '';
    const interests = searchParams.get('interests') || '';

    const prompt = `
      You are an expert career and skills advisor. Your task is to provide personalized career path recommendations for a user in India.
      Your entire response MUST be a single, valid JSON object. Do not include any text, markdown formatting, or notes before or after the JSON object.

      The JSON object should have a single key "recommendations", which is an array of 3 career path objects.
      Each career path object must have the following keys:
      - "title": The name of the career path (e.g., "AI/Machine Learning Engineer").
      - "justification": A concise, one-sentence explanation of why it's a good fit for the user.
      - "roadmap": An array of 3-4 strings, with each string being a short, actionable step.
      - "estimatedSalary": A typical annual salary range in India (e.g., "₹8,00,000 - ₹15,00,000 LPA").
      - "suggestedCertifications": An array of 2-3 relevant professional certifications.
      - "keyCompanies": An array of 2-3 notable companies in India that hire for this role.
      - "skillGapAnalysis": A JSON object containing:
        - "readinessScore": An integer score (0-100) representing readiness.
        - "estimatedTime": Estimated time to become ready (e.g., "4-6 Months").
        - "currentSkills": Array of strings matching user skills that are relevant to this career.
        - "missingSkills": Array of objects representing missing skills. Each object has "name" (string) and "level" (number, 0-60 representing current partial exposure).
        - "topPrioritySkills": Array of top 3 priority skills to learn.
        - "aiInsight": A concise personalized career recommendation insight under 25 words.

      User's Profile:
      - Academic Stream: ${academicStream}
      - Skills: ${skills}
      - Interests: ${interests}
    `;

    // --- SEQUENCE OF APIS: 1. GEMINI -> 2. NVIDIA DEEPSEEK -> 3. STATIC MOCK ---
    
    // 1. Try Google Gemini API
    try {
      const API_KEY = process.env.GEMINI_API_KEY;
      if (API_KEY) {
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              response_mime_type: "application/json"
            }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return new Response(cleanedText, {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        } else {
          const errText = await response.text();
          console.warn(`Gemini API failed with status ${response.status}: ${errText}. Retrying with NVIDIA DeepSeek API...`);
        }
      }
    } catch (geminiError: any) {
      console.warn("Gemini API call failed with exception:", geminiError.message || geminiError, ". Retrying with NVIDIA DeepSeek API...");
    }

    // 2. Try NVIDIA DeepSeek API
    try {
      const nvidiaKey = process.env.NVIDIA_API_KEY;
      if (nvidiaKey) {
        const nvidiaBaseUrl = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
        const nvidiaModel = process.env.NVIDIA_MODEL || "deepseek-ai/deepseek-v4-flash";

        const response = await fetch(`${nvidiaBaseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${nvidiaKey}`
          },
          body: JSON.stringify({
            model: nvidiaModel,
            messages: [{ role: "user", content: prompt }],
            temperature: 1,
            top_p: 0.95,
            max_tokens: 16384,
            response_format: { type: "json_object" }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) {
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return new Response(cleanedText, {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        } else {
          const errText = await response.text();
          console.warn(`NVIDIA DeepSeek API failed with status ${response.status}: ${errText}. Falling back to static mock...`);
        }
      }
    } catch (nvidiaError: any) {
      console.warn("NVIDIA DeepSeek API call failed with exception:", nvidiaError.message || nvidiaError, ". Falling back to static mock...");
    }

    // 3. Fallback to static mock data
    const fallbackData = getFallbackRecommendations(academicStream, skills, interests);
    return new Response(JSON.stringify(fallbackData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error("General error in generate-recommendations API route:", error);
    try {
      const searchParams = request.nextUrl.searchParams;
      const academicStream = searchParams.get('academicStream') || '';
      const skills = searchParams.get('skills') || '';
      const interests = searchParams.get('interests') || '';
      const fallbackData = getFallbackRecommendations(academicStream, skills, interests);
      return new Response(JSON.stringify(fallbackData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch {
      return new Response(JSON.stringify({ error: "Fatal error in recommendations generator." }), { status: 500 });
    }
  }
}

function getFallbackRecommendations(academicStream: string, skills: string, interests: string) {
  const skillsList = skills ? skills.split(',').map(s => s.trim()) : [];

  return {
    recommendations: [
      {
        title: "AI/Machine Learning Engineer (Ethical AI Focus)",
        justification: `Directly aligns with your background in ${academicStream || 'Technology'} and interest in ethical development.`,
        roadmap: [
          "Master core ML frameworks (TensorFlow, PyTorch)",
          "Implement bias detection and fair ML algorithms",
          "Build MLOps pipelines and deploy to AWS/GCP"
        ],
        estimatedSalary: "₹8,00,000 - ₹15,00,000 LPA",
        suggestedCertifications: [
          "Google Cloud Professional ML Engineer",
          "TensorFlow Developer Certificate"
        ],
        keyCompanies: ["TCS", "ThoughtWorks", "Wipro"],
        skillGapAnalysis: {
          readinessScore: 80,
          estimatedTime: "4-6 Months",
          currentSkills: skillsList.filter(s => ["Python", "SQL", "JavaScript", "C++"].includes(s)) || ["Python"],
          missingSkills: [
            { name: "TensorFlow", level: 20 },
            { name: "PyTorch", level: 10 },
            { name: "MLOps", level: 0 },
            { name: "Statistics", level: 40 }
          ],
          topPrioritySkills: ["TensorFlow", "PyTorch", "MLOps"],
          aiInsight: "Your coding foundation is solid. Focus on core ML libraries and MLOps deployment practices."
        }
      },
      {
        title: "Full Stack Developer (Open Source Contributor)",
        justification: `Leverages your key programming skills to contribute to scaled web applications.`,
        roadmap: [
          "Deep dive into React, Node.js, and TypeScript",
          "Contribute to key open source web frameworks",
          "Learn system design principles and database indexing"
        ],
        estimatedSalary: "₹6,0,000 - ₹12,00,000 LPA",
        suggestedCertifications: [
          "AWS Certified Developer",
          "Meta Front-End Developer Professional Certificate"
        ],
        keyCompanies: ["ThoughtWorks", "Razorpay", "BrowserStack"],
        skillGapAnalysis: {
          readinessScore: 85,
          estimatedTime: "3-5 Months",
          currentSkills: skillsList.filter(s => ["JavaScript", "HTML", "CSS", "Python"].includes(s)) || ["JavaScript"],
          missingSkills: [
            { name: "React", level: 40 },
            { name: "Node.js", level: 30 },
            { name: "TypeScript", level: 20 }
          ],
          topPrioritySkills: ["React", "Node.js", "TypeScript"],
          aiInsight: "Expanding into React and server-side JavaScript will quickly unlock high-paying roles."
        }
      },
      {
        title: "Data Scientist (Ethical Data & Bias Analysis)",
        justification: `Combines database management, statistical analysis, and ethical insights.`,
        roadmap: [
          "Advance your SQL analytics and pipeline queries",
          "Study algorithmic fairness and model explanation techniques",
          "Build predictive dashboards in Tableau or Power BI"
        ],
        estimatedSalary: "₹7,00,000 - ₹14,00,000 LPA",
        suggestedCertifications: [
          "Google Data Analytics Professional Certificate",
          "SAS Certified Data Scientist"
        ],
        keyCompanies: ["TCS", "Accenture", "Fractal Analytics"],
        skillGapAnalysis: {
          readinessScore: 75,
          estimatedTime: "3-6 Months",
          currentSkills: skillsList.filter(s => ["SQL", "Python", "R"].includes(s)) || ["SQL"],
          missingSkills: [
            { name: "R/Python Libraries", level: 30 },
            { name: "Tableau", level: 10 },
            { name: "Data Warehousing", level: 20 }
          ],
          topPrioritySkills: ["Tableau", "Data Warehousing", "R/Python Libraries"],
          aiInsight: "Leverage your SQL foundation. Focus on learning business intelligence tools and basic statistical models."
        }
      }
    ]
  };
}

