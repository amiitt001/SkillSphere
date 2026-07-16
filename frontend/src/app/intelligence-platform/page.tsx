'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { auth } from '@/lib/firebase';
import type { 
  AiFeedback, 
  FeatureFlag, 
  AbExperiment, 
  ApiQualityLog 
} from '@/services/intelligencePlatform/types';

export default function GrowthPlatformPage() {
  return (
    <ProtectedRoute>
      <GrowthPlatformContent />
    </ProtectedRoute>
  );
}

function GrowthPlatformContent() {
  // Config states
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [experiments, setExperiments] = useState<AbExperiment[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Analytics states
  const [performance, setPerformance] = useState<any | null>(null);
  const [effectiveness, setEffectiveness] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<AiFeedback[]>([]);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Local state to simulate rating submissions
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [newFeedbackRating, setNewFeedbackRating] = useState<'helpful' | 'not-helpful'>('helpful');
  const [newFeedbackType, setNewFeedbackType] = useState<'job' | 'course' | 'project' | 'copilot'>('copilot');
  const [newFeedbackComment, setNewFeedbackComment] = useState('Excellent context mapping guidance.');

  // Toggling configs flags
  const [savingFlagId, setSavingFlagId] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'monitoring' | 'testing' | 'feedback'>('monitoring');

  useEffect(() => {
    loadConfig();
    loadAnalytics();
  }, []);

  const loadConfig = async () => {
    setLoadingConfig(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: HeadersInit = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};

      const [flagsRes, expRes] = await Promise.all([
        fetch('/api/intelligence-platform/flags', { headers }),
        fetch('/api/intelligence-platform/experiments', { headers })
      ]);

      if (flagsRes.ok) {
        const d = await flagsRes.json();
        if (d.success) setFlags(d.flags);
      }
      if (expRes.ok) {
        const d = await expRes.json();
        if (d.success) setExperiments(d.experiments);
      }
    } catch (err) {
      console.error('Error loading config states:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: HeadersInit = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};

      const res = await fetch('/api/intelligence-platform/analytics', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setPerformance(d.performance);
          setEffectiveness(d.effectiveness);
          setFeedbacks(d.feedback);
          setTelemetry(d.telemetry);
        }
      }
    } catch (err) {
      console.error('Error loading analytics aggregates:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleToggleFlag = async (flag: FeatureFlag) => {
    setSavingFlagId(flag.id);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const updatedFlag = { ...flag, enabled: !flag.enabled };
      const res = await fetch('/api/intelligence-platform/flags', {
        method: 'POST',
        headers,
        body: JSON.stringify(updatedFlag)
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setFlags((prev) => prev.map((f) => f.id === flag.id ? d.flag : f));
        }
      }
    } catch (err) {
      console.error('Error toggling flag:', err);
    } finally {
      setSavingFlagId(null);
    }
  };

  const handleFlagRolloutChange = async (flag: FeatureFlag, percent: number) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const updatedFlag = { ...flag, rolloutPercentage: percent };
      const res = await fetch('/api/intelligence-platform/flags', {
        method: 'POST',
        headers,
        body: JSON.stringify(updatedFlag)
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setFlags((prev) => prev.map((f) => f.id === flag.id ? d.flag : f));
        }
      }
    } catch (err) {
      console.error('Error changing rollout percentage:', err);
    }
  };

  const handleSimulateConversion = async (expId: string) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/intelligence-platform/experiments', {
        method: 'POST',
        headers,
        body: JSON.stringify({ experimentId: expId })
      });

      if (res.ok) {
        // Reload configs to get incremented conversions count
        loadConfig();
      }
    } catch (err) {
      console.error('Error logging mock conversion:', err);
    }
  };

  const handleAddSimulatedFeedback = async () => {
    setSubmittingFeedback(true);
    const feedbackId = `feed_${Math.random().toString(36).substring(7)}`;
    const newFeedback: AiFeedback = {
      id: feedbackId,
      itemId: `item_${Math.random().toString(36).substring(5)}`,
      itemType: newFeedbackType,
      rating: newFeedbackRating,
      reason: newFeedbackRating === 'helpful' ? 'good' : 'needs-detail',
      comments: newFeedbackComment,
      timestamp: new Date().toISOString()
    };

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/intelligence-platform/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify(newFeedback)
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setFeedbacks((prev) => [d.feedback, ...prev]);
          setNewFeedbackComment('');
        }
      }
    } catch (err) {
      console.error('Error adding mock feedback:', err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: '3rem' }}>
      
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div className="section-eyebrow" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-clay)' }}>Admin Growth & AI Analytics</div>
        <h1 className="page-title" style={{ fontSize: '2.25rem', color: 'var(--text-primary)', margin: '0.5rem 0' }}>AI Quality & Growth Portal</h1>
        <p className="page-subtitle" style={{ color: 'var(--text-muted)' }}>
          Monitor LLM providers costs, average request latencies, availability rate aggregates, A/B experiments buckets, and feature rollouts.
        </p>
      </div>

      {/* Tabs */}
      <div className="difficulty-selector" style={{ marginBottom: '2rem', background: 'rgba(25, 23, 21, 0.65)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '0.25rem' }}>
        <button className={`difficulty-option ${activeTab === 'monitoring' ? 'active' : ''}`} onClick={() => setActiveTab('monitoring')} style={{ flex: 1 }}>📊 AI Cost & Latency metrics</button>
        <button className={`difficulty-option ${activeTab === 'testing' ? 'active' : ''}`} onClick={() => setActiveTab('testing')} style={{ flex: 1 }}>🔬 A/B Experiments & Flags</button>
        <button className={`difficulty-option ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')} style={{ flex: 1 }}>💬 Thumbs Feedback loop</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Main Admin Panels */}
        <div>

          {/* TAB 1: AI COST & LATENCY METRICS */}
          {activeTab === 'monitoring' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Performance Cards grid */}
              {performance && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
                  <div className="quiz-card" style={{ textAlign: 'center', background: 'rgba(25, 23, 21, 0.45)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg AI Latency</span>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-clay)', marginTop: '0.5rem' }}>{performance.avgLatencyMs} ms</h3>
                  </div>
                  <div className="quiz-card" style={{ textAlign: 'center', background: 'rgba(25, 23, 21, 0.45)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Token Cost (USD)</span>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '0.5rem' }}>${performance.totalCostUsd}</h3>
                  </div>
                  <div className="quiz-card" style={{ textAlign: 'center', background: 'rgba(25, 23, 21, 0.45)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Availability Rate</span>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', marginTop: '0.5rem' }}>{performance.availabilityPct}%</h3>
                  </div>
                  <div className="quiz-card" style={{ textAlign: 'center', background: 'rgba(25, 23, 21, 0.45)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Failures/Fallbacks</span>
                    <h3 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: '0.5rem' }}>{performance.fallbackCount}</h3>
                  </div>
                </div>
              )}

              {/* Recommendation Effectiveness table */}
              <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, borderBottom: '1px solid rgba(212, 163, 115, 0.1)', paddingBottom: '0.5rem', marginBottom: '1.25rem', color: 'var(--accent-clay)' }}>Recommendation Clickthrough Rates</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {effectiveness.map((rec) => (
                    <div key={rec.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '0.75rem 1rem', borderRadius: '4px' }}>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{rec.title}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Category: {rec.category} • Impressions: {rec.impressionsCount} • Clicks: {rec.clicksCount}</div>
                      </div>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: rec.acceptanceRate >= 60 ? '#10b981' : 'var(--text-muted)' }}>{rec.acceptanceRate}% CTR</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: A/B TESTING & FLAGS */}
          {activeTab === 'testing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Feature flags CRUD block */}
              <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Dynamic Feature Flags</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Toggle beta capabilities or set progressive rollout ratios across user segments.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {flags.map((flag) => (
                    <div key={flag.id} style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '4px', borderLeft: flag.enabled ? '3px solid var(--accent-clay)' : '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div>
                          <strong style={{ fontSize: '0.95rem', color: flag.enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>{flag.name}</strong>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Key: {flag.id}</div>
                        </div>
                        <button 
                          onClick={() => handleToggleFlag(flag)} 
                          disabled={savingFlagId === flag.id}
                          className={`difficulty-option ${flag.enabled ? 'active' : ''}`}
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                        >
                          {flag.enabled ? 'Active' : 'Paused'}
                        </button>
                      </div>

                      {/* Rollout slider ratio */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem' }}>
                        <span>Rollout ratio:</span>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={flag.rolloutPercentage}
                          onChange={(e) => handleFlagRolloutChange(flag, parseInt(e.target.value))}
                          style={{ flex: 1, accentColor: 'var(--accent-clay)' }}
                        />
                        <span style={{ minWidth: '40px', textAlign: 'right', fontWeight: 700 }}>{flag.rolloutPercentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experiments list */}
              <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>A/B Testing Simulator</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Monitor metric goals, participants reach, and simulated conversion increments.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {experiments.map((exp) => {
                    const convRate = exp.participantsCount > 0 ? ((exp.conversionsCount / exp.participantsCount) * 100).toFixed(1) : '0';
                    return (
                      <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                        <div>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{exp.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Goal: {exp.metricGoal} • Participants: {exp.participantsCount} • Conversions: {exp.conversionsCount}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>{convRate}% Conv</span>
                          <button 
                            onClick={() => handleSimulateConversion(exp.id)}
                            style={{ background: 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            Simulate Conv
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: THUMBS FEEDBACK LOOP */}
          {activeTab === 'feedback' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Feedback list */}
              <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>User AI Feedback Feed</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Inspect ratings logged by students on copilot briefs and recommendation metrics.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {feedbacks.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No feedback ratings logged yet.</p>
                  ) : (
                    feedbacks.map((f) => (
                      <div key={f.id} style={{ background: 'rgba(0,0,0,0.15)', padding: '0.75rem 1rem', borderRadius: '4px', borderLeft: f.rating === 'helpful' ? '3px solid #10b981' : '3px solid #ef4444' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                          <strong style={{ color: f.rating === 'helpful' ? '#10b981' : '#f87171' }}>{f.rating === 'helpful' ? '👍 Helpful' : '👎 Not Helpful'}</strong>
                          <span style={{ color: 'var(--text-muted)' }}>Type: {f.itemType} • {new Date(f.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{f.comments || 'No comment provided.'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add mock feedback rating */}
              <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>Simulate AI Feedback Rating</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rating Choice</label>
                    <select 
                      value={newFeedbackRating} 
                      onChange={(e) => setNewFeedbackRating(e.target.value as any)}
                      style={{ width: '100%', padding: '0.35rem', marginTop: '0.15rem', background: 'rgba(25,23,21,0.95)', color: 'var(--text-primary)' }}
                    >
                      <option value="helpful">👍 Helpful</option>
                      <option value="not-helpful">👎 Not Helpful</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Module Item</label>
                    <select 
                      value={newFeedbackType} 
                      onChange={(e) => setNewFeedbackType(e.target.value as any)}
                      style={{ width: '100%', padding: '0.35rem', marginTop: '0.15rem', background: 'rgba(25,23,21,0.95)', color: 'var(--text-primary)' }}
                    >
                      <option value="copilot">AI Career Copilot</option>
                      <option value="advisor">Advisor recommendations</option>
                      <option value="job">Jobs listing</option>
                      <option value="course">Learning resource</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rating Comment details</label>
                    <input 
                      type="text" 
                      placeholder="Comment details..." 
                      value={newFeedbackComment} 
                      onChange={(e) => setNewFeedbackComment(e.target.value)}
                      style={{ width: '100%', padding: '0.35rem', marginTop: '0.15rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={handleAddSimulatedFeedback} 
                    disabled={submittingFeedback || !newFeedbackComment.trim()}
                    style={{ background: 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', padding: '0.4rem 1.5rem', fontWeight: 600 }}
                  >
                    {submittingFeedback ? 'Logging...' : 'Submit Rating'}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Column: User Telemetry Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Real-time telemetry feed */}
          <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.45)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>Real-time user Telemetry</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '340px', overflowY: 'auto' }}>
              {telemetry.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No telemetry logs recorded.</p>
              ) : (
                telemetry.slice(0, 10).map((log) => (
                  <div key={log.id} style={{ fontSize: '0.7rem', padding: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    ⚡ <strong>{log.action}</strong>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
