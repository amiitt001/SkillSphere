/**
 * AI Job Intelligence Engine — Page
 * /job-intelligence
 *
 * Left panel:  Input (URL / Paste / PDF)
 * Right panel: Match report + artifacts (shown after analysis)
 * Bottom tab:  Saved Jobs
 */
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks';
import { useSearchParams } from 'next/navigation';
import type { JobDescription, JobMatchReport, JobArtifacts, SavedJob, ApplicationRecommendation } from '@/types/job';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function recommendationConfig(r: ApplicationRecommendation) {
  const map: Record<ApplicationRecommendation, { label: string; emoji: string; color: string; bg: string }> = {
    strong_match: { label: 'Strong Match — Apply Now!', emoji: '🚀', color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
    apply_now:    { label: 'Good Fit — Apply Now',       emoji: '✅', color: '#22d3ee', bg: 'rgba(34,211,238,0.08)' },
    improve_first:{ label: 'Build Skills First',          emoji: '⚡', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    reach:        { label: 'Reach Role — Stretch Goal',   emoji: '🎯', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
  };
  return map[r] ?? map.improve_first;
}

function statusConfig(s: string) {
  const map: Record<string, { label: string; color: string }> = {
    saved:        { label: 'Saved',        color: '#a3a3a3' },
    applied:      { label: 'Applied',      color: '#22d3ee' },
    interviewing: { label: 'Interviewing', color: '#f59e0b' },
    offered:      { label: 'Offered',      color: '#10b981' },
    rejected:     { label: 'Rejected',     color: '#ef4444' },
    archived:     { label: 'Archived',     color: '#525252' },
  };
  return map[s] ?? map.saved;
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, label, size = 80 }: { score: number; label: string; size?: number }) {
  const color = scoreColor(score);
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize={size < 70 ? 11 : 14} fontWeight="700" fontFamily="JetBrains Mono, monospace"
          style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}
        >
          {score}
        </text>
      </svg>
      <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
    </div>
  );
}

// ─── Loading Steps ────────────────────────────────────────────────────────────

const STEPS = [
  'Extracting job description…',
  'Normalizing requirements…',
  'Comparing against your profile…',
  'Calculating match scores…',
  'Generating career artifacts…',
];

function LoadingSteps({ active }: { active: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!active) { setStep(0); return; }
    const t = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 2800);
    return () => clearInterval(t);
  }, [active]);

  if (!active) return null;
  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div className="loading-spinner" style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.06)', borderTop: '3px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Analyzing job…</span>
      </div>
      {STEPS.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, background: i <= step ? '#10b981' : 'rgba(255,255,255,0.06)', border: `2px solid ${i <= step ? '#10b981' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', transition: 'all 0.4s ease' }}>
            {i < step ? '✓' : i === step ? '●' : ''}
          </div>
          <span style={{ fontSize: '0.8rem', color: i <= step ? 'var(--text-primary)' : 'var(--text-dim)', transition: 'color 0.4s ease' }}>{s}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Artifact Block ───────────────────────────────────────────────────────────

function ArtifactBlock({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
      >
        <span>{title}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
      </button>
      {open && <div style={{ padding: '1rem 1.2rem', borderTop: '1px solid var(--border-subtle)' }}>{children}</div>}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{ fontSize: '0.7rem', padding: '4px 10px', border: '1px solid var(--border-subtle)', borderRadius: 6, background: 'none', color: copied ? '#10b981' : 'var(--text-dim)', cursor: 'pointer', marginBottom: 8 }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type InputTab = 'url' | 'text' | 'pdf';
type PageTab = 'analyze' | 'saved';

function JobIntelligenceContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // ── Input State ──────────────────────────────────────────────────────────
  const [inputTab, setInputTab] = useState<InputTab>('text');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Page State ───────────────────────────────────────────────────────────
  const [pageTab, setPageTab] = useState<PageTab>('analyze');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // ── Result State ─────────────────────────────────────────────────────────
  const [jobDesc, setJobDesc] = useState<JobDescription | null>(null);
  const [matchReport, setMatchReport] = useState<JobMatchReport | null>(null);
  const [artifacts, setArtifacts] = useState<JobArtifacts | null>(null);

  // ── Saved Jobs State ─────────────────────────────────────────────────────
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [recalculating, setRecalculating] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  // Load saved jobs when switching to that tab
  useEffect(() => {
    if (pageTab === 'saved') loadSavedJobs();
  }, [pageTab]);

  // ─── File Upload Handler ────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.pdf')) { setError('Only PDF files are supported.'); return; }
    setPdfFile(f);
    setPdfName(f.name);
    setError('');
  };

  // ─── Analyze ────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    setError('');
    setJobDesc(null);
    setMatchReport(null);
    setArtifacts(null);
    setSavedSuccess(false);
    setAnalyzing(true);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      let source: InputTab = inputTab;
      let content = '';

      if (inputTab === 'url') {
        content = urlInput.trim();
        if (!content) throw new Error('Please enter a job URL.');
      } else if (inputTab === 'text') {
        content = textInput.trim();
        if (!content) throw new Error('Please paste a job description.');
      } else {
        // PDF — read as base64
        if (!pdfFile) throw new Error('Please select a PDF file.');
        const arrayBuf = await pdfFile.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuf);
        let binary = '';
        uint8.forEach(b => binary += String.fromCharCode(b));
        content = btoa(binary);
        source = 'pdf';
      }

      const res = await fetch('/api/job-intelligence/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({ source, content }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || `Server error: ${res.status}`);

      setJobDesc(data.jobDescription ?? data.data?.jobDescription);
      setMatchReport(data.matchReport ?? data.data?.matchReport);
      setArtifacts(data.artifacts ?? data.data?.artifacts);

    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // ─── Save Job ────────────────────────────────────────────────────────────
  const handleSaveJob = async () => {
    if (!jobDesc || !matchReport) return;
    setSaving(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/job-intelligence/save', {
        method: 'POST',
        headers,
        body: JSON.stringify({ jobDescription: jobDesc, matchReport, artifacts }),
      });
      if (!res.ok) throw new Error('Failed to save job.');
      setSavedSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Load Saved Jobs ─────────────────────────────────────────────────────
  const loadSavedJobs = async () => {
    setLoadingSaved(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: HeadersInit = idToken ? { Authorization: `Bearer ${idToken}` } : {};
      const res = await fetch('/api/job-intelligence/saved', { headers });
      const data = await res.json();
      setSavedJobs((data.jobs ?? data.data?.jobs ?? []) as SavedJob[]);
    } catch (_) {
    } finally {
      setLoadingSaved(false);
    }
  };

  // ─── Delete Saved Job ────────────────────────────────────────────────────
  const handleDeleteJob = async (jobId: string) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
      await fetch('/api/job-intelligence/save', { method: 'DELETE', headers, body: JSON.stringify({ jobId }) });
      setSavedJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (_) {}
  };

  // ─── Recalculate Score ───────────────────────────────────────────────────
  const handleRecalculate = async (job: SavedJob) => {
    setRecalculating(job.id);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/job-intelligence/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({ source: 'text', content: job.jobDescription.rawText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error('Recalculation failed.');

      const newReport: JobMatchReport = data.matchReport ?? data.data?.matchReport;
      const newArtifacts: JobArtifacts = data.artifacts ?? data.data?.artifacts;

      // Update in Firestore
      await fetch('/api/job-intelligence/save', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ jobId: job.id }),
      });

      setSavedJobs(prev =>
        prev.map(j => j.id === job.id
          ? { ...j, matchReport: newReport, artifacts: newArtifacts, lastRecalculatedAt: new Date().toISOString() }
          : j
        )
      );
    } catch (_) {
    } finally {
      setRecalculating(null);
    }
  };

  // ─── Update Application Status ──────────────────────────────────────────
  const handleStatusChange = async (jobId: string, status: string) => {
    setStatusUpdating(jobId);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
      await fetch('/api/job-intelligence/save', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ jobId, applicationStatus: status }),
      });
      setSavedJobs(prev => prev.map(j => j.id === jobId ? { ...j, applicationStatus: status as any } : j));
    } catch (_) {
    } finally {
      setStatusUpdating(null);
    }
  };

  // ─── Input Panel ─────────────────────────────────────────────────────────
  const inputPanel = (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Input mode tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 4 }}>
        {([['text', '📋 Paste'], ['url', '🔗 URL'], ['pdf', '📄 PDF']] as [InputTab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setInputTab(tab)}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
              background: inputTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: inputTab === tab ? 'var(--text-primary)' : 'var(--text-dim)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* URL input */}
      {inputTab === 'url' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Job Posting URL</label>
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="https://company.com/careers/..."
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none', width: '100%' }}
          />
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            💡 If the site blocks access, switch to Paste mode and copy the job text.
          </p>
        </div>
      )}

      {/* Paste textarea */}
      {inputTab === 'text' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Job Description</label>
          <textarea
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="Paste the full job description here…"
            rows={12}
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none', width: '100%', resize: 'vertical', lineHeight: 1.6, fontFamily: 'inherit' }}
          />
        </div>
      )}

      {/* PDF upload */}
      {inputTab === 'pdf' && (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{ border: '2px dashed var(--border-subtle)', borderRadius: 10, padding: '2rem', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
          onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
          onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
        >
          <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📄</div>
          {pdfName ? (
            <p style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>✓ {pdfName}</p>
          ) : (
            <>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Drop PDF or click to browse</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Text-layer PDFs only</p>
            </>
          )}
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', color: '#fca5a5', fontSize: '0.8rem' }}>
          {error}
        </div>
      )}

      <button
        onClick={handleAnalyze}
        disabled={analyzing}
        className="btn-primary"
        style={{ width: '100%', padding: '12px 20px', fontSize: '0.9rem', fontWeight: 700, opacity: analyzing ? 0.7 : 1 }}
      >
        {analyzing ? 'Analyzing…' : '⚡ Analyze Job'}
      </button>

      {!analyzing && !matchReport && (
        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>What you get:</p>
          {['Overall Match Score + ATS Score', 'Skill, Experience & Project Match', 'Missing skills with learning time', 'Resume improvements (job-specific)', 'Cover letter & LinkedIn message', 'Interview & learning roadmap'].map(item => (
            <div key={item} style={{ fontSize: '0.75rem', color: 'var(--text-dim)', padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#10b981', fontSize: '0.7rem' }}>✓</span> {item}
            </div>
          ))}
          <p style={{ marginTop: 10, fontSize: '0.7rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
            🔒 Uses your existing profile — no resume re-upload needed.
          </p>
        </div>
      )}

      <LoadingSteps active={analyzing} />
    </div>
  );

  // ─── Results Panel ────────────────────────────────────────────────────────
  const resultsPanel = matchReport && jobDesc ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>
              {jobDesc.company} · {jobDesc.location}
            </span>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 4px' }}>{jobDesc.title}</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[jobDesc.jobType, jobDesc.experienceLevel, jobDesc.domain].filter(Boolean).map(tag => (
                <span key={tag} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' }}>{tag}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {savedSuccess ? (
              <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>✓ Saved to Workspace</span>
            ) : (
              <button
                onClick={handleSaveJob}
                disabled={saving}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'none', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
              >
                {saving ? 'Saving…' : '🔖 Save Job'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recommendation banner */}
      {(() => {
        const cfg = recommendationConfig(matchReport.recommendation);
        return (
          <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}33`, borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.5rem' }}>{cfg.emoji}</span>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: cfg.color, margin: 0 }}>{cfg.label}</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '3px 0 0' }}>{matchReport.recommendationReason}</p>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: cfg.color, margin: 0 }}>{matchReport.readinessScore}%</p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', margin: 0 }}>{matchReport.readinessEstimate}</p>
            </div>
          </div>
        );
      })()}

      {/* Score rings */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '1.25rem' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem' }}>Match Scores</p>
        <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
          <ScoreRing score={matchReport.scores.overall}    label="Overall"    size={90} />
          <ScoreRing score={matchReport.scores.ats}        label="ATS"        size={90} />
          <ScoreRing score={matchReport.scores.skills}     label="Skills"     size={90} />
          <ScoreRing score={matchReport.scores.experience} label="Experience" size={90} />
          <ScoreRing score={matchReport.scores.projects}   label="Projects"   size={90} />
        </div>
      </div>

      {/* Skills analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '1rem' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: 8 }}>✓ Matched Skills</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {matchReport.matchedSkills.length > 0 ? matchReport.matchedSkills.map(s => (
              <span key={s} style={{ fontSize: '0.72rem', background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7', padding: '3px 8px', borderRadius: 20 }}>{s}</span>
            )) : <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>None identified</p>}
          </div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: '1rem' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: 8 }}>⚠ Missing Skills</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {matchReport.missingSkills.length > 0 ? matchReport.missingSkills.slice(0, 6).map(m => (
              <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{m.name}</span>
                <span style={{ fontSize: '0.65rem', color: m.priority === 'critical' ? '#ef4444' : m.priority === 'high' ? '#f97316' : '#f59e0b', fontWeight: 700, textTransform: 'uppercase' }}>{m.priority}</span>
              </div>
            )) : <p style={{ fontSize: '0.75rem', color: '#10b981' }}>You match all requirements! 🎉</p>}
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 12, padding: '1rem 1.25rem' }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: 6 }}>✨ AI Insight</p>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{matchReport.aiInsight}</p>
      </div>

      {/* Artifacts */}
      {artifacts && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Career Artifacts</p>

          <ArtifactBlock title="📄 Resume Improvements">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(artifacts.resumeImprovements || []).map((imp, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>{imp.section}</span>
                    <span style={{ fontSize: '0.65rem', color: imp.impact === 'high' ? '#10b981' : imp.impact === 'medium' ? '#f59e0b' : '#737373', fontWeight: 700, textTransform: 'uppercase' }}>{imp.impact}</span>
                  </div>
                  {imp.original && <p style={{ fontSize: '0.72rem', color: '#ef4444', marginBottom: 3, textDecoration: 'line-through' }}>{imp.original}</p>}
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{imp.suggestion}</p>
                </div>
              ))}
            </div>
          </ArtifactBlock>

          <ArtifactBlock title="✉️ Cover Letter">
            <CopyButton text={artifacts.coverLetter || ''} />
            <pre style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
              {artifacts.coverLetter}
            </pre>
          </ArtifactBlock>

          <ArtifactBlock title="💼 LinkedIn Message">
            <CopyButton text={artifacts.linkedInMessage || ''} />
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{artifacts.linkedInMessage}</p>
          </ArtifactBlock>

          <ArtifactBlock title="🎤 Interview Roadmap">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(artifacts.interviewRoadmap || []).map((item, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.topic}</span>
                    <span style={{ fontSize: '0.62rem', color: item.priority === 'must-know' ? '#ef4444' : item.priority === 'important' ? '#f59e0b' : '#737373', fontWeight: 700, textTransform: 'uppercase' }}>{item.priority}</span>
                  </div>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-dim)', marginBottom: 4 }}>Type: {item.type}</p>
                  <p style={{ fontSize: '0.75rem', color: '#a78bfa', fontStyle: 'italic', marginBottom: 4 }}>"{item.sampleQuestion}"</p>
                  {(item.resources || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {item.resources.map((r, ri) => (
                        <span key={ri} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-dim)', padding: '2px 7px', borderRadius: 10 }}>{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ArtifactBlock>

          <ArtifactBlock title="📚 Learning Roadmap">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(artifacts.learningRoadmap || []).length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#10b981' }}>You already have all the required skills! 🎉</p>
              ) : (artifacts.learningRoadmap || []).map((item, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.skill}</span>
                    <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 600 }}>⏱ {item.duration}</span>
                  </div>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginBottom: 4 }}>🏆 Milestone: {item.milestone}</p>
                  {(item.resources || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {item.resources.map((r, ri) => (
                        <span key={ri} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-dim)', padding: '2px 7px', borderRadius: 10 }}>{r}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ArtifactBlock>
        </div>
      )}
    </div>
  ) : null;

  // ─── Saved Jobs Panel ─────────────────────────────────────────────────────
  const savedJobsPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Tracked Jobs</h2>
        <button onClick={loadSavedJobs} style={{ fontSize: '0.75rem', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}>↻ Refresh</button>
      </div>

      {loadingSaved ? (
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Loading saved jobs…</p>
      ) : savedJobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>No tracked jobs yet</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>Analyze a job and click "Save Job" to track it here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {savedJobs.map((job) => {
            const cfg = recommendationConfig(job.matchReport?.recommendation || 'improve_first');
            const sc = statusConfig(job.applicationStatus || 'saved');
            return (
              <div key={job.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: 2 }}>{job.jobDescription?.company || '—'}</p>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{job.jobDescription?.title || 'Unknown Role'}</h3>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: scoreColor(job.matchReport?.scores?.overall || 0) }}>
                        {job.matchReport?.scores?.overall || 0}%
                      </span>
                      <span style={{ fontSize: '0.65rem', color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
                    </div>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: 6 }}>
                      Saved {new Date(job.savedAt).toLocaleDateString()} · Recalculated {new Date(job.lastRecalculatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                    <select
                      value={job.applicationStatus || 'saved'}
                      onChange={e => handleStatusChange(job.id, e.target.value)}
                      disabled={statusUpdating === job.id}
                      style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', borderRadius: 6, color: sc.color, padding: '4px 8px', cursor: 'pointer' }}
                    >
                      {['saved','applied','interviewing','offered','rejected','archived'].map(s => (
                        <option key={s} value={s} style={{ background: '#121212' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleRecalculate(job)}
                        disabled={recalculating === job.id}
                        style={{ fontSize: '0.7rem', padding: '5px 10px', border: '1px solid var(--border-subtle)', borderRadius: 6, background: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                      >
                        {recalculating === job.id ? '⟳' : '↻ Recalculate'}
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        style={{ fontSize: '0.7rem', padding: '5px 10px', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, background: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ─── Page Layout ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-[1400px] mx-auto py-6 px-4">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            ⚡ Job Intelligence Engine
          </h1>
          <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', padding: '3px 10px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase' }}>
            AI-Powered
          </span>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Analyze any job posting against your profile. Get match scores, gap analysis, and ready-to-use career artifacts — no resume re-upload required.
        </p>
      </div>

      {/* Page tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 0 }}>
        {([['analyze', '🔍 Analyze Job'], ['saved', '🔖 Tracked Jobs']] as [PageTab, string][]).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setPageTab(tab)}
            style={{
              padding: '10px 18px', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, borderBottom: pageTab === tab ? '2px solid #10b981' : '2px solid transparent', background: 'none', color: pageTab === tab ? '#10b981' : 'var(--text-dim)', transition: 'all 0.2s'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {pageTab === 'analyze' ? (
        <div style={{ display: 'grid', gridTemplateColumns: matchReport ? '1fr 1.5fr' : '420px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Left: input */}
          <div>{inputPanel}</div>

          {/* Right: results or placeholder */}
          <div>
            {analyzing ? (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Analysis in progress…</p>
              </div>
            ) : matchReport ? resultsPanel : (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-subtle)', borderRadius: 16, padding: '4rem 2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚡</div>
                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Paste a job, add a URL, or upload a PDF</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 6 }}>Your AI match report will appear here.</p>
              </div>
            )}
          </div>
        </div>
      ) : savedJobsPanel}
    </div>
  );
}

export default function JobIntelligencePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div style={{ padding: '2rem', color: 'var(--text-dim)' }}>Loading…</div>}>
        <JobIntelligenceContent />
      </Suspense>
    </ProtectedRoute>
  );
}
