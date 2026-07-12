/**
 * Profile Intelligence Dashboard — Phase 2.0
 * Unified developer profile aggregation with AI career analysis.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import DonutChart from '@/components/charts/DonutChart';
import LineChart from '@/components/charts/LineChart';
import ScoreRing from '@/components/profile/ScoreRing';
import PlatformCard from '@/components/profile/PlatformCard';
import CareerScoreboard from '@/components/profile/CareerScoreboard';
import AiInsightPanel from '@/components/profile/AiInsightPanel';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type {
  UnifiedProfile,
  ProfileScore,
  AIProfileAnalysis,
  LinkedInData,
} from '@/types';

// ── Constants ────────────────────────────────────────────────────────────────

const LANG_COLORS: Record<string, string> = {
  Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#3178c6',
  Java: '#b07219', 'C++': '#f34b7d', C: '#555555', Go: '#00ADD8',
  Rust: '#dea584', Ruby: '#701516', PHP: '#4F5D95', Swift: '#F05138',
  Kotlin: '#A97BFF', CSS: '#563d7c', HTML: '#e34c26', Shell: '#89e051',
  Dart: '#00B4AB', Scala: '#c22d40', R: '#198CE7', Vue: '#41b883',
};

const CF_RANK_COLORS: Record<string, string> = {
  newbie: '#808080', pupil: '#008000', specialist: '#03a89e',
  expert: '#0000ff', 'candidate master': '#aa00aa', master: '#ff8c00',
  'international master': '#ff8c00', grandmaster: '#ff0000',
  'international grandmaster': '#ff0000', 'legendary grandmaster': '#ff0000',
};

type PlatformStatus = 'idle' | 'loading' | 'connected' | 'error';
type SyncState = 'idle' | 'syncing' | 'done' | 'error';

interface Handles {
  github: string;
  leetcode: string;
  codeforces: string;
  linkedin: string;
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function getRankColor(rank: string): string {
  return CF_RANK_COLORS[rank?.toLowerCase() || ''] || '#888';
}

// ── Main Component ────────────────────────────────────────────────────────────

function ProfileIntelligenceContent() {
  const [handles, setHandles] = useState<Handles>({ github: '', leetcode: '', codeforces: '', linkedin: '' });
  const [linkedinDetails, setLinkedinDetails] = useState<Partial<LinkedInData>>({});
  const [statuses, setStatuses] = useState<Record<string, PlatformStatus>>({
    github: 'idle', leetcode: 'idle', codeforces: 'idle', linkedin: 'idle',
  });
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [profile, setProfile] = useState<UnifiedProfile | null>(null);
  const [score, setScore] = useState<ProfileScore | null>(null);
  const [analysis, setAnalysis] = useState<AIProfileAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [editMode, setEditMode] = useState(true);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'linkedin'>('dashboard');
  const [syncErrors, setSyncErrors] = useState<{ platformId: string; message: string }[]>([]);

  // Load from Firestore on mount
  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.unifiedProfile) {
            setProfile(data.unifiedProfile as UnifiedProfile);
            setScore(data.profileScore as ProfileScore);
            if (data.aiAnalysis) setAnalysis(data.aiAnalysis as AIProfileAnalysis);

            // Restore handles
            const p = data.unifiedProfile as UnifiedProfile;
            const newHandles: Handles = { github: '', leetcode: '', codeforces: '', linkedin: '' };
            for (const conn of p.connections || []) {
              newHandles[conn.id] = conn.handle;
              setStatuses(s => ({ ...s, [conn.id]: conn.status as PlatformStatus }));
            }
            setHandles(newHandles);
            if (p.linkedin) setLinkedinDetails(p.linkedin);
            setEditMode(false);
          } else if (data.profileHandles) {
            setHandles(data.profileHandles as Handles);
          }
        }
      } catch (err) {
        console.error('[ProfileIntelligence] Failed to load from Firestore:', err);
      }
    };
    // Small delay to let auth settle
    const t = setTimeout(load, 500);
    return () => clearTimeout(t);
  }, []);

  const getIdToken = async (): Promise<string | null> => {
    return (await auth.currentUser?.getIdToken()) ?? null;
  };

  const syncAll = async () => {
    const hasAnyHandle = Object.values(handles).some((h) => h.trim());
    if (!hasAnyHandle) {
      alert('Please enter at least one platform handle to sync.');
      return;
    }

    setSyncState('syncing');
    setSyncErrors([]);
    setEditMode(false);

    // Set all active platforms to loading
    for (const [key, val] of Object.entries(handles)) {
      if (val.trim()) setStatuses(s => ({ ...s, [key]: 'loading' }));
    }

    try {
      const token = await getIdToken();
      const res = await fetch('/api/profile-aggregator/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          handles,
          linkedin: handles.linkedin.trim() ? { ...linkedinDetails, profileUrl: handles.linkedin.trim() } : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      setProfile(data.profile);
      setScore(data.score);
      setSyncErrors(data.errors || []);
      setSyncState('done');

      // Update statuses
      const newStatuses: Record<string, PlatformStatus> = { github: 'idle', leetcode: 'idle', codeforces: 'idle', linkedin: 'idle' };
      for (const conn of (data.profile as UnifiedProfile).connections) {
        newStatuses[conn.id] = conn.status as PlatformStatus;
      }
      for (const err of (data.errors || [])) {
        newStatuses[err.platformId] = 'error';
      }
      setStatuses(newStatuses);
    } catch (err) {
      setSyncState('error');
      setSyncErrors([{ platformId: 'general', message: (err as Error).message }]);
      // Reset all loading statuses to error
      setStatuses(s => {
        const next = { ...s };
        for (const key of Object.keys(next)) {
          if (next[key] === 'loading') next[key] = 'error';
        }
        return next;
      });
    }
  };

  const runAnalysis = useCallback(async () => {
    if (!profile) return;
    setAnalysisLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/profile-aggregator/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (data.analysis) setAnalysis(data.analysis);
    } catch (err) {
      console.error('[ProfileIntelligence] Analysis error:', err);
    } finally {
      setAnalysisLoading(false);
    }
  }, [profile]);

  // Chart data
  const donutData = (profile?.programmingLanguages || []).map((l) => ({
    label: l.name,
    value: l.percentage,
    color: LANG_COLORS[l.name] || '#888',
  }));

  const lineData = (profile?.codeforces?.ratingHistory || []).map((r) => ({
    label: new Date(r.date).toLocaleString('default', { month: 'short', year: '2-digit' }),
    value: r.rating,
  }));

  const hasProfile = !!profile;
  const connectedCount = Object.values(statuses).filter((s) => s === 'connected').length;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1280, margin: '0 auto' }}>

      {/* ══ HEADER ══ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1.75rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: '1.5rem' }}>🌐</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Profile Intelligence
            </h1>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', margin: 0 }}>
            Unified career intelligence from your developer presence across the web
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {hasProfile && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}>
              Last sync: {profile?.lastSyncAt ? getTimeAgo(profile.lastSyncAt) : '—'}
            </span>
          )}
          <button
            id="edit-profiles-btn"
            onClick={() => setEditMode(true)}
            style={{
              padding: '0.45rem 1.1rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600,
              border: '1px solid var(--border-subtle)', background: 'transparent',
              color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}
          >
            ✏️ Edit Profiles
          </button>
        </div>
      </div>

      {/* ══ TOP GRID: Connections + Hero Score ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* Platform Connections Panel */}
        <div className="ra-section animate-fade-up">
          <div className="ra-section-title" style={{ marginBottom: '1rem' }}>
            <span>🔗</span> Connected Platforms
            {connectedCount > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--accent-teal)', fontWeight: 600 }}>
                {connectedCount}/4 Connected
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { id: 'github', icon: '⚫', label: 'GitHub', placeholder: 'username', isLinkedIn: false },
              { id: 'leetcode', icon: '🟡', label: 'LeetCode', placeholder: 'username', isLinkedIn: false },
              { id: 'codeforces', icon: '🔵', label: 'Codeforces', placeholder: 'handle', isLinkedIn: false },
              { id: 'linkedin', icon: '🔗', label: 'LinkedIn', placeholder: 'linkedin.com/in/username', isLinkedIn: true },
            ].map((p) => (
              <PlatformCard
                key={p.id}
                id={p.id}
                icon={p.icon}
                label={p.label}
                handle={handles[p.id as keyof Handles]}
                status={statuses[p.id] as PlatformStatus}
                editMode={editMode}
                placeholder={p.placeholder}
                isLinkedIn={p.isLinkedIn}
                onHandleChange={(val) => setHandles((h) => ({ ...h, [p.id]: val }))}
              />
            ))}
          </div>

          {/* LinkedIn extra fields (shown in edit mode when linkedin is set) */}
          {editMode && handles.linkedin.trim() && (
            <div style={{ marginTop: '0.75rem', padding: '10px 12px', borderRadius: 8, background: 'rgba(0,119,181,0.06)', border: '1px solid rgba(0,119,181,0.2)' }}>
              <div style={{ fontSize: '0.72rem', color: '#0077b5', fontWeight: 600, marginBottom: 8 }}>
                🔗 LinkedIn Details (Optional)
              </div>
              {[
                { key: 'headline', placeholder: 'Software Engineer at Acme Corp', label: 'Headline' },
                { key: 'currentRole', placeholder: 'Software Engineer', label: 'Current Role' },
                { key: 'company', placeholder: 'Acme Corp', label: 'Company' },
              ].map((field) => (
                <div key={field.key} style={{ marginBottom: 6 }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>{field.label}</label>
                  <input
                    type="text"
                    value={(linkedinDetails as any)[field.key] || ''}
                    onChange={(e) => setLinkedinDetails((d) => ({ ...d, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%', fontSize: '0.75rem', padding: '5px 8px',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)',
                      borderRadius: 6, color: 'var(--text-secondary)', outline: 'none', fontFamily: 'var(--font-body)',
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Sync button */}
          <div style={{ marginTop: '1rem', display: 'flex', gap: 8 }}>
            {editMode ? (
              <button
                id="sync-all-btn"
                className="btn-primary"
                onClick={syncAll}
                disabled={syncState === 'syncing'}
                style={{ fontSize: '0.8rem', padding: '0.5rem 1.5rem', opacity: syncState === 'syncing' ? 0.7 : 1 }}
              >
                {syncState === 'syncing' ? '⏳ Syncing...' : '🔄 Sync All Platforms'}
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={syncAll}
                style={{ fontSize: '0.8rem', padding: '0.5rem 1.5rem' }}
              >
                🔄 Re-Sync
              </button>
            )}
          </div>

          {/* Sync errors */}
          {syncErrors.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {syncErrors.map((err, i) => (
                <div key={i} style={{ fontSize: '0.72rem', color: '#f87171', marginTop: 4, display: 'flex', gap: 6 }}>
                  <span>⚠️</span>
                  <span>{err.platformId !== 'general' ? `${err.platformId}: ` : ''}{err.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Career Readiness Hero */}
        <div className="ra-section animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="ra-section-title" style={{ marginBottom: '1rem' }}>
            <span>🎯</span> Career Readiness Score
          </div>

          {score ? (
            <div>
              {/* Large score ring + platform rings */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <ScoreRing
                  score={score.overall}
                  size={180}
                  strokeWidth={14}
                  color="auto"
                  label="Overall Score"
                  sublabel="Career Readiness"
                />
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <ScoreRing score={score.dsa} size={80} strokeWidth={7} color="#f59e0b" label="DSA" />
                  <ScoreRing score={score.github} size={80} strokeWidth={7} color="#10b981" label="GitHub" />
                  <ScoreRing score={score.cp} size={80} strokeWidth={7} color="#8b5cf6" label="CP" />
                </div>
              </div>

              {/* Quick stats strip */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem',
                padding: '12px 0', borderTop: '1px solid var(--border-subtle)',
              }}>
                {[
                  { label: 'Repos', value: profile?.totalRepositories || '—', color: 'var(--accent-teal)' },
                  { label: 'Stars', value: profile?.totalStars ? `⭐ ${profile.totalStars}` : '—', color: '#f59e0b' },
                  { label: 'Problems', value: profile?.codingProblemsSolved || '—', color: '#8b5cf6' },
                  { label: 'Rating', value: profile?.codeforces?.rating || '—', color: '#3b82f6' },
                ].map((stat) => (
                  <div key={stat.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: stat.color }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '1rem' }}>
              <div style={{ fontSize: '3rem', opacity: 0.3 }}>🎯</div>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>
                Connect your platforms and sync to see your career readiness score
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ══ SCORE BREAKDOWN ══ */}
      {score && (
        <div className="ra-section animate-fade-up" style={{ marginBottom: '1.5rem' }}>
          <div className="ra-section-title" style={{ marginBottom: '1rem' }}>
            <span>📊</span> Score Breakdown
          </div>
          <CareerScoreboard score={score} />
        </div>
      )}

      {/* ══ CHARTS ROW: Languages + CP Trend ══ */}
      {hasProfile && (donutData.length > 0 || lineData.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

          {/* Language Breakdown */}
          <div className="ra-section animate-fade-up">
            <div className="ra-section-title" style={{ marginBottom: '1rem' }}><span>🎨</span> Language Breakdown</div>
            {donutData.length > 0 ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0 1rem' }}>
                  <DonutChart data={donutData} size={180} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {donutData.slice(0, 6).map((l) => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color, flexShrink: 0 }} />
                      {l.label} <span style={{ color: 'var(--text-dim)' }}>({l.value}%)</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', textAlign: 'center', padding: '2.5rem 0' }}>
                Connect GitHub to see language breakdown
              </p>
            )}
          </div>

          {/* CP Rating Trend */}
          <div className="ra-section animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="ra-section-title" style={{ marginBottom: '0.5rem' }}>
              <span>📈</span> Competitive Programming Trend
              {profile?.codeforces?.rank && (
                <span style={{
                  marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px',
                  borderRadius: 10, background: `${getRankColor(profile.codeforces.rank)}20`,
                  color: getRankColor(profile.codeforces.rank), border: `1px solid ${getRankColor(profile.codeforces.rank)}40`,
                  textTransform: 'capitalize',
                }}>
                  {profile.codeforces.rank}
                </span>
              )}
            </div>
            {lineData.length > 0 ? (
              <div style={{ padding: '0.5rem 0' }}>
                <LineChart data={lineData} width={480} height={200} color="#8b5cf6" />
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: 12 }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#8b5cf6', fontFamily: 'var(--font-display)' }}>
                      {profile?.codeforces?.rating || '—'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Current Rating</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>
                      {profile?.codeforces?.maxRating || '—'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Peak Rating</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-teal)', fontFamily: 'var(--font-display)' }}>
                      {profile?.codeforces?.contestsParticipated || '—'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Contests</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', fontFamily: 'var(--font-display)' }}>
                      {profile?.codeforces?.problemsSolved || '—'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Solved</div>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', textAlign: 'center', padding: '2.5rem 0' }}>
                Connect Codeforces to see rating history
              </p>
            )}
          </div>
        </div>
      )}

      {/* ══ LEETCODE BREAKDOWN ══ */}
      {profile?.leetcode && (
        <div className="ra-section animate-fade-up" style={{ marginBottom: '1.5rem' }}>
          <div className="ra-section-title" style={{ marginBottom: '1rem' }}>
            <span>🏆</span> LeetCode Progress
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'Total Solved', value: profile.leetcode.totalSolved, total: profile.leetcode.totalQuestions, color: 'var(--accent-teal)' },
              { label: 'Easy', value: profile.leetcode.easySolved, total: profile.leetcode.easyTotal, color: '#22c55e' },
              { label: 'Medium', value: profile.leetcode.mediumSolved, total: profile.leetcode.mediumTotal, color: '#f59e0b' },
              { label: 'Hard', value: profile.leetcode.hardSolved, total: profile.leetcode.hardTotal, color: '#ef4444' },
              ...(profile.leetcode.contestRating > 0 ? [{ label: 'Contest Rating', value: profile.leetcode.contestRating, total: null, color: '#8b5cf6' }] : []),
              ...(profile.leetcode.ranking > 0 ? [{ label: 'Global Rank', value: `#${profile.leetcode.ranking.toLocaleString()}`, total: null, color: '#3b82f6' }] : []),
            ].map((stat) => (
              <div key={stat.label} style={{ padding: '14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: `1px solid ${stat.color}25` }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: stat.color }}>
                  {stat.value}
                  {stat.total && stat.total > 0 && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 400 }}>/{stat.total}</span>
                  )}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4 }}>{stat.label}</div>
                {typeof stat.value === 'number' && stat.total && stat.total > 0 && (
                  <div style={{ marginTop: 8, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (stat.value / stat.total) * 100)}%`, borderRadius: 99, background: stat.color, transition: 'width 1s ease' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ TOP REPOSITORIES ══ */}
      {profile?.github?.repos && profile.github.repos.length > 0 && (
        <div className="ra-section animate-fade-up" style={{ marginBottom: '1.5rem' }}>
          <div className="ra-section-title" style={{ marginBottom: '1rem' }}>
            <span>📁</span> Top GitHub Repositories
            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              {profile.github.publicRepos} total · {profile.github.followers} followers
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="pa-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Repository</th>
                  <th>Language</th>
                  <th>Stars</th>
                  <th>Forks</th>
                  <th>Topics</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {profile.github.repos.slice(0, 10).map((repo) => (
                  <tr key={repo.name}>
                    <td>
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontWeight: 600, color: 'var(--accent-teal)', textDecoration: 'none', fontSize: '0.82rem' }}
                      >
                        {repo.name}
                        {repo.isForked && (
                          <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginLeft: 4 }}>(fork)</span>
                        )}
                      </a>
                      {repo.description && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 2, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {repo.description}
                        </div>
                      )}
                    </td>
                    <td>
                      {repo.language !== 'Unknown' && (
                        <span className="pa-lang-badge" style={{
                          background: `${LANG_COLORS[repo.language] || '#888'}22`,
                          color: LANG_COLORS[repo.language] || '#888',
                          border: `1px solid ${LANG_COLORS[repo.language] || '#888'}44`,
                        }}>
                          {repo.language}
                        </span>
                      )}
                    </td>
                    <td style={{ color: '#f59e0b' }}>⭐ {repo.stars}</td>
                    <td style={{ color: 'var(--text-dim)' }}>🍴 {repo.forks}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {repo.topics.slice(0, 2).map((t) => (
                          <span key={t} style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: 8, background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {repo.updatedAt ? getTimeAgo(repo.updatedAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ AI INSIGHT PANEL ══ */}
      {hasProfile && (
        <div className="ra-section animate-fade-up" style={{ marginBottom: '1.5rem' }}>
          <div className="ra-section-title" style={{ marginBottom: '1rem' }}>
            <span>🤖</span> AI Career Analysis
            {!analysis && (
              <button
                id="generate-analysis-btn"
                className="btn-primary"
                onClick={runAnalysis}
                disabled={analysisLoading}
                style={{ marginLeft: 'auto', fontSize: '0.78rem', padding: '0.4rem 1.1rem' }}
              >
                {analysisLoading ? '⏳ Analyzing...' : '✨ Generate Analysis'}
              </button>
            )}
          </div>

          {analysis ? (
            <AiInsightPanel
              analysis={analysis}
              onRefresh={runAnalysis}
              isLoading={analysisLoading}
            />
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '3rem 0', gap: '1rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '3rem', opacity: 0.3 }}>🤖</div>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', maxWidth: 400, margin: 0, lineHeight: 1.6 }}>
                Generate an AI-powered career analysis to get personalized insights, skill gap analysis, career matches, and an action plan.
              </p>
              <button
                className="btn-primary"
                onClick={runAnalysis}
                disabled={analysisLoading}
                style={{ fontSize: '0.82rem', padding: '0.55rem 1.5rem' }}
              >
                {analysisLoading ? '⏳ Analyzing...' : '✨ Generate Career Analysis'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══ SKILL TAGS ══ */}
      {(profile?.skills || []).length > 0 && (
        <div className="ra-section animate-fade-up" style={{ marginBottom: '1.5rem' }}>
          <div className="ra-section-title" style={{ marginBottom: '0.75rem' }}><span>🏷️</span> Detected Skills</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {profile!.skills.map((skill) => (
              <span key={skill} style={{
                fontSize: '0.72rem', padding: '4px 12px', borderRadius: 20,
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)', fontWeight: 500,
              }}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ══ EMPTY STATE ══ */}
      {!hasProfile && syncState === 'idle' && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '5rem 0', gap: '1.5rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '4rem', opacity: 0.2 }}>🌐</div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              Build Your Developer Intelligence Profile
            </h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', maxWidth: 420, lineHeight: 1.6, margin: 0 }}>
              Connect your GitHub, LeetCode, Codeforces, and LinkedIn accounts to generate a unified career intelligence dashboard with AI-powered insights.
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => setEditMode(true)}
            style={{ fontSize: '0.85rem', padding: '0.65rem 1.75rem' }}
          >
            🔗 Connect Platforms
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProfileIntelligencePage() {
  return (
    <ProtectedRoute>
      <ProfileIntelligenceContent />
    </ProtectedRoute>
  );
}
