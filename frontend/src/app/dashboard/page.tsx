/**
 * SkillSphere — Main Dashboard
 *
 * CAREER GATE LOGIC:
 *  ┌─ No primary career selected ──► Show Career Advisor onboarding flow
 *  └─ Career committed            ──► Show Current Career Card + quick actions
 *
 * The "Run Career Advisor" button and form are ONLY visible when the user
 * has not yet committed to a career (or has explicitly requested a change).
 */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import SimpleCaptcha from '@/components/ui/SimpleCaptcha';
import { db, auth } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth, useCaptcha } from '@/hooks';
import ScoreRing from '@/components/profile/ScoreRing';
import { DashboardSkeleton } from '@/components/ui/SkeletonLoader';
import Link from 'next/link';
import { WelcomeCard } from '@/components/onboarding/WelcomeCard';
import { ResumeUploader } from '@/components/onboarding/ResumeUploader';
import { ProfileReview } from '@/components/onboarding/ProfileReview';
import { SmartQuestionWidget } from '@/components/onboarding/SmartQuestionWidget';
import CurrentCareerCard, { type CareerStatusData } from '@/components/dashboard/CurrentCareerCard';

// ─────────────────────────────────────────────────────────────────────────────

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');

  // ── Career Gate State ────────────────────────────────────────────────────
  const [careerStatus, setCareerStatus] = useState<CareerStatusData | null>(null);
  const [careerGateLoading, setCareerGateLoading] = useState(true);
  /** true = user explicitly wants to re-run the advisor to change their career */
  const [changeCareerMode, setChangeCareerMode] = useState(false);

  // ── Onboarding / Profile State ───────────────────────────────────────────
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingMethod, setOnboardingMethod] = useState<'resume' | 'github' | 'manual' | 'skip' | null>(null);
  const [parsedDraft, setParsedDraft] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [dbLoading, setDbLoading] = useState(true);

  // ── Advisor Form State (used when no career or changing career) ──────────
  const [academicStream, setAcademicStream] = useState('Engineering / Tech');
  const [skills, setSkills] = useState<string[]>(['Python', 'JavaScript', 'SQL']);
  const [interests, setInterests] = useState<string[]>(['AI Ethics', 'Open Source']);
  const [additionalContext] = useState('');

  // ── Loading & Error ──────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Progressive Onboarding Modal State ──────────────────────────────────
  const [showProgressiveModal, setShowProgressiveModal] = useState(false);
  const [progressiveQuestion, setProgressiveQuestion] = useState<{ fieldKey: string; question: string } | null>(null);
  const [progressiveValue, setProgressiveValue] = useState('');

  // ── CAPTCHA ──────────────────────────────────────────────────────────────
  const {
    isCaptchaVerified,
    showCaptchaModal,
    setShowCaptchaModal,
    captchaParams,
    handleCaptchaVerify,
  } = useCaptcha((num1, num2, answer) => {
    executeSubmit(num1, num2, answer);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────

  // Redirect if a session ID is preset in the URL
  useEffect(() => {
    if (sessionId) {
      router.push(`/dashboard/results?session=${sessionId}`);
    }
  }, [sessionId, router]);

  // Load career gate status (lightweight — just checks if career is committed)
  useEffect(() => {
    if (!user) return;
    loadCareerStatus();
  }, [user]);

  // Load full profile data for the bento grid
  useEffect(() => {
    if (!user) return;
    fetchProfile();
  }, [user]);

  // ─────────────────────────────────────────────────────────────────────────
  // Data Loading
  // ─────────────────────────────────────────────────────────────────────────

  const loadCareerStatus = async () => {
    setCareerGateLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: HeadersInit = idToken ? { Authorization: `Bearer ${idToken}` } : {};
      const res = await fetch('/api/career-status', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.hasCareer) {
          setCareerStatus(d as CareerStatusData);
        } else {
          setCareerStatus(null);
        }
      }
    } catch (err) {
      console.error('Error loading career status:', err);
    } finally {
      setCareerGateLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setProfileData(data);
        if (data.unifiedProfile) {
          setSkills(data.unifiedProfile.skills || []);
          setAcademicStream(data.unifiedProfile.stream || 'Engineering / Tech');
          if (data.onboardingSkipped || (data.unifiedProfile.profileCompleteness && data.unifiedProfile.profileCompleteness >= 30)) {
            setShowOnboarding(false);
          } else {
            setShowOnboarding(true);
          }
        } else {
          setShowOnboarding(data.onboardingSkipped ? false : true);
        }
      } else {
        setShowOnboarding(true);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    } finally {
      setDbLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Onboarding Handlers (unchanged)
  // ─────────────────────────────────────────────────────────────────────────

  const handleSelectMethod = async (method: 'resume' | 'github' | 'manual' | 'skip') => {
    if (method === 'github') {
      router.push('/profile-aggregator');
      return;
    }

    if (method === 'skip' || method === 'manual') {
      setIsLoading(true);
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

        await fetch('/api/onboarding/question', {
          method: 'POST',
          headers,
          body: JSON.stringify({ field: 'personalInfo.fullName', value: user?.displayName || 'Developer' }),
        });

        const userRef = doc(db, 'users', user?.uid || '');
        await setDoc(userRef, { onboardingSkipped: true }, { merge: true });
        await fetchProfile();
        setShowOnboarding(false);

        if (method === 'manual') {
          router.push('/profile');
        }
      } catch (err) {
        console.error('Failed to initialize minimal profile:', err);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setOnboardingMethod(method);
  };

  const handleParsedDraft = (draft: any) => {
    setParsedDraft(draft);
  };

  const handleSaveApprovedDraft = async (finalDraft: any) => {
    setIsLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/onboarding/question', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ draft: finalDraft }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to save approved resume draft.');
      }

      await fetchProfile();
      setShowOnboarding(false);
    } catch (err: any) {
      console.error('Failed to save approved resume draft:', err);
      setError(err.message || 'Failed to save approved resume draft.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgressiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressiveValue.trim() || !progressiveQuestion) return;

    setIsLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const fieldName = progressiveQuestion.fieldKey;
      const value =
        fieldName === 'careerGoals.preferredRoles'
          ? progressiveValue.split(',').map((s) => s.trim()).filter(Boolean)
          : progressiveValue;

      const res = await fetch('/api/onboarding/question', {
        method: 'POST',
        headers,
        body: JSON.stringify({ field: fieldName, value }),
      });

      if (!res.ok) throw new Error('Failed to save progressive answer.');

      setShowProgressiveModal(false);
      setProgressiveQuestion(null);
      setProgressiveValue('');
      executeSubmit();
    } catch (err: any) {
      setError(err.message || 'Error saving answer.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Career Advisor Submit
  // ─────────────────────────────────────────────────────────────────────────

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isCaptchaVerified) {
      setShowCaptchaModal(true);
      return;
    }
    executeSubmit();
  };

  const executeSubmit = async (c1?: number, c2?: number, ca?: number) => {
    setIsLoading(true);
    setError('');

    const activeC1 = c1 ?? captchaParams?.num1 ?? 0;
    const activeC2 = c2 ?? captchaParams?.num2 ?? 0;
    const activeCa = ca ?? captchaParams?.answer ?? 0;

    try {
      const params = new URLSearchParams({
        academicStream,
        skills: skills.join(','),
        interests: interests.join(','),
        additionalContext,
        cNum1: activeC1.toString(),
        cNum2: activeC2.toString(),
        cAns: activeCa.toString(),
      });
      const url = `/api/generate-recommendations?${params.toString()}`;

      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = {};
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const response = await fetch(url, { headers });
      if (response.status === 429) throw new Error('SkillSphere AI is experiencing high request volumes. Please wait a few seconds.');
      if (!response.ok) {
        try {
          const errData = await response.json();
          if (errData?.error) throw new Error(errData.error);
        } catch (_) {}
        throw new Error(`Server responded with status: ${response.status}`);
      }
      if (!response.body) throw new Error('Response body is empty.');

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
        const resultJson = JSON.parse(jsonMatch[0]);

        if (resultJson.missingFields && resultJson.missingFields.length > 0) {
          setProgressiveQuestion({ fieldKey: resultJson.missingFields[0], question: resultJson.question || 'Please provide this missing information:' });
          setShowProgressiveModal(true);
          setIsLoading(false);
          return;
        }

        if (user) {
          const docRef = await addDoc(collection(db, 'history', user.uid, 'entries'), {
            title: academicStream + ' Career Map',
            content: JSON.stringify({ academicStream, skills, interests, additionalContext, recommendations: resultJson.recommendations }),
            createdAt: serverTimestamp(),
          });
          router.push(`/dashboard/results?session=${docRef.id}`);
        }
      } else {
        throw new Error('No valid recommendation data returned.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render Gates
  // ─────────────────────────────────────────────────────────────────────────

  if (careerGateLoading || dbLoading || isLoading) {
    return <DashboardSkeleton />;
  }

  // ── ONBOARDING FLOW (no profile yet) ────────────────────────────────────
  if (showOnboarding) {
    if (!onboardingMethod) {
      return <WelcomeCard onSelectMethod={handleSelectMethod} />;
    }
    if (onboardingMethod === 'resume') {
      if (!parsedDraft) {
        return <ResumeUploader onParsed={handleParsedDraft} onBack={() => setOnboardingMethod(null)} />;
      } else {
        return <ProfileReview draft={parsedDraft} onSave={handleSaveApprovedDraft} onBack={() => setParsedDraft(null)} />;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Shared bento data
  // ─────────────────────────────────────────────────────────────────────────
  const activeScore = profileData?.profileScore?.score || 72;
  const connectionsCount = profileData?.unifiedProfile?.connections?.length || 0;
  const topSkills = profileData?.unifiedProfile?.skills || ['JavaScript', 'Python', 'SQL', 'Docker'];

  // ── CAREER COMMITTED MODE ────────────────────────────────────────────────
  // Show Current Career Card instead of the advisor launch section.
  // Only re-render advisor form if user explicitly clicked "Change Career Goal".
  if (careerStatus && !changeCareerMode) {
    return (
      <div className="max-w-[1600px] mx-auto py-4">
        {/* Personalized Hero Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              Welcome back, {user?.displayName || 'Developer'}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Your career workspace is active. Keep executing your roadmap.
            </p>
          </div>
        </div>

        {/* ── CURRENT CAREER CARD ── */}
        <CurrentCareerCard
          data={careerStatus}
          onChangeCareer={() => setChangeCareerMode(true)}
        />

        {/* ── BENTO GRID (quick actions + skills + smart questions) ── */}
        <div className="bento-grid">

          {/* Career Score Widget */}
          <div className="bento-card col-span-4" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
            <ScoreRing score={activeScore} size={130} label="Career Score" color="#10b981" />
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Career Readiness</span>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Updated yesterday. Connect accounts to increase score.</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bento-card col-span-4">
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Quick Actions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/skill-quiz" className="no-underline" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                <span>🧩</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Launch Skill Quiz</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Identify code base strengths</span>
                </div>
              </Link>
              <Link href="/resume-analyzer" className="no-underline" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                <span>📊</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Scan Resume PDF</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Compare against market roles</span>
                </div>
              </Link>
              <Link href="/interview-prep" className="no-underline" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                <span>🎤</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Interview Prep</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Practice with AI questions</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Primary Skills */}
          <div className="bento-card col-span-4" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Primary Skills</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '12px 0' }}>
              {topSkills.map((s: string) => (
                <span key={s} style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: 6 }}>
                  {s}
                </span>
              ))}
            </div>
            <div style={{ flex: 1, borderTop: '1px solid var(--border-subtle)', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Competency</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10b981' }}>Intermediate</span>
            </div>
          </div>

          {/* Smart Question / Profile Progress Widget */}
          <div className="bento-card col-span-4">
            <SmartQuestionWidget onProgressUpdate={(score) => {
              setProfileData((prev: any) => {
                if (!prev) return prev;
                return { ...prev, unifiedProfile: { ...(prev.unifiedProfile || {}), profileCompleteness: score } };
              });
            }} />
          </div>

        </div>

        {/* ── CAREER SETTINGS PANEL ── */}
        <div
          style={{
            marginTop: '2rem',
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>⚙ Career Settings</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: '2px 0 0' }}>
              Re-run the Career Advisor to explore a different path. Your current progress and achievements are preserved.
            </p>
          </div>
          <button
            onClick={() => setChangeCareerMode(true)}
            style={{
              background: 'none',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              padding: '8px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Change Career Goal
          </button>
        </div>
      </div>
    );
  }

  // ── CAREER ADVISOR LAUNCH MODE ───────────────────────────────────────────
  // Shown when: (a) no career committed, OR (b) user clicked "Change Career Goal"
  return (
    <div className="max-w-[1600px] mx-auto py-4">
      {/* Hero Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            {changeCareerMode
              ? `Change Career Goal, ${user?.displayName?.split(' ')[0] || 'Developer'}`
              : `Welcome back, ${user?.displayName || 'Developer'}`}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {changeCareerMode
              ? 'Re-run the Career Advisor to explore a new path. Your existing progress and certifications are preserved.'
              : 'Run the Career Advisor to get your personalised career roadmap — powered by AI.'}
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {changeCareerMode && (
            <button
              onClick={() => setChangeCareerMode(false)}
              style={{
                background: 'none',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '9px 18px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              ← Back to Dashboard
            </button>
          )}
          <button
            onClick={handleSubmit}
            className="btn-primary py-2.5 px-6 text-sm"
          >
            {changeCareerMode ? 'Re-run Career Advisor →' : 'Run Career Advisor →'}
          </button>
        </div>
      </div>

      {/* Change-career context banner */}
      {changeCareerMode && careerStatus && (
        <div
          style={{
            background: 'rgba(245,158,11,0.07)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 10,
            padding: '0.9rem 1.2rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: '1rem' }}>⚠️</span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            You are currently committed to <strong style={{ color: 'var(--text-primary)' }}>{careerStatus.primaryCareerGoal}</strong>. 
            Committing to a new career will replace this goal. Completed learning, projects, and achievements are preserved.
          </p>
        </div>
      )}

      {error && (
        <div className="error-banner mb-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '0.75rem 1rem', color: '#fca5a5', fontSize: '0.8rem' }}>
          {error}
        </div>
      )}

      {/* Bento Grid */}
      <div className="bento-grid">

        {/* Career Score Widget */}
        <div className="bento-card col-span-4" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 220 }}>
          <ScoreRing score={activeScore} size={130} label="Career Score" color="#10b981" />
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Career Readiness</span>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Updated yesterday. Connect accounts to increase score.</p>
          </div>
        </div>

        {/* AI Suggestions Widget */}
        <div className="bento-card col-span-8" style={{ minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                AI Recommendation Feed
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Active Feed</span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              {connectionsCount > 0 ? 'Full-Stack Developer Track Suggested' : 'Run Diagnostics to customise track'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Connect your GitHub and Codeforces handles to allow the AI to map code commits against current industry requirements. You have {connectionsCount} active sync integrations.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <Link href="/profile-aggregator" className="btn-ghost py-2 px-4 text-xs" style={{ textDecoration: 'none' }}>
              Connect Accounts
            </Link>
            <button onClick={() => setShowOnboarding(true)} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>
              Start Questionnaire →
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bento-card col-span-4">
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Quick Actions</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link href="/skill-quiz" className="no-underline" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
              <span>🧩</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Launch Skill Quiz</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Identify code base strengths</span>
              </div>
            </Link>
            <Link href="/resume-analyzer" className="no-underline" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
              <span>📊</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Scan Resume PDF</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Compare against market roles</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Primary Skills */}
        <div className="bento-card col-span-4" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Primary Skills</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '12px 0' }}>
            {topSkills.map((s: string) => (
              <span key={s} style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: 6 }}>
                {s}
              </span>
            ))}
          </div>
          <div style={{ flex: 1, borderTop: '1px solid var(--border-subtle)', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Competency</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10b981' }}>Intermediate</span>
          </div>
        </div>

        {/* Smart Question / Profile Progress Widget */}
        <div className="bento-card col-span-4">
          <SmartQuestionWidget onProgressUpdate={(score) => {
            setProfileData((prev: any) => {
              if (!prev) return prev;
              return { ...prev, unifiedProfile: { ...(prev.unifiedProfile || {}), profileCompleteness: score } };
            });
          }} />
        </div>

      </div>

      {/* CAPTCHA Modal */}
      {showCaptchaModal && (
        <div className="modal-overlay open">
          <div className="modal">
            <button onClick={() => setShowCaptchaModal(false)} className="modal-close">✕</button>
            <div className="text-3xl mb-4">✍️</div>
            <h3 className="modal-title">Security Verification</h3>
            <p className="modal-sub">Please verify you&apos;re human before running the career advisor</p>
            <SimpleCaptcha onVerify={handleCaptchaVerify} isModal={true} />
          </div>
        </div>
      )}

      {/* Progressive Onboarding Question Modal */}
      {showProgressiveModal && progressiveQuestion && (
        <div className="modal-overlay open">
          <div className="modal animate-in">
            <button onClick={() => setShowProgressiveModal(false)} className="modal-close">✕</button>
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="modal-title">Additional Info Required</h3>
            <p className="modal-sub">{progressiveQuestion.question}</p>
            <form onSubmit={handleProgressiveSubmit} style={{ marginTop: 16 }}>
              <input
                type="text"
                value={progressiveValue}
                onChange={(e) => setProgressiveValue(e.target.value)}
                placeholder="e.g. Software Engineer, Data Analyst"
                required
                style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', color: '#fff', outline: 'none', marginBottom: 16 }}
              />
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '10px 16px', fontWeight: 600 }}>
                Submit &amp; Continue
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
