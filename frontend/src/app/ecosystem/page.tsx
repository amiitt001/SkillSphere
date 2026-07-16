'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { auth } from '@/lib/firebase';
import type { UserRole, HiringJob, JobApplication, MentorshipSession, CandidateRankInsight, EcosystemAuditLog } from '@/services/ecosystem/types';

export default function EcosystemPage() {
  return (
    <ProtectedRoute>
      <EcosystemDashboardContent />
    </ProtectedRoute>
  );
}

function EcosystemDashboardContent() {
  // Roles & Organizations
  const [activeRole, setActiveRole] = useState<UserRole>('Student');
  const [activeOrgId, setActiveOrgId] = useState<string>('org_iitb');
  const [roleLoading, setRoleLoading] = useState(true);

  // Recruiter data
  const [jobs, setJobs] = useState<HiringJob[]>([]);
  const [candidates, setCandidates] = useState<CandidateRankInsight[]>([]);
  const [searchSkills, setSearchSkills] = useState('');
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  // Recruiter form
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobType, setNewJobType] = useState<'full-time' | 'internship'>('internship');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newJobReqs, setNewJobReqs] = useState('');
  const [newJobSalary, setNewJobSalary] = useState('');
  const [newJobLoc, setNewJobLoc] = useState('');
  const [postingJob, setPostingJob] = useState(false);

  // University metrics
  const [universityStats, setUniversityStats] = useState<any>(null);
  const [placementForecast, setPlacementForecast] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Mentor platform data
  const [mentorsList, setMentorsList] = useState<any[]>([]);
  const [mentorSessions, setMentorSessions] = useState<MentorshipSession[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [mentorshipTopic, setMentorshipTopic] = useState('');
  const [mentorshipTime, setMentorshipTime] = useState('');
  const [schedulingSession, setSchedulingSession] = useState(false);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<EcosystemAuditLog[]>([]);

  useEffect(() => {
    loadUserConfiguration();
    loadJobsData();
    loadMentorData();
    loadAuditLogs();
  }, []);

  useEffect(() => {
    if (activeRole !== 'Student') {
      loadAnalyticsData();
      loadCandidates();
    }
  }, [activeRole, activeOrgId]);

  const loadUserConfiguration = async () => {
    setRoleLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};

      const res = await fetch('/api/ecosystem/profile', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setActiveRole(d.role);
          setActiveOrgId(d.organizationId);
        }
      }
    } catch (err) {
      console.error('Error loading config:', err);
    } finally {
      setRoleLoading(false);
    }
  };

  const handleSwitchRole = async (newRole: UserRole, newOrgId: string) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/ecosystem/profile', {
        method: 'POST',
        headers,
        body: JSON.stringify({ role: newRole, organizationId: newOrgId })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setActiveRole(d.role);
          setActiveOrgId(d.organizationId);
          // Log audit activity
          triggerAuditLog(`Switched role to ${newRole} in ${newOrgId}`);
        }
      }
    } catch (err) {
      console.error('Error switching role:', err);
    }
  };

  const loadJobsData = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};
      const res = await fetch('/api/ecosystem/jobs', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setJobs(d.jobs);
      }
    } catch (err) {
      console.error('Error loading jobs:', err);
    }
  };

  const loadCandidates = async (skillsQuery?: string) => {
    setCandidatesLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};
      const queryStr = skillsQuery ? `?skills=${skillsQuery}` : '';

      const res = await fetch(`/api/ecosystem/candidates${queryStr}`, { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setCandidates(d.candidates);
      }
    } catch (err) {
      console.error('Error loading candidates:', err);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const loadMentorData = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};
      const res = await fetch('/api/ecosystem/mentor', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setMentorsList(d.mentors);
          setMentorSessions(d.sessions);
          if (d.mentors.length > 0) setSelectedMentor(d.mentors[0]);
        }
      }
    } catch (err) {
      console.error('Error loading mentors:', err);
    }
  };

  const loadAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};
      const res = await fetch('/api/ecosystem/analytics', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setUniversityStats(d.stats);
          setPlacementForecast(d.forecast);
        }
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers = idToken ? { 'Authorization': `Bearer ${idToken}` } : {};
      const res = await fetch('/api/ecosystem/audit', { headers });
      if (res.ok) {
        const d = await res.json();
        if (d.success) setAuditLogs(d.logs);
      }
    } catch (err) {
      console.error('Error loading audit logs:', err);
    }
  };

  const triggerAuditLog = async (actionText: string) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      await fetch('/api/ecosystem/audit', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: actionText })
      });
      loadAuditLogs();
    } catch (err) {
      console.error('Error logging audit activity:', err);
    }
  };

  const handlePostJob = async () => {
    if (!newJobTitle.trim() || !newJobDesc.trim() || !newJobReqs.trim()) return;
    setPostingJob(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/ecosystem/jobs', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newJobTitle,
          type: newJobType,
          description: newJobDesc,
          requirements: newJobReqs,
          salary: newJobSalary,
          location: newJobLoc
        })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setJobs((prev) => [d.job, ...prev]);
          setNewJobTitle('');
          setNewJobDesc('');
          setNewJobReqs('');
          setNewJobSalary('');
          setNewJobLoc('');
          triggerAuditLog(`Posted new hiring campaign: ${d.job.title}`);
        }
      }
    } catch (err) {
      console.error('Error posting job:', err);
    } finally {
      setPostingJob(false);
    }
  };

  const handleScheduleMentorship = async () => {
    if (!selectedMentor || !mentorshipTopic.trim() || !mentorshipTime) return;
    setSchedulingSession(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/ecosystem/mentor', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mentorId: selectedMentor.id,
          mentorName: selectedMentor.name,
          scheduledAt: mentorshipTime,
          topic: mentorshipTopic
        })
      });

      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setMentorSessions((prev) => [d.session, ...prev]);
          setMentorshipTopic('');
          setMentorshipTime('');
          triggerAuditLog(`Scheduled mentorship session with ${d.session.mentorName}`);
        }
      }
    } catch (err) {
      console.error('Error booking slot:', err);
    } finally {
      setSchedulingSession(false);
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: '3rem' }}>
      
      {/* ══ SWITCH ROLE CONSOLE ══ */}
      <div className="quiz-card animate-fade-in" style={{ background: 'rgba(25, 23, 21, 0.65)', border: '1px solid var(--accent-clay)', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-clay)', textTransform: 'uppercase' }}>Multi-Tenant Console Switcher</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Simulate ecosystem workflows. Current tenant association: <strong>{activeOrgId === 'org_iitb' ? 'IIT Bombay' : activeOrgId === 'org_bits' ? 'BITS Pilani' : activeOrgId === 'org_google' ? 'Google India' : 'Razorpay'}</strong>
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button 
              className={`difficulty-option ${activeRole === 'Student' ? 'active' : ''}`}
              onClick={() => handleSwitchRole('Student', 'org_iitb')}
            >
              🎓 Student
            </button>
            <button 
              className={`difficulty-option ${activeRole === 'Recruiter' ? 'active' : ''}`}
              onClick={() => handleSwitchRole('Recruiter', 'org_google')}
            >
              💼 Recruiter
            </button>
            <button 
              className={`difficulty-option ${activeRole === 'Mentor' ? 'active' : ''}`}
              onClick={() => handleSwitchRole('Mentor', 'org_iitb')}
            >
              🧠 Mentor
            </button>
            <button 
              className={`difficulty-option ${activeRole === 'Faculty' ? 'active' : ''}`}
              onClick={() => handleSwitchRole('Faculty', 'org_bits')}
            >
              🏫 Faculty
            </button>
            <button 
              className={`difficulty-option ${activeRole === 'PlacementOfficer' ? 'active' : ''}`}
              onClick={() => handleSwitchRole('PlacementOfficer', 'org_iitb')}
            >
              📊 Placement Cell
            </button>
          </div>
        </div>
      </div>

      {roleLoading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading portal authorization details...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Main Dashboard Portal Grid */}
          <div>
            
            {/* PORTAL VIEW 1: STUDENT VIEW */}
            {activeRole === 'Student' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Ecosystem Mentor Appointments</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Connect with certified mentors to review your resume, Git repositories, or complete mock interviews.</p>
                  
                  {/* Appointment booking form */}
                  <div style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(212, 163, 115, 0.1)', marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Book Mentor Slot</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select Mentor</label>
                        <select 
                          value={selectedMentor?.id || ''}
                          onChange={(e) => setSelectedMentor(mentorsList.find(m => m.id === e.target.value))}
                          style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem', background: 'rgba(25, 23, 21, 0.95)', color: 'var(--text-primary)' }}
                        >
                          {mentorsList.map(m => <option key={m.id} value={m.id}>{m.name} ({m.specialty.join(', ')})</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select Date & Time</label>
                        <input 
                          type="datetime-local" 
                          value={mentorshipTime}
                          onChange={(e) => setMentorshipTime(e.target.value)}
                          style={{ width: '100%', padding: '0.35rem', marginTop: '0.2rem' }}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: '1.25rem' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Session Topic / Goals</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Code review on LRU Cache project" 
                        value={mentorshipTopic}
                        onChange={(e) => setMentorshipTopic(e.target.value)}
                        style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={handleScheduleMentorship}
                        disabled={schedulingSession}
                        style={{ background: 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', padding: '0.5rem 1.5rem', fontWeight: 600 }}
                      >
                        {schedulingSession ? 'Scheduling...' : 'Confirm Appointment'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scheduled sessions logs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Active Mentorship Plans</h3>
                  {mentorSessions.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No sessions booked yet.</p>
                  ) : (
                    mentorSessions.map((s) => (
                      <div className="quiz-card animate-fade-up" key={s.id} style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                          <div>
                            <strong style={{ fontSize: '0.95rem' }}>{s.topic}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>with {s.mentorName} • {new Date(s.scheduledAt).toLocaleString()}</div>
                          </div>
                          <span style={{ fontSize: '0.7rem', background: 'rgba(212,163,115,0.1)', color: 'var(--accent-clay)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>{s.status}</span>
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>AI-Assisted Mentoring Plan Checklist:</strong>
                          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {s.aiMentoringPlan.map((step, i) => <li key={i}>{step}</li>)}
                          </ul>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* PORTAL VIEW 2: RECRUITER & COMPANY PORTAL */}
            {activeRole === 'Recruiter' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Job posting form */}
                <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Launch Hiring Campaign</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>Define campaign eligibility criteria and target developer requirements to rank applications.</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Job Title</label>
                      <input 
                        type="text" 
                        value={newJobTitle} 
                        onChange={(e) => setNewJobTitle(e.target.value)} 
                        placeholder="e.g. Backend SDE intern" 
                        style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Job Type</label>
                      <select 
                        value={newJobType} 
                        onChange={(e) => setNewJobType(e.target.value as any)}
                        style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem', background: 'rgba(25,23,21,0.95)', color: 'var(--text-primary)' }}
                      >
                        <option value="internship">Internship</option>
                        <option value="full-time">Full-Time</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Salary Range</label>
                      <input 
                        type="text" 
                        value={newJobSalary} 
                        onChange={(e) => setNewJobSalary(e.target.value)} 
                        placeholder="e.g. ₹80,000 / mo" 
                        style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Location</label>
                      <input 
                        type="text" 
                        value={newJobLoc} 
                        onChange={(e) => setNewJobLoc(e.target.value)} 
                        placeholder="e.g. Remote" 
                        style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Skill Requirements (comma-separated)</label>
                    <input 
                      type="text" 
                      value={newJobReqs} 
                      onChange={(e) => setNewJobReqs(e.target.value)} 
                      placeholder="e.g. React, NodeJS, Docker" 
                      style={{ width: '100%', padding: '0.4rem', marginTop: '0.2rem' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Campaign details / description</label>
                    <textarea 
                      value={newJobDesc} 
                      onChange={(e) => setNewJobDesc(e.target.value)} 
                      placeholder="Describe target objectives..." 
                      style={{ width: '100%', height: '80px', padding: '0.5rem', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={handlePostJob} 
                      disabled={postingJob}
                      style={{ background: 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', padding: '0.5rem 1.5rem', fontWeight: 600 }}
                    >
                      {postingJob ? 'Launching...' : 'Post Job Campaign'}
                    </button>
                  </div>
                </div>

                {/* Candidate Discovery Search Engine */}
                <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>AI Candidate Match Search</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Search candidates using target skills and retrieve explainable AI Candidate rankings.</p>
                  
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="Enter skills: e.g. Docker, TypeScript" 
                      value={searchSkills} 
                      onChange={(e) => setSearchSkills(e.target.value)}
                      style={{ flex: 1, padding: '0.5rem' }}
                    />
                    <button 
                      onClick={() => loadCandidates(searchSkills)} 
                      style={{ background: 'var(--accent-clay)', border: 'none', color: 'var(--text-primary)', padding: '0.5rem 1.5rem', fontWeight: 600 }}
                    >
                      Search
                    </button>
                  </div>

                  {candidatesLoading ? (
                    <p style={{ color: 'var(--text-muted)' }}>Calculating matches...</p>
                  ) : candidates.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No student candidates found matching skills.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {candidates.map((cand) => (
                        <div key={cand.candidateId} style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(212,163,115,0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <div>
                              <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{cand.name}</strong>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{cand.email}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-clay)' }}>{cand.rankScore}% Match</div>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Readiness Index: {cand.readinessScore}/100</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
                            <div>
                              <strong style={{ color: 'var(--text-primary)' }}>Why Ranked:</strong>
                              <p style={{ color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{cand.justification}</p>
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                              <div>
                                <strong style={{ color: 'var(--text-primary)' }}>Confidence:</strong>
                                <span style={{ marginLeft: '0.4rem', textTransform: 'uppercase', color: cand.confidence === 'high' ? '#10b981' : cand.confidence === 'medium' ? '#f59e0b' : '#ef4444' }}>{cand.confidence}</span>
                              </div>
                              <div>
                                <strong style={{ color: 'var(--text-primary)' }}>Missing Skills Gaps:</strong>
                                <span style={{ marginLeft: '0.4rem', color: '#f87171' }}>{cand.missingSkills.join(', ') || 'None'}</span>
                              </div>
                            </div>

                            <div>
                              <strong style={{ color: 'var(--text-primary)' }}>Interview coaching pointers:</strong>
                              <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', marginTop: '0.2rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                {cand.interviewTips.map((tip, idx) => <li key={idx}>{tip}</li>)}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* PORTAL VIEW 3: UNIVERSITY, FACULTY & PLACEMENT CELL VIEW */}
            {(activeRole === 'Faculty' || activeRole === 'PlacementOfficer') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Stats cards summary */}
                {universityStats && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                    <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.45)', padding: '1rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Student Readiness</span>
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-clay)', marginTop: '0.25rem' }}>{universityStats.averageReadiness}/100</div>
                    </div>
                    <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.45)', padding: '1rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Placement Ready Pct</span>
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-clay)', marginTop: '0.25rem' }}>{universityStats.placementReadyPct}%</div>
                    </div>
                    <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.45)', padding: '1rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Aggregated Skill Gaps</span>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>{universityStats.mostCommonMissingSkills.slice(0, 2).join(', ')}</div>
                    </div>
                  </div>
                )}

                {/* Placement Intelligence Forecast */}
                {placementForecast && (
                  <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, borderBottom: '1px solid rgba(212, 163, 115, 0.1)', paddingBottom: '0.5rem', marginBottom: '1.25rem', color: 'var(--accent-clay)' }}>AI Placement Intelligence Projections</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                      <div>
                        <strong>Ready Students:</strong>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', marginTop: '0.25rem' }}>{placementForecast.readyStudentsCount} candidates</p>
                      </div>
                      <div>
                        <strong>At-Risk Students (Need intervention):</strong>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444', marginTop: '0.25rem' }}>{placementForecast.highRiskStudentsCount} student</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                      <div>
                        <strong>Placement Success Probability:</strong>
                        <span style={{ marginLeft: '0.5rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-clay)' }}>{placementForecast.placementProbability}%</span>
                      </div>
                      <div>
                        <strong>Expected Salary Bands:</strong>
                        <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>{placementForecast.expectedSalaryBands}</span>
                      </div>
                      <div>
                        <strong>Campus drives curriculum adjustments:</strong>
                        <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          {placementForecast.campusDrivesRecommendation.map((rec: string, i: number) => <li key={i}>{rec}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* PORTAL VIEW 4: MENTOR PLATFORM VIEW */}
            {activeRole === 'Mentor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.4)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Active Mentee Schedules</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Track all assigned sessions, study roadmaps, and generate AI-assisted mentoring checklists.</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {mentorSessions.map((s) => (
                      <div key={s.id} style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(212, 163, 115, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                          <div>
                            <strong style={{ fontSize: '1rem' }}>Mentee: {s.menteeName}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scheduled Time: {new Date(s.scheduledAt).toLocaleString()}</div>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-clay)' }}>{s.topic}</span>
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>AI Session Roadmap:</strong>
                          <ul style={{ paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {s.aiMentoringPlan.map((step, idx) => <li key={idx}>{step}</li>)}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Sidebar Audit Logs Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Active jobs listing */}
            <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.45)', padding: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>Active Campaign Pipeline</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {jobs.map(j => (
                  <div key={j.id} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.15)', borderRadius: '4px', fontSize: '0.8rem' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{j.title}</strong>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{j.companyName} • {j.salary}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tenant audit log list */}
            <div className="quiz-card" style={{ background: 'rgba(25, 23, 21, 0.45)', padding: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>Tenant Audit Logs</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                {auditLogs.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No system logs yet.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} style={{ fontSize: '0.7rem', padding: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <span style={{ color: 'var(--accent-clay)' }}>{log.actorEmail.split('@')[0]}</span>: {log.action}
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '0.1rem' }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
