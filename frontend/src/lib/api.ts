import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase'; // Import our db instance
import { Recommendation } from '@/types';

// This is the function you already have
export async function fetchRecommendations(
  academicStream: string,
  skills: string[],
  interests: string[]
): Promise<Recommendation[]> {
  const response = await fetch('https://skillsphere-backend-479787868915.asia-south1.run.app/api/generate-recommendations', { // Remember to use your live backend URL
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ academicStream, skills, interests }),
  });

  if (!response.ok) {
    throw new Error('Failed to get recommendations from the server.');
  }

  const data = await response.json();
  return data.careerPaths;
}


// --- NEW FUNCTION ---
// This function saves a recommendation result to the user's history
export async function saveRecommendationToHistory(
  userId: string,
  input: { academicStream: string; skills: string[]; interests: string[] },
  recommendations: Recommendation[]
) {
  try {
    const historyCollectionRef = collection(db, 'users', userId, 'history');
    
    await addDoc(historyCollectionRef, {
      userInput: input,
      recommendations: recommendations,
      createdAt: serverTimestamp(), // Adds a timestamp for when it was created
    });
    console.log("Successfully saved to history!");
  } catch (error) {
    console.error("Error saving recommendation to history:", error);
    // We don't throw an error here because failing to save history shouldn't break the user's experience
  }
}

