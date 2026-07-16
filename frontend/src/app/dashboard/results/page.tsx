/**
 * SkillSphere AI Career Advisor — Redesigned Results Dashboard
 * Elite monochromatic AI SaaS experience with Recharts analytics and interactive active-path views.
 */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, AlertCircle, ArrowLeft, ArrowRight, ShieldCheck, 
  Map, Award, BookOpen, Layers, BarChart4, CheckCircle2, AlertTriangle, Calendar 
} from 'lucide-react';
import CareerCard from "@/components/career/CareerCard";
import CompareDrawer from "@/components/career/CompareDrawer";
import AnalyticsSection from "@/components/dashboard/AnalyticsSection";
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Recommendation, SkillGapAnalysis } from '@/types';
import { useAuth } from '@/hooks';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface SessionData {
  academicStream?: string;
  skills?: string[];
  interests?: string[];
  additionalContext?: string;
  recommendations: Recommendation[];
}

const getFallbackSkillGap = (title: string): SkillGapAnalysis => {
  const t = title.toLowerCase();
  if (t.includes('machine learning') || t.includes('ml') || t.includes('ai') || t.includes('deep learning') || t.includes('data scientist')) {
    return {
      readinessScore: 80,
      estimatedTime: "4-6 Months",
      currentSkills: ["Python", "SQL", "JavaScript", "Open Source"],
      missingSkills: [
        { name: "TensorFlow", level: 0 },
        { name: "PyTorch", level: 0 },
        { name: "MLOps", level: 0 },
        { name: "Statistics", level: 40 }
      ],
      topPrioritySkills: ["TensorFlow", "PyTorch", "MLOps"],
      aiInsight: "You already possess the programming foundation required for this role. Completing these skills could increase your readiness score from 80% to 95%."
    };
  }
  if (t.includes('data engineer') || t.includes('data engineering')) {
    return {
      readinessScore: 75,
      estimatedTime: "3-5 Months",
      currentSkills: ["Python", "SQL", "Git"],
      missingSkills: [
        { name: "Apache Spark", level: 20 },
        { name: "Kafka", level: 0 },
        { name: "Data Warehousing", level: 30 }
      ],
      topPrioritySkills: ["Apache Spark", "Kafka", "Data Warehousing"],
      aiInsight: "Your strong SQL base matches data engineering needs. Focus on distributed computing framework Spark and queue systems like Kafka."
    };
  }
  return {
    readinessScore: 70,
    estimatedTime: "3-6 Months",
    currentSkills: ["SQL", "Git", "Problem Solving"],
    missingSkills: [
      { name: "React", level: 10 },
      { name: "Node.js", level: 20 },
      { name: "System Design", level: 0 }
    ],
    topPrioritySkills: ["React", "Node.js", "System Design"],
    aiInsight: "You possess robust analytical foundations. Prioritize expanding your knowledge of modern frontend frameworks and system design concepts."
  };
};

function ResultsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCareers, setSelectedCareers] = useState<string[]>([]);
  const [activeCareerIdx, setActiveCareerIdx] = useState(0);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [showRefineModal, setShowRefineModal] = useState(false);

  // Existing committed career — used to show the "replacing" banner
  const [existingCareer, setExistingCareer] = useState<string | null>(null);

  const [refineStream, setRefineStream] = useState('');
  const [refineSkills, setRefineSkills] = useState('');
  const [refineInterests, setRefineInterests] = useState('');

  useEffect(() => {
    if (sessionData) {
      setRefineStream(sessionData.academicStream || '');
      setRefineSkills((sessionData.skills || []).join(', '));
      setRefineInterests((sessionData.interests || []).join(', '));
    }
  }, [sessionData]);

  // Load existing career commitment status for the replacement banner
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const headers: HeadersInit = idToken ? { Authorization: `Bearer ${idToken}` } : {};
        const res = await fetch('/api/career-status', { headers });
        if (res.ok) {
          const d = await res.json();
          if (d.hasCareer) setExistingCareer(d.primaryCareerGoal);
        }
      } catch (_) {}
    })();
  }, [user]);

  const handleGenerateMore = async () => {
    if (!user || !sessionData) return;
    setIsGeneratingMore(true);
    setError('');
    try {
      const stream = sessionData.academicStream || 'Engineering / Tech';
      const sks = (sessionData.skills || []).join(',');
      const ints = (sessionData.interests || []).join(',');
      const context = sessionData.additionalContext || '';

      const params = new URLSearchParams({
        academicStream: stream,
        skills: sks,
        interests: ints,
        generateMore: 'true',
        cNum1: '3',
        cNum2: '7',
        cAns: '10'
      });

      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {};
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const res = await fetch(`/api/generate-recommendations?${params.toString()}`, { headers });
      if (!res.ok) {
        throw new Error(`Failed to generate alternative recommendations: ${res.status}`);
      }

      const result = await res.json();
      if (result.success && result.data && result.data.recommendations) {
        const docRef = await addDoc(collection(db, 'history', user.uid, 'entries'), {
          title: stream + " Alternative Map",
          content: JSON.stringify({
            academicStream: stream,
            skills: sessionData.skills || [],
            interests: sessionData.interests || [],
            additionalContext: context,
            recommendations: result.data.recommendations
          }),
          createdAt: serverTimestamp()
        });
        router.push(`/dashboard/results?session=${docRef.id}`);
      } else {
        throw new Error(result.error || 'Failed to parse alternate recommendations.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while generating alternative paths.');
    } finally {
      setIsGeneratingMore(false);
    }
  };

  const handleRefineSubmit = async () => {
    if (!user) return;
    setShowRefineModal(false);
    setIsGeneratingMore(true);
    setError('');
    try {
      const skillsArray = refineSkills.split(',').map(s => s.trim()).filter(Boolean);
      const interestsArray = refineInterests.split(',').map(i => i.trim()).filter(Boolean);

      const params = new URLSearchParams({
        academicStream: refineStream,
        skills: skillsArray.join(','),
        interests: interestsArray.join(','),
        cNum1: '3',
        cNum2: '7',
        cAns: '10'
      });

      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {};
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const res = await fetch(`/api/generate-recommendations?${params.toString()}`, { headers });
      if (!res.ok) throw new Error(`Refining failed: ${res.status}`);
      const result = await res.json();
      if (result.success && result.data && result.data.recommendations) {
        const docRef = await addDoc(collection(db, 'history', user.uid, 'entries'), {
          title: refineStream + " Refined Map",
          content: JSON.stringify({
            academicStream: refineStream,
            skills: skillsArray,
            interests: interestsArray,
            additionalContext: sessionData?.additionalContext || '',
            recommendations: result.data.recommendations
          }),
          createdAt: serverTimestamp()
        });
        router.push(`/dashboard/results?session=${docRef.id}`);
      } else {
        throw new Error(result.error || 'Failed to refine recommendations.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred while refining preferences.');
    } finally {
      setIsGeneratingMore(false);
    }
  };

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
      return [prevSelected[1], title];
    });
  };

  // --- SKELETON LOADER ---
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-8 lg:py-12 animate-pulse space-y-8 text-zinc-400">
        <div className="h-4 bg-zinc-900 border border-zinc-800 rounded-full w-96 mx-auto mb-10"></div>
        <div className="space-y-4 mb-12">
          <div className="h-6 bg-zinc-900 border border-zinc-800 rounded-full w-32"></div>
          <div className="h-10 bg-zinc-900 border border-zinc-800 rounded-lg w-2/3"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 h-40"></div>
            ))}
          </div>
          <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 h-96"></div>
        </div>
      </div>
    );
  }

  // --- ERROR FALLBACK STATE ---
  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 mb-6 text-zinc-400">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-xl font-bold text-white mb-3">Unable to Load Analysis</h2>
        <p className="text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          {error} Possible causes include an expired session, Firestore permission restrictions, or missing data.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={loadSession} className="btn-primary py-2.5 px-6 text-xs font-semibold">
            Retry
          </button>
          <Link href="/dashboard" className="btn-ghost py-2.5 px-6 text-xs font-semibold no-underline flex items-center justify-center">
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
        <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-950 border border-zinc-850 rounded-2xl mb-8 shadow-inner text-zinc-500">
          <Sparkles size={36} />
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

  // Get active selected path
  const activeRec = recommendations[activeCareerIdx];
  const gapData = activeRec.skillGapAnalysis || getFallbackSkillGap(activeRec.title);

  // Extract skills chips
  const profileChips: string[] = [];
  if (sessionData?.academicStream) profileChips.push(sessionData.academicStream);
  if (sessionData?.skills && sessionData.skills.length > 0) {
    profileChips.push(...sessionData.skills.slice(0, 4));
  }
  if (sessionData?.interests && sessionData.interests.length > 0) {
    profileChips.push(...sessionData.interests.slice(0, 2));
  }

  // Find two recommendations to compare
  const comp1 = recommendations.find(r => r.title === selectedCareers[0]) || recommendations[0];
  const comp2 = recommendations.find(r => r.title === selectedCareers[1]) || recommendations[1];

  return (
    <div className="max-w-6xl mx-auto py-2 lg:py-4 relative pb-24 text-zinc-100">
      {/* ══ HEADER / ACTION NAVIGATION ══ */}
      <div className="flex justify-between items-center mb-4">
        <Link href="/dashboard" className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 no-underline font-mono">
          <ArrowLeft size={12} />
          Modify Profile Inputs
        </Link>
      </div>

      {/* ══ HERO SECTION ══ */}
      <div className="mb-6 text-left space-y-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-mono text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            AI Career Analysis Complete
          </div>
          <span className="text-[10px] text-zinc-600 font-mono flex items-center gap-1">
            <Calendar size={11} /> 2026-06-22
          </span>
        </div>

        {/* ── Existing career replacement banner ── */}
        {existingCareer && (
          <div
            className="flex items-start gap-3 rounded-xl border px-4 py-3 mb-4"
            style={{
              background: 'rgba(245,158,11,0.07)',
              borderColor: 'rgba(245,158,11,0.25)',
            }}
          >
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
            <p className="text-xs leading-relaxed" style={{ color: '#fcd34d', margin: 0 }}>
              You are currently committed to{' '}
              <strong className="text-white">{existingCareer}</strong>.{' '}
              Committing to a new career below will replace this goal. Your completed learning, projects, and achievements are preserved.
            </p>
          </div>
        )}

        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
          Top Career Matches For You
        </h2>

        <div className="flex items-center gap-6 flex-wrap text-xs text-zinc-400 pt-2 border-b border-zinc-900 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-zinc-500 uppercase tracking-wider">Based on:</span>
            {profileChips.map((chip, idx) => (
              <span 
                key={idx} 
                className="bg-zinc-900 border border-zinc-800 px-3 py-0.5 rounded-full text-zinc-300 text-[11px] font-medium"
              >
                {chip}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 border-l border-zinc-900 pl-6 font-mono text-[11px]">
            <div>
              <span className="text-zinc-500 uppercase">Identified:</span>{' '}
              <span className="text-white font-bold">3 Careers</span>
            </div>
            <div>
              <span className="text-zinc-500 uppercase">Confidence:</span>{' '}
              <span className="text-white font-bold">96%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ INTERACTIVE DUAL-PANEL ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-16">
        {/* Left Column: Recommendations list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">RECOMMENDED PATHS</span>
            <span className="text-[10px] font-mono text-zinc-600">Click to focus details</span>
          </div>

          <div className="flex flex-col gap-2 mb-4 bg-zinc-900/30 p-4 border border-zinc-900 rounded-xl">
            <button
              onClick={handleGenerateMore}
              className="btn-primary w-full text-xs py-2.5 font-bold flex items-center justify-center gap-1.5"
            >
              ✨ Generate 3 More Careers
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowRefineModal(true)}
                className="btn-ghost text-xs py-2 font-semibold text-zinc-300 border border-zinc-800"
              >
                ⚙ Refine
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-ghost text-xs py-2 font-semibold text-zinc-300 border border-zinc-800"
              >
                ✏ Change Prefs
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <CareerCard
                key={rec.title}
                {...rec}
                index={index}
                isSelected={selectedCareers.includes(rec.title)}
                isActive={activeCareerIdx === index}
                onActivate={() => setActiveCareerIdx(index)}
                onSelect={handleSelectCareer}
              />
            ))}
          </div>
        </div>

        {/* Right Column: Dynamic active path detailed breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">ACTIVE PATH DETAILS</span>
            <span className="text-xs font-mono font-bold text-white bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
              {activeRec.title}
            </span>
          </div>

          <div className="bg-zinc-955 border border-zinc-900 rounded-2xl p-6 space-y-8">
            {/* Commit Pathway Callout */}
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  🎯 Focus on this Goal
                </h4>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-md">
                  Commit to {activeRec.title} as your primary path. This configures your learning workspace, dashboards, and AI support specifically for this career.
                </p>
              </div>
              <button
                onClick={() => handleCommitPath(activeRec.title)}
                className="btn-primary shrink-0 py-2.5 px-6 text-xs font-bold shadow-glow-terra"
              >
                Commit to this Career →
              </button>
            </div>

            {/* Section 8: AI Insight Panel */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase flex items-center gap-1.5">
                <Sparkles size={12} /> AI Insight
              </span>
              <p className="text-sm text-zinc-200 leading-relaxed font-medium bg-zinc-900/30 p-4 border border-zinc-900 rounded-xl">
                {gapData.aiInsight}
              </p>
            </div>

            {/* Section 3: Skill Gap Analysis */}
            <div className="space-y-4">
              <div className="flex items-end justify-between border-b border-zinc-900 pb-3">
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase flex items-center gap-1.5">
                  <Layers size={12} /> Skill Readiness
                </span>
                <span className="font-mono text-xs font-bold text-white">{gapData.readinessScore}% Ready</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Current skills */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Current Skills</span>
                  <div className="space-y-2">
                    {gapData.currentSkills.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-zinc-900/20 border border-zinc-900/60 p-2.5 rounded-lg">
                        <span className="text-zinc-200 font-semibold flex items-center gap-2">
                          <CheckCircle2 size={12} className="text-emerald-400" />
                          {s}
                        </span>
                        <span className="font-mono text-zinc-500 text-[10px]">100%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing skills & Readiness Progress bars */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Missing Gaps</span>
                  <div className="space-y-3">
                    {gapData.missingSkills.map((s, i) => (
                      <div key={i} className="space-y-1.5 bg-zinc-900/20 border border-zinc-900/60 p-2.5 rounded-lg">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-zinc-200 flex items-center gap-2">
                            <AlertTriangle size={12} className="text-amber-500" />
                            {s.name}
                          </span>
                          <span className="font-mono text-zinc-400 text-[10px]">{s.level}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-white/40 h-full" style={{ width: `${s.level}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6: Learning Roadmap Timeline */}
            <div className="space-y-4">
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase flex items-center gap-1.5 border-b border-zinc-900 pb-3">
                <Map size={12} /> Learning Roadmap Timeline
              </span>
              <div className="space-y-4 pt-2">
                {activeRec.roadmap.map((step, idx) => (
                  <div key={idx} className="flex gap-4 relative">
                    {idx < activeRec.roadmap.length - 1 && (
                      <div className="absolute left-[9px] top-6 bottom-0 w-0.5 bg-zinc-900"></div>
                    )}
                    <div className="w-5 h-5 shrink-0 rounded-full bg-white text-black font-mono font-bold text-[10px] flex items-center justify-center z-10">
                      {idx + 1}
                    </div>
                    <div className="bg-zinc-900/20 border border-zinc-900 p-3.5 rounded-xl flex-1 text-xs">
                      <span className="text-[10px] font-mono text-zinc-500 block mb-1">MILESTONE {idx + 1}</span>
                      <p className="text-zinc-200 leading-normal">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 7: Recommended Certifications */}
            {activeRec.suggestedCertifications && activeRec.suggestedCertifications.length > 0 && (
              <div className="space-y-4">
                <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase flex items-center gap-1.5 border-b border-zinc-900 pb-3">
                  <Award size={12} /> Recommended Certifications
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {activeRec.suggestedCertifications.map((c, i) => (
                    <div key={i} className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-xl space-y-2">
                      <span className="text-xs font-bold text-white block leading-tight">{c}</span>
                      <div className="flex gap-4 text-[10px] font-mono text-zinc-500">
                        <div>
                          <span>Difficulty:</span> <span className="text-zinc-300 font-bold">Medium</span>
                        </div>
                        <div>
                          <span>Job Impact:</span> <span className="text-zinc-300 font-bold">High</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ SECTION 2/4/5: ANALYTICS SECTION ══ */}
      <AnalyticsSection recommendations={recommendations} />

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
            onClick={() => router.push(`/dashboard/compare?session=${sessionId}&c1=${selectedCareers[0]}&c2=${selectedCareers[1]}`)}
            disabled={selectedCareers.length !== 2}
            className="btn-primary py-2 px-5 text-[11px] font-semibold tracking-wider uppercase disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            Compare
          </button>
        </div>
      )}

      {/* Sliding Compare Drawer overlay */}
      {selectedCareers.length === 2 && (
        <CompareDrawer
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          career1={comp1}
          career2={comp2}
        />
      )}
      {/* ══ AI LOADERS OVERLAYS ══ */}
      {isCommitting && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-6">
          <div className="loading-spinner" style={{ border: '4px solid rgba(255,255,255,0.05)', borderTop: '4px solid var(--accent-clay)', borderRadius: '50%', width: '64px', height: '64px', animation: 'spin 1s linear infinite' }}></div>
          <div className="text-center space-y-2 animate-pulse">
            <h3 className="text-lg font-bold text-white">Generating AI Career Blueprint...</h3>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">Evaluating health index, skill gap deltas, target companies, and learning roadmaps for {activeRec.title}...</p>
          </div>
        </div>
      )}
      
      {isGeneratingMore && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-6">
          <div className="loading-spinner" style={{ border: '4px solid rgba(255,255,255,0.05)', borderTop: '4px solid var(--accent-clay)', borderRadius: '50%', width: '64px', height: '64px', animation: 'spin 1s linear infinite' }}></div>
          <div className="text-center space-y-2 animate-pulse">
            <h3 className="text-lg font-bold text-white">Recalculating Career Options...</h3>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">Querying Gemini AI for alternative paths or refined preferences...</p>
          </div>
        </div>
      )}

      {/* ══ REFINE MODAL DIALOG ══ */}
      {showRefineModal && (
        <div className="modal-overlay open">
          <div className="modal" style={{ maxWidth: 500 }}>
            <button
              onClick={() => setShowRefineModal(false)}
              className="modal-close"
            >
              ✕
            </button>
            <div className="text-2xl mb-2">⚙</div>
            <h3 className="modal-title">Refine Recommendations</h3>
            <p className="modal-sub">Update parameters to recalculate career suggestions</p>
            
            <div className="space-y-4 text-left mt-6">
              <div className="form-group">
                <label className="text-xs font-mono text-zinc-400">Academic Stream</label>
                <input
                  type="text"
                  value={refineStream}
                  onChange={(e) => setRefineStream(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg text-sm text-white"
                />
              </div>
              <div className="form-group">
                <label className="text-xs font-mono text-zinc-400">Skills (comma-separated)</label>
                <textarea
                  value={refineSkills}
                  onChange={(e) => setRefineSkills(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg text-sm text-white"
                />
              </div>
              <div className="form-group">
                <label className="text-xs font-mono text-zinc-400">Interests (comma-separated)</label>
                <textarea
                  value={refineInterests}
                  onChange={(e) => setRefineInterests(e.target.value)}
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg text-sm text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-8">
              <button
                onClick={() => setShowRefineModal(false)}
                className="btn-ghost py-2 px-5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRefineSubmit}
                className="btn-primary py-2 px-5 text-xs font-bold"
              >
                Refine Paths
              </button>
            </div>
          </div>
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
