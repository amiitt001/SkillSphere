'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { auth } from '@/lib/firebase';
import type { 
  CopilotTask, 
  DailyBrief, 
  WeeklyPlan, 
  WeeklyReflection, 
  CopilotMode, 
  ChatMessage 
} from '@/services/copilot/types';
import type { PlannedNotification } from '@/services/copilot/notificationPlanner';

export default function CopilotPage() {
  return (
    <ProtectedRoute>
      <CopilotDashboardContent />
    </ProtectedRoute>
  );
}

function CopilotDashboardContent() {
  // Brief and Plan state
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [reflection, setReflection] = useState<WeeklyReflection | null>(null);
  const [notifications, setNotifications] = useState<PlannedNotification[]>([]);
  const [briefLoading, setBriefLoading] = useState(true);

  // Tasks checklist state
  const [tasks, setTasks] = useState<CopilotTask[]>([]);
  const [newGoalInput, setNewGoalInput] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<'learning' | 'project' | 'job' | 'resume' | 'general'>('general');
  const [creatingTask, setCreatingTask] = useState(false);

  // Chat Console state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMode, setChatMode] = useState<CopilotMode>('General');
  const [sessionId] = useState<string>(() => `session_${Math.random().toString(36).substring(7)}`);

  // Document Reviewer state
  const [reviewType, setReviewType] = useState<'resume' | 'portfolio'>('resume');
  const [reviewInputText, setReviewInputText] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<any | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'brief' | 'chat' | 'checklist' | 'review'>('brief');

  useEffect(() => {
    loadBriefAndPlanner();
    loadTasks();
    loadNotifications();
  }, []);

  const loadBriefAndPlanner = async () => {
    setBriefLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};

      const [briefRes, planRes, reflectRes] = await Promise.all([
        fetch('/api/copilot/brief', { headers }),
        fetch('/api/copilot/plan', { headers }),
        fetch('/api/copilot/reflection', { headers })
      ]);

      if (briefRes.ok) {
        const d = await briefRes.json();
        if (d.success) setBrief(d.brief);
      }
      if (planRes.ok) {
        const d = await planRes.json();
        if (d.success) setPlan(d.plan);
      }
      if (reflectRes.ok) {
        const d = await reflectRes.json();
        if (d.success) setReflection(d.reflection);
      }
    } catch (err) {
      console.error('Error loading briefings:', err);
    } finally {
      setBriefLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};
      const res = await fetch('/api/copilot/tasks', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setTasks(d.tasks);
      }
    } catch (err) {
      console.error('Error loading checklist tasks:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};
      const res = await fetch('/api/copilot/notifications', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setNotifications(d.notifications);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const handleCreateTask = async () => {
    if (!newGoalInput.trim()) return;
    setCreatingTask(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/copilot/tasks', {
        method: 'POST',
        headers,
        body: JSON.stringify({ goal: newGoalInput, category: newGoalCategory })
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setTasks((prev) => [d.task, ...prev]);
          setNewGoalInput('');
        }
      }
    } catch (err) {
      console.error('Error generating tasks:', err);
    } finally {
      setCreatingTask(false);
    }
  };

  const handleToggleStep = async (taskId: string, stepIndex: number) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/copilot/tasks', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ taskId, stepIndex })
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setTasks((prev) => prev.map((t) => t.id === taskId ? d.task : t));
        }
      }
    } catch (err) {
      console.error('Error toggling step:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};

      const res = await fetch(`/api/copilot/tasks?taskId=${taskId}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setChatLoading(true);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userMessage: textToSend,
          sessionId,
          modeOverride: chatMode
        })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: d.response, timestamp: new Date().toISOString() }
          ]);
          setChatMode(d.mode);
        }
      }
    } catch (err) {
      console.error('Error in chat request:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleRunDocumentReview = async () => {
    if (!reviewInputText.trim()) return;
    setReviewLoading(true);
    setReviewResult(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/copilot/review', {
        method: 'POST',
        headers,
        body: JSON.stringify({ type: reviewType, contentText: reviewInputText })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setReviewResult(d.review);
        }
      }
    } catch (err) {
      console.error('Error analyzing document:', err);
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: '3rem' }}>
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div className="section-eyebrow" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-clay)' }}>Coaching & Accountability</div>
        <h1 className="page-title" style={{ fontSize: '2.25rem', color: 'var(--text-primary)', margin: '0.5rem 0' }}>AI Career Copilot</h1>
        <p className="page-subtitle" style={{ color: 'var(--text-muted)' }}>
          Your personal AI mentor, resume reviewer, mock interviewer, and accountability coach. The Copilot tracks your development gaps and helps organize your workflows.
        </p>
      </div>

      {/* Mode navigation */}
      <div className="difficulty-selector" style={{ marginBottom: '2rem', background: 'rgba(25, 23, 21, 0.65)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', display: 'flex', overflowX: 'auto', gap: '0.25rem' }}>
        <button className={`difficulty-option ${activeTab === 'brief' ? 'active' : ''}`} onClick={() => setActiveTab('brief')} style={{ flex: 1, whiteSpace: 'nowrap' }}>📰 Today's Briefing & Plan</button>
        <button className={`difficulty-option ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')} style={{ flex: 1, whiteSpace: 'nowrap' }}>💬 Chat Mentor Console</button>
        <button className={`difficulty-option ${activeTab === 'checklist' ? 'active' : ''}`} onClick={() => setActiveTab('checklist')} style={{ flex: 1, whiteSpace: 'nowrap' }}>📋 Goal Checklist Planner</button>
        <button className={`difficulty-option ${activeTab === 'review' ? 'active' : ''}`} onClick={() => setActiveTab('review')} style={{ flex: 1, whiteSpace: 'nowrap' }}>📄 Resume/Portfolio Reviewer</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Main Content Area */}
        <div style={{ minHeight: '400px' }}>

          {/* TAB 1: BRIEFING & PLAN */}
          {activeTab === 'brief' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {briefLoading ? (
                <p style={{ color: 'var(--text-muted)' }}>Generating briefings...</p>
              ) : brief ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fade-up">
                  {/* Daily Brief */}
                  <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, borderBottom: '1px solid rgba(212, 163, 115, 0.1)', paddingBottom: '0.75rem', marginBottom: '1rem', color: 'var(--accent-clay)' }}>Today's Priority Briefing</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                      <div>
                        <strong>Today's Focus:</strong>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{brief.priority}</p>
                      </div>
                      <div>
                        <strong>Target Skill:</strong>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{brief.recommendedSkill}</p>
                      </div>
                      <div>
                        <strong>Recommended Project Task:</strong>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{brief.recommendedProject}</p>
                      </div>
                      <div>
                        <strong>Coding Challenge:</strong>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{brief.codingChallenge}</p>
                      </div>
                      <div>
                        <strong>Learning Material:</strong>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{brief.learningResource}</p>
                      </div>
                      <div>
                        <strong>Interview Focus:</strong>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{brief.interviewQuestion}</p>
                      </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', background: 'rgba(212,163,115,0.04)', border: '1px solid rgba(212,163,115,0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                      💡 <strong>Motivational summary:</strong> {brief.motivationalSummary}
                    </div>
                  </div>

                  {/* Weekly Plan */}
                  {plan && (
                    <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, borderBottom: '1px solid rgba(212, 163, 115, 0.1)', paddingBottom: '0.75rem', marginBottom: '1rem', color: 'var(--accent-clay)' }}>Weekly Planning Schedule</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Key Priorities:</strong>
                          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {plan.priorities.map((p, idx) => <li key={idx}>{p}</li>)}
                          </ul>
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Learning Schedule:</strong>
                          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {plan.learningSchedule.map((p, idx) => <li key={idx}>{p}</li>)}
                          </ul>
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Coding & DSA:</strong>
                          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {plan.codingGoals.map((p, idx) => <li key={idx}>{p}</li>)}
                          </ul>
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Interview Prep:</strong>
                          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {plan.interviewPrep.map((p, idx) => <li key={idx}>{p}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Weekly Reflection */}
                  {reflection && (
                    <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, borderBottom: '1px solid rgba(212, 163, 115, 0.1)', paddingBottom: '0.75rem', marginBottom: '1rem', color: 'var(--accent-clay)' }}>Weekly Stagnation & Reflection</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', fontSize: '0.85rem' }}>
                        <div>
                          <strong style={{ color: '#10b981' }}>✓ Improvements:</strong>
                          <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                            {reflection.improved.map((x, i) => <li key={i}>{x}</li>)}
                          </ul>
                        </div>
                        <div>
                          <strong style={{ color: '#f59e0b' }}>⚠ Stagnation Points:</strong>
                          <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                            {reflection.stagnated.map((x, i) => <li key={i}>{x}</li>)}
                          </ul>
                        </div>
                        <div>
                          <strong style={{ color: '#ef4444' }}>✗ Missed Opportunities:</strong>
                          <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                            {reflection.missedOpportunities.map((x, i) => <li key={i}>{x}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Could not load briefs.</p>
              )}
            </div>
          )}

          {/* TAB 2: CHAT MENTOR CONSOLE */}
          {activeTab === 'chat' && (
            <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.45)', padding: 0, height: '520px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Chat Header Mode Switcher */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', borderBottom: '1px solid rgba(212, 163, 115, 0.1)' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Coaching Mode:</span>
                <select 
                  value={chatMode} 
                  onChange={(e) => setChatMode(e.target.value as CopilotMode)}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem', background: 'rgba(25, 23, 21, 0.85)', color: 'var(--text-primary)' }}
                >
                  <option value="General">General Assistant</option>
                  <option value="Mentor">Career Mentor</option>
                  <option value="Resume">Resume Coach</option>
                  <option value="Interview">Interview Coach</option>
                  <option value="Learning">Learning Mentor</option>
                  <option value="Project">Project Mentor</option>
                  <option value="Job">Job Advisor</option>
                </select>
              </div>

              {/* Chat Messages Log */}
              <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '1.25rem' }}>💬 Hello! I am your profile-aware Career Copilot.</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Ask me about interview questions, resume fixes, or target technologies.</p>
                    
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                      <button onClick={() => handleSendMessage('Do a mock interview drill for dynamic programming')} className="difficulty-option active" style={{ fontSize: '0.8rem', background: 'rgba(212,163,115,0.1)' }}>DP Mock Interview</button>
                      <button onClick={() => handleSendMessage('Review my resume keywords')} className="difficulty-option active" style={{ fontSize: '0.8rem', background: 'rgba(212,163,115,0.1)' }}>Keyword Scan</button>
                      <button onClick={() => handleSendMessage('Give me a weekly study schedule for Docker')} className="difficulty-option active" style={{ fontSize: '0.8rem', background: 'rgba(212,163,115,0.1)' }}>Docker Schedule</button>
                    </div>
                  </div>
                ) : (
                  messages.map((m, idx) => (
                    <div 
                      key={idx}
                      style={{
                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        background: m.role === 'user' ? 'var(--accent-clay)' : 'rgba(255,255,255,0.05)',
                        color: 'var(--text-primary)',
                        padding: '0.75rem 1rem',
                        borderRadius: m.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                        fontSize: '0.9rem',
                        lineHeight: '1.4'
                      }}
                    >
                      {m.content}
                    </div>
                  ))
                )}
                {chatLoading && (
                  <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Copilot is thinking...</div>
                )}
              </div>

              {/* Chat Input Console */}
              <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '0.75rem' }}>
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Send a message to your ${chatMode}...`}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.9rem', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(212,163,115,0.15)' }}
                />
                <button 
                  onClick={() => handleSendMessage()}
                  style={{ marginLeft: '0.5rem', background: 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CHECKLIST GOALS */}
          {activeTab === 'checklist' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Generator Goal Form */}
              <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.45)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Generate Goal Checklist</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Enter a high-level recommendation (e.g. "Master microservice caching") and the AI will generate a step-by-step actionable list.</p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    placeholder="e.g. Set up Kubernetes local cluster..." 
                    value={newGoalInput}
                    onChange={(e) => setNewGoalInput(e.target.value)}
                    style={{ flex: 1, minWidth: '220px', padding: '0.5rem' }}
                  />
                  <select 
                    value={newGoalCategory} 
                    onChange={(e) => setNewGoalCategory(e.target.value as any)}
                    style={{ padding: '0.5rem', background: 'rgba(25,23,21,0.85)', color: 'var(--text-primary)' }}
                  >
                    <option value="learning">Learning</option>
                    <option value="project">Project</option>
                    <option value="job">Job Application</option>
                    <option value="resume">Resume Edit</option>
                    <option value="general">General</option>
                  </select>
                  <button 
                    onClick={handleCreateTask}
                    disabled={creatingTask}
                    style={{ background: 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', padding: '0.5rem 1.25rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {creatingTask ? 'Generating...' : 'Add Checklist'}
                  </button>
                </div>
              </div>

              {/* Tasks List rendering */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {tasks.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No goal checklists created yet.</p>
                ) : (
                  tasks.map((task) => (
                    <div className="quiz-card" key={task.id} style={{ borderLeft: task.completed ? '4px solid #10b981' : '1px solid rgba(212,163,115,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', background: 'rgba(212,163,115,0.1)', color: 'var(--accent-clay)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>{task.category}</span>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>{task.title}</h4>
                        </div>
                        <button onClick={() => handleDeleteTask(task.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', fontSize: '0.8rem', cursor: 'pointer' }}>Delete</button>
                      </div>

                      {/* Checklist Steps */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {task.steps.map((step, idx) => (
                          <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: step.completed ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={step.completed} 
                              onChange={() => handleToggleStep(task.id, idx)} 
                            />
                            <span style={{ textDecoration: step.completed ? 'line-through' : 'none' }}>{step.text}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 4: DOCUMENT REVIEWER */}
          {activeTab === 'review' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.45)' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Proactive Resume & Portfolio Review</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Select review target, paste your resume text or GitHub repository summaries, and trigger the AI coach assessment scanner.</p>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input type="radio" checked={reviewType === 'resume'} onChange={() => setReviewType('resume')} />
                    <span>Resume Scan</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <input type="radio" checked={reviewType === 'portfolio'} onChange={() => setReviewType('portfolio')} />
                    <span>Portfolio / Git Assessment</span>
                  </label>
                </div>

                <div className="form-group">
                  <textarea 
                    value={reviewInputText} 
                    onChange={(e) => setReviewInputText(e.target.value)}
                    placeholder={reviewType === 'resume' ? 'Paste raw text from your resume here...' : 'Enter your GitHub profile bio, repository list, or repository README text...'}
                    style={{ width: '100%', height: '140px', padding: '0.75rem', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button 
                    onClick={handleRunDocumentReview}
                    disabled={reviewLoading || !reviewInputText.trim()}
                    style={{ background: 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', padding: '0.5rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {reviewLoading ? 'Analyzing...' : 'Run Review Scan'}
                  </button>
                </div>
              </div>

              {/* Review Scan Results */}
              {reviewResult && (
                <div className="quiz-card animate-fade-up" style={{ borderLeft: '4px solid var(--accent-clay)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Coach Review Assessment</h3>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-clay)' }}>{reviewResult.score}/100</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Estimated Appeal Score</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>Coaching Suggestions:</strong>
                      <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {reviewResult.suggestions.map((s: string, idx: number) => <li key={idx}>{s}</li>)}
                      </ul>
                    </div>

                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>Missing Keywords & Systems:</strong>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.35rem' }}>
                        {reviewResult.missingKeywords.map((k: string) => (
                          <span key={k} style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{k}</span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>Prioritized Action Items:</strong>
                      <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {reviewResult.actionItems.map((a: string, idx: number) => <li key={idx}>{a}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Sidebar Info Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Notifications Panel */}
          <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.45)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>Reminders & Alerts</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {notifications.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No active notifications.</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.15)', borderRadius: '4px', fontSize: '0.8rem', borderLeft: '2px solid var(--accent-clay)' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Context Alert</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick suggestions panel */}
          <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.45)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>Copilot Mode Guides</h4>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p>🤖 <strong>Resume Coach:</strong> Paste cv text to extract missing keywords and structure fixes.</p>
              <p>🎯 <strong>Interview Coach:</strong> Practice technical DSA explanations or mock behavioral answers.</p>
              <p>💡 <strong>Project Coach:</strong> Ask how to configure docker-compose or compile repository readmes.</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
