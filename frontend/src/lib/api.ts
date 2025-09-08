import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase'; // Import our db instance from firebase.ts
import { Recommendation } from '@/types';

// This is the function you already have for fetching recommendations
export async function fetchRecommendations(
  academicStream: string,
  skills: string[],
  interests: string[]
): Promise<Recommendation[]> {
  // IMPORTANT: Make sure this URL is your live backend URL from Google Cloud Run
  const response = await fetch('https://skillsphere-backend-479787868915.asia-south1.run.app/api/generate-recommendations', {
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
// This function saves a recommendation result to a specific user's history collection
export async function saveRecommendationToHistory(
  userId: string,
  input: { academicStream: string; skills: string[]; interests: string[] },
  recommendations: Recommendation[]
) {
  try {
    // Create a reference to the user's specific history subcollection
    // e.g., /users/USER_ID_123/history
    const historyCollectionRef = collection(db, 'users', userId, 'history');
    
    // Add a new document to that collection
    await addDoc(historyCollectionRef, {
      userInput: input,
      recommendations: recommendations,
      createdAt: serverTimestamp(), // Add a server-side timestamp
    });
    console.log("Successfully saved recommendation to history!");
  } catch (error) {
    console.error("Error saving recommendation to history:", error);
    // We don't throw an error here because failing to save history
    // shouldn't break the user's main experience of getting recommendations.
  }
}

