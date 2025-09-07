import { Recommendation } from "@/types";

interface UserInput {
  academicStream: string;
  skills: string[];
  interests: string[];
}

export async function fetchRecommendations(userInput: UserInput): Promise<{ careerPaths: Recommendation[] }> {
  try {
    const response = await fetch('https://skillsphere-backend-479787868915.asia-south1.run.app/api/generate-recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userInput),
    });

    if (!response.ok) {
      // Try to get a more specific error message from the backend
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error || `Request failed with status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return await response.json();

  } catch (error) {
    console.error("Error fetching recommendations:", error);
    // Re-throw the error so the component can handle it
    throw error;
  }
}
