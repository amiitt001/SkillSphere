// In frontend/src/lib/api.ts
import { Recommendation } from '@/types';

interface UserInput {
  academicStream: string;
  skills: string[];
  interests: string[];
}

// Calls your secure backend route to save history
export async function saveRecommendationToHistory(
  userId: string,
  userInput: UserInput,
  recommendations: Recommendation[]
) {
  const response = await fetch('/api/history/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, userInput, recommendations }),
  });
  if (!response.ok) {
    throw new Error('Failed to save to history.');
  }
  return response.json();
}

// Calls your secure backend route to delete a history item
export async function deleteHistoryItem(userId: string, docId: string) {
  const response = await fetch('/api/history/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, docId }),
  });
  if (!response.ok) {
    throw new Error('Failed to delete history item.');
  }
  return response.json();
}