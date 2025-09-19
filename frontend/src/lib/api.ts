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
  userInput: any,
  recommendations: any
) {
  // Build the URL with the data as search parameters
  const params = new URLSearchParams({
    userId: userId,
    userInput: JSON.stringify(userInput),
    recommendations: JSON.stringify(recommendations),
  });
const url = `/api/history-v2/save?${params.toString()}`;

  // Send the GET request
  const response = await fetch(url); // No method, headers, or body needed

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