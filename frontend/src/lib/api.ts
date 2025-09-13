import { collection, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore'; // 1. Import 'doc' and 'deleteDoc'
import { db } from './firebase';
import { Recommendation } from '@/types';

// This function is unchanged
export async function fetchRecommendations(
  academicStream: string,
  skills: string[],
  interests: string[]
): Promise<Recommendation[]> {
  const response = await fetch('https://skillsphere-vt5h.onrender.com/api/generate-recommendations', {
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

// This function is unchanged
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

// --- NEW FUNCTION ---
// This function deletes a specific document from a user's history
export async function deleteHistoryItem(userId: string, docId: string) {
  try {
    // Create a direct reference to the document we want to delete
    const docRef = doc(db, 'users', userId, 'history', docId);
    // Delete the document
    await deleteDoc(docRef);
    console.log("Successfully deleted history item!");
  } catch (error) {
    console.error("Error deleting history item:", error);
    // Throw the error so the UI can handle it
    throw new Error("Failed to delete history item.");
  }
}

