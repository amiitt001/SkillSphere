/**
 * This page displays the AI-generated career recommendations for a session.
 * It loads the session data from Firestore and allows selecting two careers to compare.
 */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CareerCard from "@/components/CareerCard";
import LoadingSpinner from '@/components/LoadingSpinner';
import { Recommendation } from '@/types';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface SessionData {
  academicStream?: string;
  skills?: string[];
  interests?: string[];
  additionalContext?: string;
  recommendations: Recommendation[];
}

function ResultsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCareers, setSelectedCareers] = useState<string[]>([]);

  // Load from Firestore
  const loadSession = async () => {
    if (!user || !sessionId) {
      if (!sessionId) {
        setError('No active analysis session found.');
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const sessionDocRef = doc(db, 'history', user.uid, 'entries', sessionId);
      const sessionSnap = await getDoc(sessionDocRef);
      
      if (sessionSnap.exists()) {
        const snapData = sessionSnap.data();
        if (snapData.content) {
          const parsed = JSON.parse(snapData.content) as SessionData;
          setSessionData(parsed);
        } else {
          setError('The requested analysis data is empty.');
        }
      } else {
        setError('Saved career analysis session not found.');
      }
    } catch (err) {
      console.error("Error loading history session:", err);
      setError('Unable to access saved analysis due to permissions or database error.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [sessionId, user]);

  const handleSelectCareer = (title: string) => {
    setSelectedCareers(prevSelected => {
      if (prevSelected.includes(title)) {
        return prevSelected.filter(t => t !== title);
      }
      if (prevSelected.length < 2) {
        return [...prevSelected, title];
      }
      // Replace the oldest selection if trying to select a 3rd one
      return [prevSelected[1], title];
    });
  };

  const handleCompare = () => {
    if (selectedCareers.length !== 2) return;
    router.push(`/dashboard/compare?session=${sessionId}&c1=${encodeURIComponent(selectedCareers[0])}&c2=${encodeURIComponent(selectedCareers[1])}`);
  };

  // --- SKELETON LOADER ---
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-8 lg:py-12 animate-pulse">
        {/* Step Indicator Skeleton */}
        <div className="h-4 bg-zinc-900 border border-zinc-800 rounded-full w-96 mx-auto mb-10"></div>
        
        {/* Hero Section Skeleton */}
        <div className="space-y-4 mb-12">
          <div className="h-6 bg-zinc-900 border border-zinc-800 rounded-full w-32"></div>
          <div className="h-10 bg-zinc-900 border border-zinc-800 rounded-lg w-2/3"></div>
          <div className="flex gap-2">
            <div className="h-6 bg-zinc-900 border border-zinc-800 rounded-full w-24"></div>
            <div className="h-6 bg-zinc-900 border border-zinc-800 rounded-full w-32"></div>
            <div className="h-6 bg-zinc-900 border border-zinc-800 rounded-full w-28"></div>
          </div>
        </div>

        {/* 3-Column Card Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-zinc-950/40 border border-zinc-850 rounded-2xl p-6 h-80 space-y-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-5 bg-zinc-900 rounded-full w-16"></div>
                  <div className="h-5 bg-zinc-900 rounded-full w-24"></div>
                </div>
                <div className="h-6 bg-zinc-900 rounded w-3/4"></div>
                <div className="h-12 bg-zinc-900 rounded w-full"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-zinc-900 rounded w-1/2"></div>
                <div className="h-4 bg-zinc-900 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- ERROR FALLBACK STATE ---
  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 mb-6 text-zinc-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-3">Unable to access saved analysis</h2>
        <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          {error} There might be an authorization issue, or the session may have been removed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={loadSession}
            className="btn-primary py-2.5 px-6 text-xs font-semibold"
          >
            Retry Loading
          </button>
          <Link 
            href="/dashboard" 
            className="btn-ghost py-2.5 px-6 text-xs font-semibold no-underline flex items-center justify-center"
          >
            Generate New Analysis
          </Link>
        </div>
      </div>
    );
  }

  const recommendations = sessionData?.recommendations || [];

  // --- EMPTY STATE ---
  if (recommendations.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-2xl mb-8 shadow-inner text-zinc-500">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 17h6M9 13h6M9 9h3" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Career Analysis Found</h2>
        <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          Take the brief assessment to receive personalized, AI-generated career recommendations.
        </p>
        <Link href="/dashboard" className="btn-primary py-3 px-8 text-xs font-bold no-underline inline-block">
          Start Assessment
        </Link>
      </div>
    );
  }

  // Generate background chips list from profile details
  const profileChips: string[] = [];
  if (sessionData?.academicStream) profileChips.push(sessionData.academicStream);
  if (sessionData?.skills && sessionData.skills.length > 0) {
    profileChips.push(...sessionData.skills.slice(0, 4));
  }
  if (sessionData?.interests && sessionData.interests.length > 0) {
    profileChips.push(...sessionData.interests.slice(0, 2));
  }

  return (
    <div className="max-w-6xl mx-auto py-8 lg:py-12 relative pb-24">
      {/* ══ HEADER / ACTION NAVIGATION ══ */}
      <div className="flex justify-between items-center mb-10">
        <Link href="/dashboard" className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 no-underline">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Modify Profile Inputs
        </Link>
      </div>

      {/* ══ HERO SECTION ══ */}
      <div className="mb-12 animate-fade-in text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-mono text-zinc-300 mb-4 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
          AI Analysis Complete
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4 font-display">
          Top Career Matches For You
        </h2>

        {profileChips.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-400 mt-2">
            <span className="font-mono text-zinc-500 uppercase tracking-wider mr-1">Based on:</span>
            {profileChips.map((chip, idx) => (
              <span 
                key={idx} 
                className="bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full text-zinc-300 text-[11px]"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '9999px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#e4e4e7',
                  whiteSpace: 'nowrap',
                  width: 'auto',
                  height: 'auto',
                  lineHeight: '1.2'
                }}
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ══ CARDS GRID (3-Column) ══ */}
      <div className="career-cards mb-16 animate-fade-in">
        {recommendations.map((rec, index) => (
          <CareerCard
            key={rec.title}
            {...rec}
            index={index}
            isSelected={selectedCareers.includes(rec.title)}
            onSelect={handleSelectCareer}
          />
        ))}
      </div>

      {/* ══ STICKY FLOATING COMPARISON SELECTION BAR ══ */}
      {selectedCareers.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-lg bg-zinc-950/80 border border-zinc-850 rounded-full py-3 px-6 shadow-2xl flex items-center justify-between backdrop-blur-xl animate-scale-up">
          <div className="flex items-center gap-3 truncate">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold font-mono">
              {selectedCareers.length}
            </div>
            <div className="text-xs text-zinc-300 font-medium truncate">
              {selectedCareers.length === 1 ? (
                <span>Career selected. Add another to compare.</span>
              ) : (
                <span className="truncate">Ready to compare: <strong className="text-white">{selectedCareers.join(' & ')}</strong></span>
              )}
            </div>
          </div>

          <button
            onClick={handleCompare}
            disabled={selectedCareers.length !== 2}
            className="btn-primary py-2 px-5 text-[11px] font-semibold tracking-wider uppercase disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            Compare
          </button>
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<LoadingSpinner />}>
        <ResultsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
