/**
 * This page displays the side-by-side comparison of two careers.
 * It fetches comparison insights, radar metrics, and tables from the backend compare-careers API,
 * and extracts roadmap timelines from the saved Firestore session.
 */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CompareRadarChart from '@/components/charts/CompareRadarChart';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface TableRow {
  feature: string;
  career1_details: string;
  career2_details: string;
}

interface ChartMetric {
  metric: string;
  career1_value: number;
  career2_value: number;
}

interface CompareData {
  summary: string;
  choose_c1_if?: string[];
  choose_c2_if?: string[];
  recommended_career?: string;
  confidence?: number;
  tableData: TableRow[];
  chartData: ChartMetric[];
}

function CompareContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const c1 = searchParams.get('c1');
  const c2 = searchParams.get('c2');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [compareData, setCompareData] = useState<CompareData | null>(null);

  // Roadmaps loaded from Firestore session
  const [career1Roadmap, setCareer1Roadmap] = useState<string[]>([]);
  const [career2Roadmap, setCareer2Roadmap] = useState<string[]>([]);

  const [isCommitting, setIsCommitting] = useState(false);

  const handleCommitPath = async (careerTitle: string) => {
    if (!user) return;
    setIsCommitting(true);
    setError('');
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const res = await fetch('/api/commit', {
        method: 'POST',
        headers,
        body: JSON.stringify({ careerTitle })
      });

      if (!res.ok) {
        throw new Error(`Commit API failed: ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        router.push('/workspace');
      } else {
        throw new Error(data.error || 'Failed to select career path.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while saving career selection.');
    } finally {
      setIsCommitting(false);
    }
  };

  const fetchComparisonData = async () => {
    if (!c1 || !c2) {
      setError('Select two career paths for side-by-side comparison.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      // 1. Fetch AI comparison payload
      const params = new URLSearchParams({ career1: c1, career2: c2 });
      const url = `/api/compare-careers?${params.toString()}`;

      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {};
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const response = await fetch(url, { headers });
      if (response.status === 429) {
        throw new Error("The career comparison AI service is currently busy due to rate limits. Please wait a few seconds and try again.");
      }
      if (!response.ok || !response.body) {
        throw new Error(`Comparison API responded with status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullResponse += decoder.decode(value);
      }

      const jsonMatch = fullResponse.match(/{[\s\S]*}/);
      if (jsonMatch && jsonMatch[0]) {
        const jsonString = jsonMatch[0];
        const resultJson = JSON.parse(jsonString) as CompareData;
        setCompareData(resultJson);
      } else {
        throw new Error("Invalid response format received from AI.");
      }

      // 2. Load Firestore roadmaps if session exists
      if (user && sessionId) {
        const sessionDocRef = doc(db, 'history', user.uid, 'entries', sessionId);
        const sessionSnap = await getDoc(sessionDocRef);
        if (sessionSnap.exists()) {
          const sessionData = sessionSnap.data();
          if (sessionData.content) {
            const parsed = JSON.parse(sessionData.content);
            const recommendations = parsed.recommendations || [];
            const r1 = recommendations.find((r: any) => r.title.toLowerCase() === c1.toLowerCase());
            const r2 = recommendations.find((r: any) => r.title.toLowerCase() === c2.toLowerCase());
            if (r1) setCareer1Roadmap(r1.roadmap || []);
            if (r2) setCareer2Roadmap(r2.roadmap || []);
          }
        }
      }
    } catch (err) {
      console.error("Error loading career comparison:", err);
      setError('Unable to fetch detailed career comparison metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisonData();
  }, [c1, c2, sessionId, user]);

  // --- SKELETON LOADER STATE ---
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-8 lg:py-12 animate-pulse space-y-10">
        <div className="h-4 bg-zinc-900 border border-zinc-800 rounded-full w-96 mx-auto mb-10"></div>
        <div className="h-6 bg-zinc-900 border border-zinc-800 rounded w-24"></div>
        
        {/* Summary Card Skeleton */}
        <div className="h-60 bg-zinc-950/40 border border-zinc-850 rounded-2xl p-6"></div>
        
        {/* Details and Radar Chart Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-96 bg-zinc-950/40 border border-zinc-850 rounded-2xl p-6"></div>
          <div className="h-96 bg-zinc-950/40 border border-zinc-850 rounded-2xl p-6"></div>
        </div>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 mb-6 text-zinc-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Unable to Load Comparison</h2>
        <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          {error} Verify your network connection and session parameter integrity.
        </p>
        <div className="flex gap-3 justify-center">
          <button 
            onClick={fetchComparisonData}
            className="btn-primary py-2.5 px-6 text-xs font-semibold"
          >
            Retry Fetch
          </button>
          <Link 
            href={sessionId ? `/dashboard/results?session=${sessionId}` : '/dashboard'} 
            className="btn-ghost py-2.5 px-6 text-xs font-semibold no-underline"
          >
            Back to Results
          </Link>
        </div>
      </div>
    );
  }

  if (!compareData || !c1 || !c2) return null;

  // Render list items for details dynamically (split commas/bullets into tags)
  const renderDetailsAsChips = (text: string) => {
    const parts = text.split(/,|\n|•/).map(p => p.trim()).filter(Boolean);
    if (parts.length > 1 && parts.every(p => p.length < 35)) {
      return (
        <div className="flex flex-wrap gap-1 justify-center lg:justify-start">
          {parts.map((p, i) => (
            <span key={i} className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono">
              {p}
            </span>
          ))}
        </div>
      );
    }
    return <span className="text-xs text-zinc-455 leading-relaxed">{text}</span>;
  };

  // Convert step lists to Months format
  const getMonthLabel = (idx: number) => {
    if (idx === 0) return "Month 1-2";
    if (idx === 1) return "Month 3-4";
    if (idx === 2) return "Month 5-6";
    return `Month ${idx * 2 + 1}-${idx * 2 + 2}`;
  };

  return (
    <div className="max-w-5xl mx-auto py-8 lg:py-12 pb-24 space-y-10 animate-fade-in">
      {/* Back button */}
      <div>
        <Link 
          href={sessionId ? `/dashboard/results?session=${sessionId}` : '/dashboard'} 
          className="text-xs text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1.5 no-underline"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Career Matches
        </Link>
      </div>

      {/* ══ 1. SUMMARY AI RECOMMENDATION INSIGHT CARD ══ */}
      <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-900 pb-4 mb-6 gap-3">
          <div>
            <span 
              className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded-full"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: '9999px',
                padding: '3px 10px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#a1a1aa',
                whiteSpace: 'nowrap',
                width: 'auto',
                height: 'auto',
                lineHeight: '1.2'
              }}
            >
              AI Recommendation
            </span>
            <h3 className="text-lg font-bold text-white mt-1">Strategic Comparison Path</h3>
          </div>
          
          {compareData.recommended_career && (
            <div className="flex gap-2 flex-wrap">
              <span 
                className="text-xs bg-white text-black px-3 py-1 rounded-full font-semibold"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '9999px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  whiteSpace: 'nowrap',
                  width: 'auto',
                  height: 'auto',
                  lineHeight: '1.2'
                }}
              >
                Recommended: {compareData.recommended_career}
              </span>
              {compareData.confidence && (
                <span 
                  className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-1 rounded-full font-mono"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: '9999px',
                    padding: '4px 12px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#d4d4d8',
                    whiteSpace: 'nowrap',
                    width: 'auto',
                    height: 'auto',
                    lineHeight: '1.2'
                  }}
                >
                  Confidence: {compareData.confidence}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* Choice Checklists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Career 1 pointer */}
          <div className="space-y-3 bg-zinc-900/20 p-4 rounded-xl border border-zinc-900">
            <h4 className="text-sm font-semibold text-white">Choose {c1} if:</h4>
            <ul className="space-y-2">
              {compareData.choose_c1_if?.map((bullet, idx) => (
                <li key={idx} className="flex gap-2 text-xs text-zinc-300 leading-relaxed">
                  <span className="text-zinc-500">•</span>
                  <span>{bullet}</span>
                </li>
              )) || (
                <li className="text-xs text-zinc-500 italic">No specific preferences analyzed</li>
              )}
            </ul>
          </div>

          {/* Career 2 pointer */}
          <div className="space-y-3 bg-zinc-900/20 p-4 rounded-xl border border-zinc-900">
            <h4 className="text-sm font-semibold text-white">Choose {c2} if:</h4>
            <ul className="space-y-2">
              {compareData.choose_c2_if?.map((bullet, idx) => (
                <li key={idx} className="flex gap-2 text-xs text-zinc-300 leading-relaxed">
                  <span className="text-zinc-500">•</span>
                  <span>{bullet}</span>
                </li>
              )) || (
                <li className="text-xs text-zinc-500 italic">No specific preferences analyzed</li>
              )}
            </ul>
          </div>
        </div>

        {/* Summary text paragraph */}
        <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-900/40 p-4 rounded-xl border border-zinc-900">
          {compareData.summary}
        </p>
      </div>

      {/* ══ 2. SIDE-BY-SIDE METRICS & RADAR CHART GRID ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Side-by-Side Detail Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-md h-full flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-6 border-b border-zinc-900 pb-3">
                Attribute Comparison
              </h3>

              <div className="space-y-5">
                {compareData.tableData.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-5 border-b border-zinc-900 pb-4 last:border-b-0 last:pb-0 gap-3">
                    {/* Feature name */}
                    <div className="md:col-span-1 flex items-center">
                      <span className="text-xs font-mono font-semibold text-zinc-400">
                        {row.feature}
                      </span>
                    </div>

                    {/* Career 1 Value */}
                    <div className="md:col-span-2 flex flex-col justify-center text-center md:text-left">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider md:hidden">{c1}</span>
                      <div className="pt-0.5">
                        {renderDetailsAsChips(row.career1_details)}
                      </div>
                    </div>

                    {/* Career 2 Value */}
                    <div className="md:col-span-2 flex flex-col justify-center text-center md:text-left border-l-0 md:border-l border-zinc-900 md:pl-4">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider md:hidden">{c2}</span>
                      <div className="pt-0.5">
                        {renderDetailsAsChips(row.career2_details)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Radar Chart Visualization */}
        <div className="h-full">
          <CompareRadarChart
            career1Title={c1}
            career2Title={c2}
            chartData={compareData.chartData}
          />
        </div>
      </div>

      {/* ══ 3. MONTH-BY-MONTH TIMELINE CARDS ══ */}
      {(career1Roadmap.length > 0 || career2Roadmap.length > 0) && (
        <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-md">
          <h3 className="text-sm font-mono text-zinc-400 uppercase tracking-wider mb-6 border-b border-zinc-900 pb-3">
            Roadmap Timelines
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Career 1 timeline */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                {c1}
              </h4>
              <div className="space-y-4 pl-3 border-l border-zinc-800">
                {career1Roadmap.map((step, idx) => (
                  <div key={idx} className="relative pt-0.5">
                    <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-zinc-700 border border-zinc-950"></div>
                    <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                      {getMonthLabel(idx)}
                    </span>
                    <p className="text-xs text-zinc-300 font-medium leading-relaxed mt-1">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Career 2 timeline */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                {c2}
              </h4>
              <div className="space-y-4 pl-3 border-l border-zinc-800">
                {career2Roadmap.map((step, idx) => (
                  <div key={idx} className="relative pt-0.5">
                    <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-zinc-700 border border-zinc-950"></div>
                    <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                      {getMonthLabel(idx)}
                    </span>
                    <p className="text-xs text-zinc-300 font-medium leading-relaxed mt-1">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ 4. SELECT PRIMARY PATHWAY SELECTION ══ */}
      <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-md space-y-6 mt-8">
        <div className="text-center max-w-md mx-auto space-y-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Commit to your Pathway</h3>
          <p className="text-xs text-zinc-400">Lock in one of these career recommendations to custom-tailor your SkillSphere learning dashboard and roadmap execution workspace.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {c1 && (
            <button
              onClick={() => handleCommitPath(c1)}
              disabled={isCommitting}
              className="btn-primary py-3 px-6 text-xs font-bold flex flex-col items-center justify-center gap-1 shadow-glow-terra"
            >
              <span>Focus on {c1}</span>
              <span className="text-[10px] opacity-60 font-normal">Commit to this path & build blueprint</span>
            </button>
          )}
          {c2 && (
            <button
              onClick={() => handleCommitPath(c2)}
              disabled={isCommitting}
              className="btn-ghost py-3 px-6 text-xs font-bold border border-zinc-800 flex flex-col items-center justify-center gap-1 text-white hover:bg-zinc-900/50"
            >
              <span>Focus on {c2}</span>
              <span className="text-[10px] opacity-60 font-normal text-zinc-400">Commit to this path & build blueprint</span>
            </button>
          )}
        </div>
      </div>

      {/* ══ AI LOADERS OVERLAYS ══ */}
      {isCommitting && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-6">
          <div className="loading-spinner" style={{ border: '4px solid rgba(255,255,255,0.05)', borderTop: '4px solid var(--accent-clay)', borderRadius: '50%', width: '64px', height: '64px', animation: 'spin 1s linear infinite' }}></div>
          <div className="text-center space-y-2 animate-pulse">
            <h3 className="text-lg font-bold text-white">Generating AI Career Blueprint...</h3>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto font-sans">Evaluating health index, skill gap deltas, target companies, and learning roadmaps...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<LoadingSpinner />}>
        <CompareContent />
      </Suspense>
    </ProtectedRoute>
  );
}
