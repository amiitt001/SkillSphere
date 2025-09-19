// In frontend/src/app/api/resume-upload/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf from 'pdf-parse';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Get the file from the user's upload
    const formData = await request.formData();
    const file = formData.get('resume') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // 2. Read the file and extract its text content
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdf(buffer);
    const resumeText = pdfData.text;

    if (!resumeText) {
      return NextResponse.json({ error: 'Could not read text from PDF.' }, { status: 400 });
    }

    // 3. Send the text to the AI to extract skills
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `
      Analyze the following resume text and extract all the technical skills.
      Return your response as a single, valid JSON object. The object should have one key, "skills", which is an array of strings.
      Do not include any text or markdown before or after the JSON object. Only list each skill once.

      Resume Text:
      ---
      ${resumeText}
      ---
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // 4. Return the skills to the frontend
    const jsonMatch = responseText.match(/{[\s\S]*}/);
    if (jsonMatch && jsonMatch[0]) {
      const jsonString = jsonMatch[0];
      return NextResponse.json(JSON.parse(jsonString));
    } else {
      throw new Error("AI did not return valid JSON for skills.");
    }

  } catch (error) {
    console.error("Error in resume-upload API route:", error);
    return NextResponse.json({ error: 'Failed to process resume.' }, { status: 500 });
  }
}