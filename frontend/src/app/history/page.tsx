'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { Recommendation } from '@/types';
import CareerCard from '@/components/CareerCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { deleteHistoryItem } from '@/lib/api'; // 1. Import our new delete function

interface HistoryItem {
  id: string;
  createdAt: Timestamp | null;
  userInput: {
    academicStream: string;
    skills: string[];
    interests: string[];
  };
  recommendations: Recommendation[];
}

// A simple trash icon SVG for the delete button
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const HistoryPage = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // This function for fetching history remains the same
    const fetchHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const historyCollectionRef = collection(db, 'users', user.uid, 'history');
        const q = query(historyCollectionRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const userHistory = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as HistoryItem));

        setHistory(userHistory);
      } catch (err) {
        console.error("Error fetching history:", err);
        setError('Failed to load history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  // 2. NEW FUNCTION TO HANDLE DELETION
  const handleDelete = async (docId: string) => {
    // A simple confirmation dialog to prevent accidental deletions
    if (!user || !window.confirm("Are you sure you want to permanently delete this history item?")) {
      return;
    }

    try {
      await deleteHistoryItem(user.uid, docId);
      // After successful deletion from the database, update the UI
      // by removing the item from our local state. This feels instant to the user.
      setHistory(prevHistory => prevHistory.filter(item => item.id !== docId));
    } catch (err) {
      // You could show a more specific error message to the user here using a toast notification
      alert("Error deleting item. Please try again.");
    }
  };

  // The rest of the component's render logic
  if (loading) {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }
  if (!user) {
    return <div><h1 className="text-4xl font-bold text-white mb-4">History</h1><p className="text-slate-400">Please sign in to view your recommendation history.</p></div>;
  }
  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-4">Your Recommendation History</h1>
      {history.length === 0 ? (
        <p className="text-slate-400">You have no saved recommendations yet. Go to the Dashboard to generate some!</p>
      ) : (
        <div className="space-y-8">
          {history.map(item => (
            <div key={item.id} className="bg-slate-800 p-6 rounded-lg">
              <div className="border-b border-slate-700 pb-4 mb-4 flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-400">
                    Generated on: {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                  </p>
                  <p className="text-white mt-2">
                    <span className="font-semibold">Your Input:</span> {item.userInput.academicStream}, Skills: {item.userInput.skills.join(', ')}, Interests: {item.userInput.interests.join(', ')}
                  </p>
                </div>

                {/* 3. ADD THE DELETE BUTTON TO THE UI */}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-700 rounded-full transition-colors"
                  aria-label="Delete history item"
                >
                  <TrashIcon />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {item.recommendations.map((rec, index) => (
                  <CareerCard
                    key={index}
                    title={rec.title}
                    justification={rec.justification}
                    roadmap={rec.roadmap}
                    isSelected={false}
                    onSelect={() => { }}

                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;

