import { collection, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Recommendation } from '@/types';

// This is the function we need to update
export async function fetchRecommendations(
  academicStream: string,
  skills: string[],
  interests: string[]
): Promise<Recommendation[]> {

  // --- THIS IS THE FIX ---
  // Replace the old URL with your new, live Render backend URL
  // const backendUrl = 'https://skillsphere-vt5h.onrender.com/api/generate-recommendations';
  
 const response = await fetch('https://skillsphere-vt5h.onrender.com/api/generate-recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ academicStream, skills, interests }),
  });

  if (!response.ok) {
    // This will now catch the CORS error if it still exists, but it shouldn't
    console.error('Fetch response not OK:', response);
    throw new Error('Failed to get recommendations from the server.');
  }

  const data = await response.json();
  return data.careerPaths;
}

// The other functions are unchanged
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
      createdAt: serverTimestamp(),
    });
    console.log("Successfully saved to history!");
  } catch (error) {
    console.error("Error saving recommendation to history:", error);
  }
}

export async function deleteHistoryItem(userId: string, docId: string) {
  try {
    const docRef = doc(db, 'users', userId, 'history', docId);
    await deleteDoc(docRef);
    console.log("Successfully deleted history item!");
  } catch (error) {
    console.error("Error deleting history item:", error);
    throw new Error("Failed to delete history item.");
  }
}


