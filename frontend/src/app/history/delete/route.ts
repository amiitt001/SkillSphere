// In frontend/src/app/api/history/delete/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId, docId } = await request.json();

    if (!userId || !docId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Firestore does not allow deleting nested documents directly.
    // We need to fetch the user's history, filter out the item, and update the document.
    const historyRef = db.collection('history').doc(userId);
    const historyDoc = await historyRef.get();

    if (!historyDoc.exists) {
      return NextResponse.json({ error: 'No history found for user.' }, { status: 404 });
    }

    const allItems = historyDoc.data()?.items || [];
    // Create a new array that excludes the item with the matching timestamp (used as a unique ID)
    const updatedItems = allItems.filter((item: any) => 
        new Date(item.timestamp.seconds * 1000).toISOString() !== docId
    );

    await historyRef.set({ items: updatedItems });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting history:", error);
    return NextResponse.json({ error: 'Failed to delete history.' }, { status: 500 });
  }
}