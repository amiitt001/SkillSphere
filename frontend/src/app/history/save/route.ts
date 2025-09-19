// In frontend/src/app/api/history/save/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

// Change from POST to GET
export async function GET(request: NextRequest) {
  try {
    // Read data from URL search parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const userInput = JSON.parse(searchParams.get('userInput') || '{}');
    const recommendations = JSON.parse(searchParams.get('recommendations') || '[]');

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
      const existingData = historyDoc.data()?.items || [];
      await historyRef.set({ items: [newEntry, ...existingData] });
    } else {
      await historyRef.set({ items: [newEntry] });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error saving history:", error);
    return NextResponse.json({ error: 'Failed to save history.' }, { status: 500 });
  }
}