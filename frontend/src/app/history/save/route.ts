// In frontend/src/app/api/history/save/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin'; // We'll create this file next

export async function POST(request: NextRequest) {
  try {
    const { userId, userInput, recommendations } = await request.json();

    if (!userId || !userInput || !recommendations) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const historyRef = db.collection('history').doc(userId);
    const historyDoc = await historyRef.get();

    const newEntry = {
      userInput,
      recommendations,
      timestamp: new Date(),
    };

    if (historyDoc.exists) {
      // If user has history, add to their existing array of recommendations
      const existingData = historyDoc.data()?.items || [];
      await historyRef.set({ items: [newEntry, ...existingData] });
    } else {
      // If it's a new user, create the document
      await historyRef.set({ items: [newEntry] });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error saving history:", error);
    return NextResponse.json({ error: 'Failed to save history.' }, { status: 500 });
  }
}