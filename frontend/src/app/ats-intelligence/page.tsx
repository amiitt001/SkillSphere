/**
 * ATS Intelligence Platform — Premium UI
 *
 * Three-phase progressive disclosure:
 * 1. Upload / Input Panel
 * 2. Score Dashboard (Universal ATS — deterministic, instant)
 * 3. Job Match + AI Insights (optional, streamed after)
 */
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import ScoreGauge from '@/components/charts/ScoreGauge';
import { auth } from '@/lib/firebase';
import type { UniversalATSReport, JobMatchReport, ATSRecommendation, ATSAIExplanation } from '@/services/ats/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'input' | 'scoring' | 'results' | 'enriching';

interface CategoryBar {
  name: string;
  score: number;
  weight: number;
  issues: string[];
  strengths: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'var(--accent-teal)';
  if (grade.startsWith('B')) return 'var(--accent-gold)';
  return 'var(--accent-rose)';
}

function getPriorityColor(priority: string): string {
  if (priority === 'critical') return '#ff5fa0';
  if (priority === 'high') return '#ffb347';
  if (priority === 'medium') return '#7cc8fa';
  return 'var(--text-dim)';
}

function getDifficultyBadge(difficulty: string): string {
  if (difficulty === 'easy') return '#4ade80';
  if (difficulty === 'medium') return '#fbbf24';
  return '#f87171';
}

function getScoreSegmentColor(score: number): string {
  if (score >= 80) return 'var(--accent-teal)';
  if (score >= 60) return 'var(--accent-gold)';
  return 'var(--accent-rose)';
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function CategoryBarRow({ cat, delay }: { cat: CategoryBar; delay: number }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(cat.score), 100 + delay);
    return () => clearTimeout(timer);
  }, [cat.score, delay]);

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{cat.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{Math.round(cat.weight * 100)}%</span>
          <span style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: getScoreSegmentColor(cat.score),
            minWidth: '2.5rem',
            textAlign: 'right',
          }}>{cat.score}</span>
        </div>
      </div>
      <div style={{
        height: '6px',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${width}%`,
          background: `linear-gradient(90deg, ${getScoreSegmentColor(cat.score)}, ${getScoreSegmentColor(cat.score)}88)`,
          borderRadius: '3px',
          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
    </div>
  );
}

function RecommendationCard({ rec, idx }: { rec: ATSRecommendation; idx: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${getPriorityColor(rec.priority)}33`,
        borderLeft: `3px solid ${getPriorityColor(rec.priority)}`,
        borderRadius: 'var(--radius-sm)',
        padding: '1rem',
        marginBottom: '0.75rem',
        cursor: 'pointer',
        transition: 'background 0.2s',
        animationDelay: `${idx * 0.05}s`,
      }}
      className="animate-fade-up"
      onClick={() => setOpen(!open)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.65rem',
              padding: '2px 8px',
              borderRadius: '12px',
              background: `${getPriorityColor(rec.priority)}22`,
              color: getPriorityColor(rec.priority),
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>{rec.priority}</span>
            <span style={{
              fontSize: '0.65rem',
              padding: '2px 8px',
              borderRadius: '12px',
              background: `${getDifficultyBadge(rec.difficulty)}22`,
              color: getDifficultyBadge(rec.difficulty),
              fontWeight: 600,
            }}>{rec.difficulty}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{rec.estimatedTime}</span>
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600 }}>{rec.title}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Expected gain</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-teal)' }}>+{rec.expectedScoreGain} pts</div>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 0.75rem' }}>{rec.reason}</p>
          {rec.resources.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resources</div>
              {rec.resources.map((r, i) => (
                <div key={i} style={{ fontSize: '0.78rem', color: 'var(--accent-teal)', marginBottom: '0.25rem' }}>
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                      ↗ {r.title}{r.platform ? ` — ${r.platform}` : ''}
                    </a>
                  ) : (
                    <span>📌 {r.title}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function ATSIntelligencePlatformContent() {
  const [phase, setPhase] = useState<Phase>('input');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [error, setError] = useState('');
  const [universalReport, setUniversalReport] = useState<UniversalATSReport | null>(null);
  const [jobMatchReport, setJobMatchReport] = useState<JobMatchReport | null>(null);
  const [aiExplanation, setAiExplanation] = useState<ATSAIExplanation | null>(null);
  const [activeTab, setActiveTab] = useState<'universal' | 'jobmatch' | 'ai'>('universal');
  const resultsRef = useRef<HTMLDivElement>(null);

  const getAuthHeaders = useCallback(async () => {
    const idToken = await auth.currentUser?.getIdToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
    return headers;
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (resumeText.trim().length < 50) {
      setError('Please provide at least 50 characters of resume text.');
      return;
    }
    setError('');
    setPhase('scoring');

    try {
      const headers = await getAuthHeaders();

      let res: Response;
      if (jobDescription.trim().length >= 50) {
        res = await fetch('/api/ats/job-match', {
          method: 'POST',
          headers,
          body: JSON.stringify({ resumeText, jobDescription, targetRole: targetRole || undefined }),
        });
      } else {
        res = await fetch('/api/ats/universal', {
          method: 'POST',
          headers,
          body: JSON.stringify({ resumeText }),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Scoring failed.');
      }

      const data = await res.json();
      if (data.universalReport) {
        setUniversalReport(data.universalReport);
        setJobMatchReport(data.jobMatchReport || null);
      } else {
        setUniversalReport(data);
        setJobMatchReport(null);
      }

      setPhase('results');
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

      // Kick off AI explanation asynchronously
      setPhase('enriching');
      const explainRes = await fetch('/api/ats/explain', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          universalReport: data.universalReport || data,
          jobMatchReport: data.jobMatchReport || undefined,
          resumeText,
          jobDescription: jobDescription || undefined,
        }),
      });

      if (explainRes.ok) {
        const explainData = await explainRes.json();
        setAiExplanation(explainData.aiExplanation || null);
      }

      setPhase('results');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
      setPhase('input');
    }
  }, [resumeText, jobDescription, targetRole, getAuthHeaders]);

  const handleReset = () => {
    setPhase('input');
    setUniversalReport(null);
    setJobMatchReport(null);
    setAiExplanation(null);
    setError('');
    setActiveTab('universal');
  };

  const universalCategories: CategoryBar[] = universalReport
    ? Object.values(universalReport.categories).map((cat) => ({
        name: cat.name,
        score: cat.rawScore,
        weight: cat.weight,
        issues: cat.issues,
        strengths: cat.strengths,
      }))
    : [];

  const jobMatchCategories: CategoryBar[] = jobMatchReport
    ? Object.values(jobMatchReport.categories).map((cat) => ({
        name: cat.name,
        score: cat.rawScore,
        weight: cat.weight,
        issues: cat.missing,
        strengths: cat.matched,
      }))
    : [];

  return (
    <div className="page-container">
      {/* ══ Header ══ */}
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: '1.4rem' }}>🧠</span>
          <h1 className="page-title" style={{ margin: 0 }}>ATS Intelligence Platform</h1>
          <span style={{
            fontSize: '0.65rem',
            padding: '3px 10px',
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            borderRadius: '20px',
            color: '#fff',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>V2</span>
        </div>
        <p className="page-subtitle" style={{ margin: 0 }}>
          Production-grade deterministic ATS scoring — every score is calculated, not guessed.
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(255,95,160,0.08)',
          border: '1px solid rgba(255,95,160,0.25)',
          borderRadius: 'var(--radius-sm)',
          padding: '1rem',
          marginBottom: '1.5rem',
          color: 'var(--accent-rose)',
          fontSize: '0.88rem',
        }}>{error}</div>
      )}

      {/* ══ Input Phase ══ */}
      {(phase === 'input' || phase === 'scoring') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="responsive-grid">

          {/* Resume Input */}
          <div className="ra-section">
            <div className="ra-section-title">
              <span>📄</span> Resume Text
            </div>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your full resume text here..."
              rows={14}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.82rem',
                lineHeight: 1.6,
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-teal)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
              {resumeText.length} chars — min 50 required
            </div>
          </div>

          {/* Job Description Input */}
          <div className="ra-section">
            <div className="ra-section-title">
              <span>💼</span> Job Description <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 400 }}>(optional)</span>
            </div>
            <input
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="Target role title (e.g. Backend Engineer)"
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.82rem',
                outline: 'none',
                marginBottom: '0.75rem',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-teal)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
            />
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here to get a Job Match Score..."
              rows={12}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.82rem',
                lineHeight: 1.6,
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--accent-teal)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
            />

            {/* Analyze Button */}
            <button
              className="btn-primary"
              onClick={handleAnalyze}
              disabled={phase === 'scoring' || resumeText.trim().length < 50}
              style={{ width: '100%', marginTop: '1rem', fontSize: '0.88rem', fontWeight: 600 }}
            >
              {phase === 'scoring' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <span className="loader-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                  Computing ATS Scores...
                </span>
              ) : (
                <span>⚡ Analyze Resume{jobDescription.length >= 50 ? ' + Job Match' : ''}</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ══ Results Phase ══ */}
      {(phase === 'results' || phase === 'enriching') && universalReport && (
        <div ref={resultsRef}>

          {/* Score Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(99,102,241,0.08))',
            border: '1px solid rgba(14,165,233,0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '2rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '3rem',
            flexWrap: 'wrap',
          }}>
            <div style={{ textAlign: 'center' }}>
              <ScoreGauge score={universalReport.universalScore} label="Universal ATS" size={140} strokeWidth={9} />
              <div style={{ marginTop: '0.5rem' }}>
                <span style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: getGradeColor(universalReport.grade),
                  fontFamily: 'var(--font-display)',
                }}>{universalReport.grade}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '0.5rem' }}>Grade</span>
              </div>
            </div>

            {jobMatchReport && (
              <div style={{ textAlign: 'center' }}>
                <ScoreGauge score={jobMatchReport.jobMatchScore} label="Job Match" size={140} strokeWidth={9} />
                <div style={{ marginTop: '0.5rem' }}>
                  <span style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: getGradeColor(jobMatchReport.grade),
                    fontFamily: 'var(--font-display)',
                  }}>{jobMatchReport.grade}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '0.5rem' }}>Grade</span>
                </div>
              </div>
            )}

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Potential Gain</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-teal)' }}>
                  +{universalReport.estimatedScoreImprovement} pts
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                if top recommendations are applied
              </div>
              {phase === 'enriching' && (
                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--accent-teal)' }}>
                  <div className="loader-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                  AI insights loading...
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            {[
              { id: 'universal' as const, label: '📊 Universal ATS' },
              ...(jobMatchReport ? [{ id: 'jobmatch' as const, label: '🎯 Job Match' }] : []),
              ...(aiExplanation ? [{ id: 'ai' as const, label: '✨ AI Insights' }] : []),
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: activeTab === id ? 'rgba(14,165,233,0.15)' : 'transparent',
                  color: activeTab === id ? 'var(--accent-teal)' : 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === id ? 600 : 400,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  transition: 'all 0.2s',
                  borderBottom: activeTab === id ? '2px solid var(--accent-teal)' : '2px solid transparent',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'universal' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="responsive-grid">

              {/* Category Scores */}
              <div className="ra-section">
                <div className="ra-section-title"><span>📈</span> Category Breakdown</div>
                {universalCategories.map((cat, i) => (
                  <CategoryBarRow key={cat.name} cat={cat} delay={i * 80} />
                ))}
              </div>

              {/* Strengths / Weaknesses */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="ra-section">
                  <div className="ra-section-title"><span>✅</span> Strengths</div>
                  {universalReport.strengths.slice(0, 5).map((s, i) => (
                    <div key={i} style={{ fontSize: '0.82rem', color: 'var(--accent-teal)', marginBottom: '0.4rem', display: 'flex', gap: '0.5rem' }}>
                      <span>•</span><span>{s}</span>
                    </div>
                  ))}
                </div>
                <div className="ra-section">
                  <div className="ra-section-title"><span>⚠️</span> Key Issues</div>
                  {universalReport.weaknesses.slice(0, 5).map((w, i) => (
                    <div key={i} style={{ fontSize: '0.82rem', color: 'var(--accent-rose)', marginBottom: '0.4rem', display: 'flex', gap: '0.5rem' }}>
                      <span>•</span><span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div style={{ gridColumn: '1 / -1' }} className="ra-section">
                <div className="ra-section-title"><span>🚀</span> Priority Improvements</div>
                {universalReport.improvementPriority.map((rec, i) => (
                  <RecommendationCard key={rec.id} rec={rec} idx={i} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'jobmatch' && jobMatchReport && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="responsive-grid">

              {/* Job Match Category Scores */}
              <div className="ra-section">
                <div className="ra-section-title"><span>📊</span> Match Breakdown</div>
                {jobMatchCategories.map((cat, i) => (
                  <CategoryBarRow key={cat.name} cat={cat} delay={i * 80} />
                ))}
              </div>

              {/* Matched / Missing Skills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="ra-section">
                  <div className="ra-section-title"><span>✅</span> Matched Skills ({jobMatchReport.matchedSkills.length})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {jobMatchReport.matchedSkills.slice(0, 15).map((s) => (
                      <span key={s} style={{
                        padding: '3px 10px', borderRadius: '20px',
                        background: 'rgba(52,211,153,0.12)', color: 'var(--accent-teal)',
                        fontSize: '0.75rem', fontWeight: 500,
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
                <div className="ra-section">
                  <div className="ra-section-title"><span>❌</span> Missing Skills ({jobMatchReport.missingSkills.length})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {jobMatchReport.missingSkills.slice(0, 15).map((s) => (
                      <span key={s} style={{
                        padding: '3px 10px', borderRadius: '20px',
                        background: 'rgba(255,95,160,0.12)', color: 'var(--accent-rose)',
                        fontSize: '0.75rem', fontWeight: 500,
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
                {jobMatchReport.transferableSkills.length > 0 && (
                  <div className="ra-section">
                    <div className="ra-section-title"><span>🔄</span> Transferable Skills</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                      {jobMatchReport.transferableSkills.slice(0, 10).map((s) => (
                        <span key={s} style={{
                          padding: '3px 10px', borderRadius: '20px',
                          background: 'rgba(251,191,36,0.12)', color: 'var(--accent-gold)',
                          fontSize: '0.75rem', fontWeight: 500,
                        }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Missing Keywords */}
              {jobMatchReport.missingKeywords.length > 0 && (
                <div className="ra-section" style={{ gridColumn: '1 / -1' }}>
                  <div className="ra-section-title"><span>🔑</span> Missing Keywords (add to resume)</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {jobMatchReport.missingKeywords.map((k) => (
                      <span key={k} style={{
                        padding: '3px 10px', borderRadius: '20px',
                        background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                        fontSize: '0.75rem', fontWeight: 500,
                      }}>{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Priority Improvements */}
              <div className="ra-section" style={{ gridColumn: '1 / -1' }}>
                <div className="ra-section-title"><span>🚀</span> Match Improvement Actions</div>
                {jobMatchReport.priorityImprovements.map((rec, i) => (
                  <RecommendationCard key={rec.id} rec={rec} idx={i} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ai' && aiExplanation && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="responsive-grid">

              {/* Score Explanation */}
              <div className="ra-section">
                <div className="ra-section-title"><span>🧠</span> Score Analysis</div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                  {String(aiExplanation.universalScoreExplanation || '')}
                </p>
                {aiExplanation.jobMatchExplanation && (
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '1rem' }}>
                    {String(aiExplanation.jobMatchExplanation)}
                  </p>
                )}
              </div>

              {/* Improved Summary */}
              <div className="ra-section">
                <div className="ra-section-title"><span>✨</span> Improved Summary</div>
                <blockquote style={{
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderLeft: '3px solid var(--accent-teal)',
                  margin: 0,
                }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>
                    &ldquo;{String(aiExplanation.improvedSummary || '')}&rdquo;
                  </p>
                </blockquote>
                <button
                  onClick={() => navigator.clipboard.writeText(String(aiExplanation.improvedSummary || ''))}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.45rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    transition: 'all 0.2s',
                  }}
                >
                  📋 Copy
                </button>
              </div>

              {/* Rewritten Bullets */}
              {Array.isArray(aiExplanation.rewrittenBullets) && (aiExplanation.rewrittenBullets as unknown[]).length > 0 && (
                <div className="ra-section" style={{ gridColumn: '1 / -1' }}>
                  <div className="ra-section-title"><span>📝</span> Rewritten Bullets</div>
                  {(aiExplanation.rewrittenBullets as { original: string; rewritten: string; improvement: string }[]).map((b, i) => (
                    <div key={i} style={{
                      marginBottom: '1rem',
                      padding: '1rem',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--accent-rose)', marginBottom: '0.4rem' }}>
                        ✗ {b.original}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--accent-teal)', marginBottom: '0.4rem', fontWeight: 500 }}>
                        ✓ {b.rewritten}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                        {b.improvement}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Keyword Suggestions */}
              {Array.isArray(aiExplanation.keywordSuggestions) && (
                <div className="ra-section">
                  <div className="ra-section-title"><span>🔑</span> Keyword Suggestions</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {(aiExplanation.keywordSuggestions as string[]).map((k) => (
                      <span key={k} style={{
                        padding: '3px 10px', borderRadius: '20px',
                        background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                        fontSize: '0.78rem', fontWeight: 500,
                      }}>{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover Letter Snippet */}
              {aiExplanation.coverLetterSnippet && (
                <div className="ra-section">
                  <div className="ra-section-title"><span>📨</span> Cover Letter Opening</div>
                  <blockquote style={{
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: '3px solid #818cf8',
                    margin: 0,
                  }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>
                      &ldquo;{String(aiExplanation.coverLetterSnippet)}&rdquo;
                    </p>
                  </blockquote>
                </div>
              )}
            </div>
          )}

          {/* Reset */}
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-large outline" onClick={handleReset} style={{ fontSize: '0.85rem' }}>
              ← Analyze Another Resume
            </button>
            <a href="/resume-analyzer" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Open Legacy Analyzer →
              </button>
            </a>
          </div>
        </div>
      )}

      {/* Engine Info Footer */}
      <div style={{
        marginTop: '3rem',
        padding: '1rem 1.5rem',
        background: 'rgba(14,165,233,0.05)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(14,165,233,0.1)',
        fontSize: '0.75rem',
        color: 'var(--text-dim)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap',
      }}>
        <span>🔒 Scores are deterministic — same resume always produces the same score</span>
        <span>⚡ Engine 1: Universal ATS (target &lt;500ms)</span>
        <span>🎯 Engine 2: Job Match ATS (target &lt;800ms)</span>
        <span>🧠 AI: Explains scores only — never calculates them</span>
      </div>
    </div>
  );
}

export default function ATSIntelligencePlatformPage() {
  return (
    <ProtectedRoute>
      <ATSIntelligencePlatformContent />
    </ProtectedRoute>
  );
}
