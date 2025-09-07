'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { Recommendation } from '@/types';
import CareerCard from '@/components/CareerCard';
import LoadingSpinner from '@/components/LoadingSpinner';

// Define the shape of a history document from Firestore
interface HistoryItem {
  id: string;
  createdAt: Timestamp | null; // Allow createdAt to be null to prevent errors
  userInput: {
    academicStream: string;
    skills: string[];
    interests: string[];
  };
  recommendations: Recommendation[];
}

const HistoryPage = () => {
  const { user } = useAuth(); // Get the current logged-in user
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // This effect runs when the component loads or the user logs in/out
  useEffect(() => {
    const fetchHistory = async () => {
      // If there's no user, we don't need to fetch anything
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Construct a query to get the user's history, ordered by the newest first
        const historyCollectionRef = collection(db, 'users', user.uid, 'history');
        const q = query(historyCollectionRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        // Map the raw Firestore documents to our HistoryItem type
        const userHistory = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as HistoryItem));

        setHistory(userHistory);
      } catch (err) {
        console.error("Error fetching history:", err);
        setError('Failed to load your recommendation history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]); // The dependency array ensures this effect re-runs if the user changes

  // --- Render Logic ---

  // 1. Show a loading spinner while fetching data
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  // 2. Show a message if the user is not logged in
  if (!user) {
    return (
      <div>
        <h1 className="text-4xl font-bold text-white mb-4">History</h1>
        <p className="text-slate-400">Please sign in to view your recommendation history.</p>
      </div>
    );
  }
  
  // 3. Show an error message if something went wrong
  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  // 4. Render the main history content
  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-4">Your Recommendation History</h1>
      {history.length === 0 ? (
        <p className="text-slate-400">You have no saved recommendations yet. Go to the Dashboard to generate some!</p>
      ) : (
        <div className="space-y-8">
          {history.map(item => (
            <div key={item.id} className="bg-slate-800 p-6 rounded-lg">
              <div className="border-b border-slate-700 pb-4 mb-4">
                <p className="text-sm text-slate-400">
                  {/* Safety check for the timestamp */}
                  Generated on: {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                </p>
                <p className="text-white mt-2">
                  <span className="font-semibold">Your Input:</span> {item.userInput.academicStream}, Skills: {item.userInput.skills.join(', ')}, Interests: {item.userInput.interests.join(', ')}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {item.recommendations.map((rec, index) => (
                  <CareerCard
                    key={index}
                    title={rec.title}
                    justification={rec.justification}
                    roadmap={rec.roadmap}
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

