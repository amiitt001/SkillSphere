'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { auth } from '@/lib/firebase';
import type { 
  EcosystemEvent, 
  EcosystemEventType, 
  WorkflowRule, 
  CareerHealthScore, 
  CareerOutcomePrediction, 
  CareerReport 
} from '@/services/intelligence/types';

export default function IntelligencePage() {
  return (
    <ProtectedRoute>
      <AutonomousIntelligenceContent />
    </ProtectedRoute>
  );
}

function AutonomousIntelligenceContent() {
  // Stats & Predictions
  const [health, setHealth] = useState<CareerHealthScore | null>(null);
  const [predictions, setPredictions] = useState<CareerOutcomePrediction | null>(null);
  const [coachBrief, setCoachBrief] = useState<any | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Events simulator
  const [events, setEvents] = useState<EcosystemEvent[]>([]);
  const [simulatingEvent, setSimulatingEvent] = useState(false);
  const [simEventType, setSimEventType] = useState<EcosystemEventType>('leetcode_solved');
  const [simEventDesc, setSimEventDesc] = useState('Completed LeetCode medium hash map arrays challenge.');

  // Custom Workflows
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleTrigger, setNewRuleTrigger] = useState<EcosystemEventType>('leetcode_solved');
  const [newRuleAction, setNewRuleAction] = useState<'generate_recovery' | 'suggest_project' | 'recommend_learning' | 'alert_user'>('alert_user');
  const [newRulePayload, setNewRulePayload] = useState('Triggered smart alert notification.');
  const [savingRule, setSavingRule] = useState(false);

  // Reports
  const [report, setReport] = useState<CareerReport | null>(null);
  const [compilingReport, setCompilingReport] = useState(false);
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    loadAutonomousData();
    loadWorkflows();
    loadEventLogs();
  }, []);

  const loadAutonomousData = async () => {
    setLoadingStats(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: HeadersInit = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};

      const [healthRes, predRes, coachRes] = await Promise.all([
        fetch('/api/intelligence/health', { headers }),
        fetch('/api/intelligence/predictions', { headers }),
        fetch('/api/intelligence/coach', { headers })
      ]);

      if (healthRes.ok) {
        const d = await healthRes.json();
        if (d.success) setHealth(d.health);
      }
      if (predRes.ok) {
        const d = await predRes.json();
        if (d.success) setPredictions(d.predictions);
      }
      if (coachRes.ok) {
        const d = await coachRes.json();
        if (d.success) setCoachBrief(d.brief);
      }
    } catch (err) {
      console.error('Error loading AI stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadWorkflows = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: HeadersInit = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};
      const res = await fetch('/api/intelligence/workflows', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setWorkflows(d.workflows);
      }
    } catch (err) {
      console.error('Error loading workflows:', err);
    }
  };

  const loadEventLogs = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: HeadersInit = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};
      const res = await fetch('/api/intelligence/events', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setEvents(d.events);
      }
    } catch (err) {
      console.error('Error loading events list:', err);
    }
  };

  const handleSimulateEvent = async () => {
    setSimulatingEvent(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/intelligence/events', {
        method: 'POST',
        headers,
        body: JSON.stringify({ type: simEventType, description: simEventDesc })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setEvents((prev) => [d.event, ...prev]);
          // Refresh health score & outcomes predictions
          loadAutonomousData();
        }
      }
    } catch (err) {
      console.error('Error simulating event:', err);
    } finally {
      setSimulatingEvent(false);
    }
  };

  const handleToggleWorkflow = async (rule: WorkflowRule) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const updatedRule = { ...rule, enabled: !rule.enabled };
      const res = await fetch('/api/intelligence/workflows', {
        method: 'POST',
        headers,
        body: JSON.stringify(updatedRule)
      });

      if (res.ok) {
        setWorkflows((prev) => prev.map((w) => w.id === rule.id ? updatedRule : w));
      }
    } catch (err) {
      console.error('Error toggling rule:', err);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!newRuleName.trim()) return;
    setSavingRule(true);
    const ruleId = `wf_${Math.random().toString(36).substring(7)}`;
    const newRule: WorkflowRule = {
      id: ruleId,
      name: newRuleName,
      triggerEvent: newRuleTrigger,
      actionType: newRuleAction,
      actionPayload: newRulePayload,
      enabled: true
    };

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/intelligence/workflows', {
        method: 'POST',
        headers,
        body: JSON.stringify(newRule)
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setWorkflows((prev) => [...prev, d.rule]);
          setNewRuleName('');
          setNewRulePayload('');
        }
      }
    } catch (err) {
      console.error('Error saving new rule:', err);
    } finally {
      setSavingRule(false);
    }
  };

  const handleCompileReport = async () => {
    setCompilingReport(true);
    setReport(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: HeadersInit = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};

      const res = await fetch(`/api/intelligence/reports?type=${reportType}`, { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setReport(d.report);
      }
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setCompilingReport(false);
    }
  };

  // Helper description mapping for dropdown options
  useEffect(() => {
    if (simEventType === 'leetcode_solved') setSimEventDesc('Completed LeetCode medium hash map arrays challenge.');
    else if (simEventType === 'github_push') setSimEventDesc('Pushed 3 commits updating Redis caching setup controller.');
    else if (simEventType === 'resume_modified') setSimEventDesc('Updated experience section describing AWS multi-stage build pipelines.');
    else if (simEventType === 'interview_completed') setSimEventDesc('Completed mock interview drill for graph search algorithms.');
    else if (simEventType === 'quiz_completed') setSimEventDesc('Finished arrays quiz with a strong score of 90/100.');
    else if (simEventType === 'course_finished') setSimEventDesc('Passed final exam for Next.js Advanced rendering schemas.');
    else if (simEventType === 'score_drop') setSimEventDesc('Readiness index score decreased below threshold.');
  }, [simEventType]);

  return (
    <div className="page-container" style={{ paddingBottom: '3rem' }}>
      
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div className="section-eyebrow" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-clay)' }}>Continuous Background Tracking</div>
        <h1 className="page-title" style={{ fontSize: '2.25rem', color: 'var(--text-primary)', margin: '0.5rem 0' }}>AI Career GPS</h1>
        <p className="page-subtitle" style={{ color: 'var(--text-muted)' }}>
          Autonomous career engine that monitors profile updates, calculates health scores, triggers automated workflow rules, and predicts placement probabilities.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Section 1: AI Coach Daily Briefing */}
          {coachBrief && (
            <div className="quiz-card animate-fade-up" style={{ background: 'rgba(25, 23, 21, 0.45)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(212, 163, 115, 0.1)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-clay)' }}>AI Coach Daily brief</h3>
                <span style={{ fontSize: '0.85rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>{coachBrief.expectedScoreImprovement} Expected</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <strong>Today's priorities:</strong>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {coachBrief.todayPriorities.map((p: string, i: number) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
                <div>
                  <strong>Recommended DSA Challenge:</strong>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>{coachBrief.recommendedCodingProblem}</p>
                </div>
                <div>
                  <strong>Recommended Project task:</strong>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>{coachBrief.recommendedProjectTask}</p>
                </div>
                <div>
                  <strong>Recommended Learning target:</strong>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>{coachBrief.recommendedLearningModule}</p>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                ⭐ <strong>Career health assessment summary:</strong> {coachBrief.careerHealthSummary}
              </div>
            </div>
          )}

          {/* Section 2: Custom Workflow automation rules builder */}
          <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Workflow Automation Builder</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Configure background automation rules. The system evaluates rules when matching events occur.</p>

            {/* List user workflows rules */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {workflows.map((rule) => (
                <div key={rule.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '0.75rem 1rem', borderRadius: '4px', borderLeft: rule.enabled ? '3px solid var(--accent-clay)' : '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: rule.enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>{rule.name}</strong>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Trigger: {rule.triggerEvent} • Action: {rule.actionType}</div>
                  </div>
                  <div>
                    <button 
                      onClick={() => handleToggleWorkflow(rule)} 
                      className={`difficulty-option ${rule.enabled ? 'active' : ''}`}
                      style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}
                    >
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new workflow rule form */}
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(212,163,115,0.1)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Create Custom Automation Rule</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rule Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. If DSA Quiz completed..." 
                    value={newRuleName} 
                    onChange={(e) => setNewRuleName(e.target.value)}
                    style={{ width: '100%', padding: '0.35rem', marginTop: '0.15rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>When Event Occurs</label>
                  <select 
                    value={newRuleTrigger} 
                    onChange={(e) => setNewRuleTrigger(e.target.value as any)}
                    style={{ width: '100%', padding: '0.35rem', marginTop: '0.15rem', background: 'rgba(25,23,21,0.95)', color: 'var(--text-primary)' }}
                  >
                    <option value="leetcode_solved">LeetCode Solved</option>
                    <option value="github_push">GitHub Commit</option>
                    <option value="resume_modified">Resume Edited</option>
                    <option value="quiz_completed">Quiz Completed</option>
                    <option value="course_finished">Course Finished</option>
                    <option value="score_drop">Score Drop</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Take Action</label>
                  <select 
                    value={newRuleAction} 
                    onChange={(e) => setNewRuleAction(e.target.value as any)}
                    style={{ width: '100%', padding: '0.35rem', marginTop: '0.15rem', background: 'rgba(25,23,21,0.95)', color: 'var(--text-primary)' }}
                  >
                    <option value="alert_user">Smart Notification</option>
                    <option value="generate_recovery">Recovery Checklist</option>
                    <option value="suggest_project">Suggest Project</option>
                    <option value="recommend_learning">Recommend Course</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  onClick={handleCreateWorkflow} 
                  disabled={savingRule || !newRuleName.trim()}
                  style={{ background: 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', padding: '0.4rem 1.25rem', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  {savingRule ? 'Saving...' : 'Add Rule'}
                </button>
              </div>
            </div>

          </div>

          {/* Section 3: Reports Compiler */}
          <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Weekly & Monthly Reports Compiler</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Generate structured AI Progress Reports analyzing goals, skills gained, and next priority steps.</p>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input type="radio" checked={reportType === 'weekly'} onChange={() => setReportType('weekly')} />
                <span>Weekly Assessment</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <input type="radio" checked={reportType === 'monthly'} onChange={() => setReportType('monthly')} />
                <span>Monthly Assessment</span>
              </label>
              <button 
                onClick={handleCompileReport} 
                disabled={compilingReport}
                style={{ marginLeft: 'auto', background: 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', padding: '0.5rem 1.5rem', fontWeight: 600 }}
              >
                {compilingReport ? 'Compiling Report...' : 'Compile Report'}
              </button>
            </div>

            {/* Compiled report details */}
            {report && (
              <div className="quiz-card animate-fade-up" style={{ borderLeft: '4px solid var(--accent-clay)', background: 'rgba(0,0,0,0.1)' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>Compiled progress report</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                  <div>
                    <strong>Report Summary:</strong>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{report.progressSummary}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <strong>Skills developed:</strong>
                      <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {report.skillGrowth.map((s, idx) => <li key={idx}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <strong>Completed milestones:</strong>
                      <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {report.goalsAchieved.map((s, idx) => <li key={idx}>{s}</li>)}
                      </ul>
                    </div>
                  </div>
                  <div>
                    <strong>Recommended Actions:</strong>
                    <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {report.nextActions.map((s, idx) => <li key={idx}>{s}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Outcomes, Health & Simulation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Career Health Score factors */}
          {health && (
            <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.45)', padding: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Career Health score</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.5rem 0 1rem 0' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-clay)' }}>{health.overall}/100</span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(212,163,115,0.1)', color: 'var(--accent-clay)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>Level: Ready</span>
              </div>

              {/* Factors meters */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                    <span>Consistency</span>
                    <span>{health.factors.consistency}%</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                    <div style={{ width: `${health.factors.consistency}%`, height: '100%', background: 'var(--accent-clay)', borderRadius: '2px' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                    <span>Coding & DSA</span>
                    <span>{health.factors.coding}%</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                    <div style={{ width: `${health.factors.coding}%`, height: '100%', background: 'var(--accent-clay)', borderRadius: '2px' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                    <span>GitHub Projects</span>
                    <span>{health.factors.projects}%</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                    <div style={{ width: `${health.factors.projects}%`, height: '100%', background: 'var(--accent-clay)', borderRadius: '2px' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                    <span>Learning & Certs</span>
                    <span>{health.factors.learning}%</span>
                  </div>
                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                    <div style={{ width: `${health.factors.learning}%`, height: '100%', background: 'var(--accent-clay)', borderRadius: '2px' }} />
                  </div>
                </div>
              </div>

              {/* Trend log coordinates */}
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.75rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Historical Trend logs:</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {health.trendHistory.map((h, i) => (
                    <div key={i}>{h.date}: <strong>{h.score}%</strong></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Outcome Predictions timeline */}
          {predictions && (
            <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.45)', padding: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>Predictions (GPS Timeline)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Placement Probability:</span>
                    <strong style={{ color: '#10b981' }}>{predictions.placementProbability}%</strong>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Interview Success:</span>
                    <strong>{predictions.interviewSuccessPct}%</strong>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Resume ATS compatibility:</span>
                    <strong>{predictions.atsSuccessPct}%</strong>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Expected Salary Band:</span>
                    <strong style={{ color: 'var(--accent-clay)' }}>{predictions.expectedSalaryBand}</strong>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Stagnation Risk:</span>
                    <span style={{ textTransform: 'uppercase', fontWeight: 600, color: predictions.riskLevel === 'low' ? '#10b981' : predictions.riskLevel === 'medium' ? '#f59e0b' : '#ef4444' }}>{predictions.riskLevel}</span>
                  </div>
                </div>

                {/* 30/60/90 days forecast timeline */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.5rem', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Readiness Forecast Timelines:</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                    <span>30d: {predictions.readinessForecast30Days}%</span>
                    <span>60d: {predictions.readinessForecast60Days}%</span>
                    <span>90d: {predictions.readinessForecast90Days}%</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', borderLeft: '2px solid var(--accent-clay)' }}>
                  💡 {predictions.aiExplanation}
                </div>
              </div>
            </div>
          )}

          {/* ══ INTERACTIVE EVENT SIMULATOR ══ */}
          <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.45)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem', color: 'var(--accent-clay)' }}>Event Simulator console</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Manually trigger profile actions to watch the Automation Engine run matching rules and recoveries.</p>

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <select 
                value={simEventType} 
                onChange={(e) => setSimEventType(e.target.value as any)}
                style={{ width: '100%', padding: '0.35rem', background: 'rgba(25,23,21,0.95)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
              >
                <option value="leetcode_solved">LeetCode Solved</option>
                <option value="github_push">GitHub commit</option>
                <option value="resume_modified">Resume modified</option>
                <option value="interview_completed">Interview completed</option>
                <option value="quiz_completed">Quiz completed</option>
                <option value="course_finished">Course finished</option>
                <option value="score_drop">Score drop</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={handleSimulateEvent} 
                disabled={simulatingEvent}
                style={{ background: 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', padding: '0.4rem 1.25rem', fontWeight: 600, fontSize: '0.8rem' }}
              >
                {simulatingEvent ? 'Triggering...' : 'Dispatch Event'}
              </button>
            </div>

            {/* Event history log rendering */}
            <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latest Simulated actions:</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem', maxHeight: '120px', overflowY: 'auto' }}>
                {events.slice(0, 4).map(e => (
                  <div key={e.id} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    🎯 [{e.type.replace('_', ' ')}] {e.description}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
